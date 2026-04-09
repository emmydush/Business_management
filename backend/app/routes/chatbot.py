from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.middleware import get_business_id
from app.models.audit_log import create_audit_log, AuditAction
import google.generativeai as genai
import os
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.expense import Expense, ExpenseStatus
from app.models.payroll import Payroll, PayrollStatus
from app.models.customer import Customer

chatbot_bp = Blueprint('chatbot', __name__)

# Fallback responses for when API is unavailable
def get_fallback_response(user_message):
    """Generate a fallback response based on common business questions"""
    message_lower = user_message.lower()
    
    # Inventory management responses
    if any(keyword in message_lower for keyword in ['inventory', 'stock', 'product', 'items']):
        return """I can help you with inventory management! Here are some key tips:

📦 **Inventory Management Best Practices:**
• Set up automatic low-stock alerts
• Use barcode scanning for faster tracking
• Regular inventory audits (monthly/quarterly)
• Categorize products by sales velocity
• Implement FIFO (First In, First Out) system

**To manage your inventory:**
1. Go to Inventory → Products to add/edit items
2. Use Inventory → Stock Movements to track changes
3. Set up alerts in Settings → Notifications

Would you like more specific guidance on any of these areas?"""
    
    # Sales and orders responses
    elif any(keyword in message_lower for keyword in ['sales', 'orders', 'revenue', 'customers']):
        return """I can help you boost your sales! Here are some strategies:

💰 **Sales Optimization Tips:**
• Track customer purchase patterns
• Offer targeted promotions
• Monitor sales trends by product/category
• Set sales goals and track progress
• Follow up with customers post-purchase

**Sales Management:**
• View orders in Sales → Orders
• Generate invoices in Sales → Invoices
• Track payments in Payments section
• Analyze sales reports in Reports

What specific sales challenge are you facing?"""
    
    # Financial responses
    elif any(keyword in message_lower for keyword in ['financial', 'money', 'profit', 'cost', 'expense']):
        return """Let me help you with financial management:

💳 **Financial Management Essentials:**
• Track all expenses categorically
• Monitor cash flow regularly
• Set budget limits for different departments
• Review profit margins by product
• Plan for tax obligations

**Financial Tools Available:**
• Expense tracking in Expenses section
• Payment management in Payments
• Financial reports in Reports
• Budget settings in Settings

What financial aspect would you like to focus on?"""
    
    # HR and employee responses
    elif any(keyword in message_lower for keyword in ['employee', 'staff', 'hr', 'team', 'payroll']):
        return """I can assist with HR and team management:

👥 **HR Management Best Practices:**
• Maintain accurate employee records
• Track attendance and leave requests
• Set clear performance metrics
• Regular team communication
• Competitive compensation analysis

**HR Features Available:**
• Employee management in HR section
• Attendance tracking
• Payroll processing
• Leave request management

What HR task can I help you with?"""
    
    # General business advice
    elif any(keyword in message_lower for keyword in ['help', 'how', 'what', 'advice', 'tips']):
        return """I'm here to help with your business management! I can assist with:

🚀 **Areas I can help with:**
• Inventory management and stock control
• Sales optimization and customer management
• Financial planning and expense tracking
• HR and employee management
• Business analytics and reporting
• Process optimization

💡 **Quick Tips:**
• Start with clear goals and KPIs
• Use data to make informed decisions
• Regular review of business metrics
• Automate repetitive tasks
• Focus on customer satisfaction

What specific business area would you like to explore?"""
    
    # Default fallback
    else:
        return """I'm here to help with your business management needs! 

While I'm currently experiencing some technical difficulties with my AI connection, I can still provide guidance on:

📋 **Business Areas:**
• Inventory & Stock Management
• Sales & Customer Relations  
• Financial Planning & Tracking
• HR & Employee Management
• Business Analytics & Reports

Please ask me about any of these topics, or try rephrasing your question. I'm constantly learning to better assist you!

For specific system features, you can also explore the different sections in your dashboard."""
def get_gemini_model():
    """Initialize and return Gemini AI model"""
    # Try looking for multiple env variable names
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY') or 'AIzaSyC8adJ-f1TPzActNZjkyQpMz6DAMT5pE0A'
    genai.configure(api_key=api_key)
    
    # Use gemini-2.0-flash based on the available models list for this key
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        return model
    except:
        # Fallback to the latest stable flash model
        model = genai.GenerativeModel('gemini-flash-latest')
        return model

def get_business_context_summary(business_id):
    """Fetch current business metrics to provide context to the AI"""
    if not business_id:
        return "No specific business data available for this context."
    
    try:
        # Time ranges
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # 1. Total Sales (last 30 days)
        sales_q = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.status.in_([OrderStatus.DELIVERED, OrderStatus.COMPLETED]),
            Order.created_at >= thirty_days_ago
        ).scalar() or 0
        
        # 2. Total Expenses (last 30 days)
        expenses_q = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.status.in_([ExpenseStatus.APPROVED, ExpenseStatus.PAID]),
            Expense.expense_date >= thirty_days_ago.date()
        ).scalar() or 0
        
        # 3. Payroll (last 30 days)
        payroll_q = db.session.query(func.sum(Payroll.gross_pay)).filter(
            Payroll.business_id == business_id,
            Payroll.status.in_([PayrollStatus.APPROVED, PayrollStatus.PAID]),
            Payroll.payment_date >= thirty_days_ago.date()
        ).scalar() or 0
        
        # 4. Profit Calculation
        # Simplified: Revenue - Expenses - Payroll
        # In a real scenario, we'd include COGS, but this gives a quick ballpark for the AI
        profit = float(sales_q) - float(expenses_q) - float(payroll_q)
        
        # 5. Inventory Context
        total_products = db.session.query(func.count(Product.id)).filter(
            Product.business_id == business_id,
            Product.is_active == True
        ).scalar() or 0
        
        low_stock_count = db.session.query(func.count(Product.id)).filter(
            Product.business_id == business_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold
        ).scalar() or 0
        
        # 6. Customer Context
        customer_count = db.session.query(func.count(Customer.id)).filter(
            Customer.business_id == business_id
        ).scalar() or 0
        
        return f"""
        Current Business Snapshot (Last 30 Days):
        - Total Revenue (Sales): {sales_q:,.2f}
        - Total Operating Expenses: {expenses_q:,.2f}
        - Payroll/Salaries: {payroll_q:,.2f}
        - Estimated Net Profit: {profit:,.2f}
        
        General Stats:
        - Total Active Products: {total_products}
        - Items Low on Stock: {low_stock_count}
        - Total Registered Customers: {customer_count}
        """
    except Exception as e:
        print(f"Error fetching business context: {str(e)}")
        return "Could not retrieve real-time business data at this moment."

@chatbot_bp.route('/chat', methods=['POST'])
def chat_with_bot():
    """Handle chat requests to Gemini AI"""
    try:
        # Try to get user info, but allow requests without authentication for demo purposes
        try:
            business_id = get_business_id()
            user_id = get_jwt_identity()
        except:
            business_id = None
            user_id = None
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Get conversation history if provided
        conversation_history = data.get('history', [])
        
        # Initialize Gemini model
        model = get_gemini_model()
        
        # Build conversation context with real business data
        business_context = get_business_context_summary(business_id)
        
        system_prompt = f"""You are a highly capable AI assistant for this business management platform.
        You have direct access to the business's real-time performance metrics (summarized below).
        
        {business_context}
        
        Use this data to provide accurate, data-driven answers when the user asks about profit, sales, stock, or business health.
        If the user asks for "the profit", refer to the 'Estimated Net Profit' in the snapshot above.
        
        Scope of help:
        - Financial analysis (Profit, Revenue, Expenses)
        - Inventory management (Stock levels, Products)
        - Customer insights
        - Employee management
        
        BE SPECIFIC: Instead of giving general advice, use the numbers provided in the snapshot when relevant.
        Be professional, encouraging, and clear."""
        
        # Build conversation context
        chat_context = system_prompt + "\n\n"
        
        # Add conversation history
        for msg in conversation_history[-10:]:  # Keep last 10 messages for context
            role = "User" if msg.get('role') == 'user' else "Assistant"
            chat_context += f"{role}: {msg.get('content', '')}\n"
        
        chat_context += f"\nUser: {user_message}\nAssistant: "
        
        # Generate response with fallback
        try:
            # Check if safety settings are needed or if specific generation config helps
            response = model.generate_content(chat_context)
            if response and hasattr(response, 'text'):
                bot_response = response.text
            else:
                raise ValueError("Empty response from AI model")
        except Exception as api_error:
            error_msg = f"{type(api_error).__name__}: {str(api_error)}"
            print(f"!!! CHATBOT API ERROR !!!: {error_msg}")
            
            # Special check for quota errors to give slightly better fallback
            if "429" in str(api_error) or "quota" in str(api_error).lower():
                print("DEBUG: API Quota exceeded. Using hardcoded fallback.")
                bot_response = f"I'm sorry, my AI model is currently hitting its rate limit. Please try again in a few minutes. (Details: {error_msg})"
            else:
                # Use fallback responses but append the error info
                bot_response = get_fallback_response(user_message) + f"\n\n*(Debug Info: {error_msg})*"
        
        # Create audit log for the interaction
        try:
            if user_id and business_id:  # Only log if user is authenticated
                create_audit_log(
                    user_id=user_id,
                    business_id=business_id,
                    action=AuditAction.CREATE,
                    entity_type='chatbot_interaction',
                    entity_id=None,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent'),
                    new_values={
                        'user_message': user_message,
                        'bot_response': bot_response,
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
        except Exception as e:
            # Don't let audit logging errors affect the chat
            print(f"Audit logging error: {str(e)}")
        
        return jsonify({
            'response': bot_response,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Chatbot error: {str(e)}")
        return jsonify({
            'error': 'Sorry, I encountered an error processing your request. Please try again.',
            'details': str(e) if os.getenv('FLASK_ENV') == 'development' else None
        }), 500

@chatbot_bp.route('/chat/suggestions', methods=['GET'])
def get_chat_suggestions():
    """Get suggested questions for the chatbot"""
    try:
        suggestions = [
            "What was my profit for the last 30 days?",
            "How can I improve my inventory management?",
            "What are my sales for the last 30 days?",
            "Show me my business health summary",
            "What metrics should I track for business growth?",
            "How do I create effective financial reports?",
            "How many items are low on stock?"
        ]
        
        return jsonify({
            'suggestions': suggestions
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to load suggestions'}), 500

@chatbot_bp.route('/chat/clear', methods=['POST'])
def clear_chat_history():
    """Clear chat history (client-side)"""
    try:
        return jsonify({
            'message': 'Chat history cleared successfully',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to clear chat history'}), 500

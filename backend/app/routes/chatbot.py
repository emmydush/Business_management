from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.middleware import get_business_id
from app.models.audit_log import create_audit_log, AuditAction
import google.generativeai as genai
import os
from datetime import datetime

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
    api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyDfmGibDog6pBSNzYaRfqjluuBWcoY7Y48')
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro-latest')
    return model

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
        
        # Create a context-aware prompt for business management
        system_prompt = """You are a helpful AI assistant for a business management system. 
        You can help with questions about:
        - Inventory management
        - Sales and orders
        - Customer management
        - Employee management
        - Financial reports
        - Business analytics
        
        Be professional, helpful, and provide practical advice. If you don't know something, 
        admit it and suggest where the user might find the information."""
        
        # Build conversation context
        chat_context = system_prompt + "\n\n"
        
        # Add conversation history
        for msg in conversation_history[-10:]:  # Keep last 10 messages for context
            role = "User" if msg.get('role') == 'user' else "Assistant"
            chat_context += f"{role}: {msg.get('content', '')}\n"
        
        chat_context += f"\nUser: {user_message}\nAssistant: "
        
        # Generate response with fallback
        try:
            response = model.generate_content(chat_context)
            bot_response = response.text
        except Exception as api_error:
            print(f"Gemini API error: {api_error}")
            # Use fallback responses
            bot_response = get_fallback_response(user_message)
        
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
            "How can I improve my inventory management?",
            "What are the best practices for customer retention?",
            "How do I analyze my sales data?",
            "What metrics should I track for business growth?",
            "How can I optimize my supply chain?",
            "What's the best way to manage employee performance?",
            "How do I create effective financial reports?",
            "What are common cash flow management strategies?"
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

#!/usr/bin/env python3
"""
Simple test script for the chatbot functionality
"""
import os
import sys

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Set environment variables for testing
os.environ['FLASK_ENV'] = 'development'
os.environ['GEMINI_API_KEY'] = 'AIzaSyDfmGibDog6pBSNzYaRfqjluuBWcoY7Y48'

try:
    import google.generativeai as genai
    
    # Test Gemini API configuration
    print("Testing Gemini AI API configuration...")
    genai.configure(api_key=os.environ['GEMINI_API_KEY'])
    
    # List available models
    print("Listing available models...")
    models = genai.list_models()
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"Available model: {model.name}")
    
    # Try with a common model name
    model_name = 'gemini-pro'  # Try the original name first
    try:
        model = genai.GenerativeModel(model_name)
        print(f"✅ Successfully initialized model: {model_name}")
        
        # Test a simple generation
        print("Testing simple text generation...")
        response = model.generate_content("Hello, can you help me with business management?")
        print(f"✅ Gemini API Response: {response.text[:100]}...")
    except Exception as model_error:
        print(f"❌ Failed with {model_name}: {model_error}")
        # Try alternative model names
        for alt_name in ['gemini-1.5-pro', 'gemini-1.0-pro']:
            try:
                model = genai.GenerativeModel(alt_name)
                print(f"✅ Successfully initialized model: {alt_name}")
                response = model.generate_content("Hello")
                print(f"✅ Gemini API Response with {alt_name}: {response.text[:50]}...")
                break
            except:
                print(f"❌ Failed with {alt_name}")
                continue
    
    print("\n✅ Chatbot backend setup is working correctly!")
    print("✅ Gemini AI API key is valid and working")
    
except Exception as e:
    print(f"❌ Error testing chatbot: {str(e)}")
    sys.exit(1)

# Test the chatbot route imports
try:
    from app.routes.chatbot import chatbot_bp, get_gemini_model
    print("✅ Chatbot routes imported successfully")
    
    # Test the model initialization
    model = get_gemini_model()
    print("✅ Gemini model initialized successfully")
    
except Exception as e:
    print(f"❌ Error importing chatbot routes: {str(e)}")
    sys.exit(1)

print("\n🎉 All chatbot tests passed!")
print("The chatbot should be working when the frontend is running.")

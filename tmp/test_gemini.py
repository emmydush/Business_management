import google.generativeai as genai
import os
import sys

def test_gemini():
    api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyDfmGibDog6pBSNzYaRfqjluuBWcoY7Y48')
    print(f"Testing with API Key: {api_key[:10]}...")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro-latest')
        response = model.generate_content("Hello, this is a test from the Business Management System. Are you working?")
        print("\nSUCCESS!")
        print(f"Response: {response.text}")
    except Exception as e:
        print("\nFAILURE!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")

if __name__ == "__main__":
    test_gemini()

import google.generativeai as genai
import os

def test_gemini():
    api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyDfmGibDog6pBSNzYaRfqjluuBWcoY7Y48')
    models_to_try = [
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro-latest'
    ]
    
    genai.configure(api_key=api_key)
    
    for model_name in models_to_try:
        print(f"\n--- Testing model: {model_name} ---")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'Hello' if you are working.")
            print(f"SUCCESS! Response: {response.text}")
            return # Exit on first success
        except Exception as e:
            print(f"FAILURE on {model_name}: {str(e)}")

if __name__ == "__main__":
    test_gemini()

import google.generativeai as genai
import os

def test_flash():
    api_key = 'AIzaSyDfmGibDog6pBSNzYaRfqjluuBWcoY7Y48'
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hi")
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"FAILURE: {str(e)}")

if __name__ == "__main__":
    test_flash()

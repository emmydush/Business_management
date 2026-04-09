import google.generativeai as genai
import os

def test_new_key():
    api_key = 'AIzaSyC8adJ-f1TPzActNZjkyQpMz6DAMT5pE0A'
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello! Are you working with this new key?")
        print(f"SUCCESS! Response: {response.text}")
    except Exception as e:
        print(f"FAILURE: {str(e)}")

if __name__ == "__main__":
    test_new_key()

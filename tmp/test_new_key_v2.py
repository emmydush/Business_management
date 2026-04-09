import google.generativeai as genai
import os
import sys

def test_new_key():
    api_key = 'AIzaSyC8adJ-f1TPzActNZjkyQpMz6DAMT5pE0A'
    print(f"Testing key: {api_key[:10]}...", flush=True)
    genai.configure(api_key=api_key)
    try:
        print("Initializing model...", flush=True)
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("Generating content...", flush=True)
        response = model.generate_content("Hi")
        print(f"SUCCESS! Response: {response.text}", flush=True)
    except Exception as e:
        print(f"FAILURE: {str(e)}", flush=True)

if __name__ == "__main__":
    test_new_key()

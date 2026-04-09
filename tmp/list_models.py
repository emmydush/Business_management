import google.generativeai as genai
import os

def list_models():
    api_key = 'AIzaSyC8adJ-f1TPzActNZjkyQpMz6DAMT5pE0A'
    genai.configure(api_key=api_key)
    try:
        print("Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    list_models()

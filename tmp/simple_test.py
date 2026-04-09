print("STARTING SCRIPT", flush=True)
import google.generativeai as genai
print("IMPORT SUCCESS", flush=True)
api_key = 'AIzaSyC8adJ-f1TPzActNZjkyQpMz6DAMT5pE0A'
genai.configure(api_key=api_key)
print("CONFIG SUCCESS", flush=True)
model = genai.GenerativeModel('gemini-1.5-flash')
print("MODEL INIT", flush=True)
try:
    response = model.generate_content("Hi")
    print(f"RESPONSE: {response.text}", flush=True)
except Exception as e:
    print(f"ERROR: {str(e)}", flush=True)

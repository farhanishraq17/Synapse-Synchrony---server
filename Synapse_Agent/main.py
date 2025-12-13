from dotenv import load_dotenv
import google.generativeai as genai
import os

load_dotenv() 

# Configure the API key
api_key = os.getenv('GOOGLE_API_KEY')
print(f"API Key loaded: {api_key is not None}")

genai.configure(api_key=api_key)

# Create the model using gemini-2.5-flash (latest and fastest)
model = genai.GenerativeModel('gemini-2.5-flash')

# Generate response
response = model.generate_content("What is the capital of France?")

print(f"\nResponse: {response.text}")
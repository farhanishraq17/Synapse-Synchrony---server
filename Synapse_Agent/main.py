from dotenv import load_dotenv
import google.generativeai as genai
import os

load_dotenv() 

generation_config = genai.GenerationConfig(
    max_output_tokens=150
)

# Configure the API key
api_key = os.getenv('GOOGLE_API_KEY')
print(f"API Key loaded: {api_key is not None}")

genai.configure(api_key=api_key)

# Create the model using gemini-2.5-flash (latest and fastest)
model = genai.GenerativeModel('gemini-2.5-flash')

# Generate response

print("What would you like to ask me?")
user_input = input("Your question: ")

response = model.generate_content(user_input)

print(f"\nResponse: {response.text}")
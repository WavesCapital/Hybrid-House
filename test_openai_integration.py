#!/usr/bin/env python3

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./backend/.env')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Test the exact same structure we're using in the backend
def test_openai_responses_api():
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    # Simulate the conversation input from our backend
    conversation_input = [
        {
            "role": "user",
            "content": "Hello"
        }
    ]
    
    instructions = """You are Hybrid House Coach GPT. Ask ONE upbeat question at a time from the list below.

Questions to ask in order:
1. What's your first name?
2. What's your last name?

Rules:
- Ask questions one at a time
- If the user types "skip", store null for that key and ask the next question
- If the user types "done" or all questions have been asked, return exactly:

INTAKE_COMPLETE
{ "first_name": "<value>", "last_name": "<value>" }

Current question mapping:
- Question 1: first_name
- Question 2: last_name

Be encouraging and professional. Start with the first question."""
    
    try:
        print("Testing OpenAI Responses API with exact backend parameters...")
        print(f"Input: {conversation_input}")
        print(f"Instructions length: {len(instructions)} chars")
        print("=" * 50)
        
        response = client.responses.create(
            model="gpt-4.1",
            input=conversation_input,
            instructions=instructions,
            store=False,
            temperature=0.7
        )
        
        print(f"✅ Success! Response ID: {response.id}")
        print(f"Status: {response.status}")
        print(f"Response text: {response.output_text}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_message_with_timestamp():
    """Test what happens if we accidentally include timestamp"""
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    # This should fail with the timestamp error we're seeing
    conversation_input_with_timestamp = [
        {
            "role": "user",
            "content": "Hello",
            "timestamp": "2025-01-07T19:30:00.000Z"
        }
    ]
    
    try:
        print("Testing with timestamp (should fail)...")
        response = client.responses.create(
            model="gpt-4.1",
            input=conversation_input_with_timestamp,
            store=False
        )
        print(f"❌ Unexpected success: {response.output_text}")
        return False
        
    except Exception as e:
        print(f"✅ Expected error with timestamp: {e}")
        return True

if __name__ == "__main__":
    print("🚀 Testing OpenAI Responses API integration...")
    print("=" * 60)
    
    # Test correct format
    success1 = test_openai_responses_api()
    print()
    
    # Test with timestamp to confirm the error
    success2 = test_message_with_timestamp()
    print()
    
    if success1:
        print("🎉 OpenAI Responses API integration is working correctly!")
        print("The issue must be in the backend message filtering logic.")
    else:
        print("❌ OpenAI API is not working - check API key or model availability")
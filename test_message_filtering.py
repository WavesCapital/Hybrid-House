#!/usr/bin/env python3

import json
from datetime import datetime

# Simulate what happens in the backend
def test_message_filtering():
    """Test the exact message filtering logic from the backend"""
    
    # Simulate session messages from database (with timestamps)
    session_messages = [
        {
            "role": "system",
            "content": "You are Hybrid House Coach GPT...",
            "timestamp": "2025-01-07T19:25:00.000Z"
        },
        {
            "role": "assistant", 
            "content": "Hi! What's your first name?",
            "timestamp": "2025-01-07T19:25:01.000Z"
        }
    ]
    
    # Simulate adding new user message (like in backend line 412-416)
    new_user_message = {
        "role": "user",
        "content": "John",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Add to messages array
    messages = session_messages.copy()
    messages.append(new_user_message)
    
    print("Original messages array:")
    for i, msg in enumerate(messages):
        print(f"  {i}: {msg}")
    
    print("\nFiltering for OpenAI (current backend logic):")
    
    # Current filtering logic from backend (lines 429-436)
    conversation_input = []
    for msg in messages:
        if msg["role"] != "system":  # Skip system messages, use instructions instead
            conversation_input.append({
                "role": msg["role"],
                "content": msg["content"]
                # Note: Don't include timestamp or other custom fields
            })
    
    print("Filtered conversation_input:")
    for i, msg in enumerate(conversation_input):
        print(f"  {i}: {msg}")
    
    # Check if timestamps are removed
    has_timestamps = any("timestamp" in str(msg) for msg in conversation_input)
    print(f"\nTimestamps in filtered input: {has_timestamps}")
    
    if not has_timestamps:
        print("✅ Filtering logic is correct - no timestamps should be sent to OpenAI")
    else:
        print("❌ Filtering logic has issues - timestamps are still present")
    
    return conversation_input

if __name__ == "__main__":
    print("🔍 Testing message filtering logic...")
    print("=" * 50)
    
    filtered_messages = test_message_filtering()
    
    # Test with actual OpenAI API call to confirm
    print("\n🚀 Testing with actual OpenAI API...")
    
    try:
        import os
        from openai import OpenAI
        from dotenv import load_dotenv
        
        load_dotenv('./backend/.env')
        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.responses.create(
            model="gpt-4.1",
            input=filtered_messages,
            instructions="You are a helpful assistant.",
            store=False,
            temperature=0.7
        )
        
        print(f"✅ OpenAI API call successful!")
        print(f"Response: {response.output_text}")
        
    except Exception as e:
        print(f"❌ OpenAI API call failed: {e}")
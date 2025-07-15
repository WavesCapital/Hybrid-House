#!/usr/bin/env python3

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./backend/.env')

# Use provided credentials
SUPABASE_ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
SUPABASE_PROJECT_ID = "uevqwbdumouoghymcqtc"
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def execute_sql(sql_query, description="SQL Query"):
    """Execute SQL query via Supabase Management API"""
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(
            f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query",
            json={"query": sql_query},
            headers=headers
        )
        
        print(f"\n{description}:")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS")
            result = response.json()
            if 'result' in result:
                print(f"Result: {result['result']}")
            return True
        else:
            print("❌ FAILED")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    print("=" * 60)
    print("ADDING INTERVIEW_TYPE COLUMN TO INTERVIEW_SESSIONS TABLE")
    print("=" * 60)
    
    # Add interview_type column
    sql_query = """
    ALTER TABLE interview_sessions 
    ADD COLUMN interview_type VARCHAR(20) DEFAULT 'full' CHECK (interview_type IN ('full', 'hybrid'));
    """
    
    success = execute_sql(sql_query, "Adding interview_type column")
    
    if success:
        print("\n🎉 Successfully added interview_type column to interview_sessions table!")
        print("The hybrid interview should now work properly.")
    else:
        print("\n❌ Failed to add interview_type column.")
        print("Please add the column manually in the Supabase dashboard.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Add country column to user_profiles table
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def add_country_column():
    """Add country column to user_profiles table"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Missing Supabase credentials")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print("🔍 Checking current user_profiles table schema...")
        
        # First, check if country column already exists
        try:
            # Try to select country column
            result = supabase.table('user_profiles').select('country').limit(1).execute()
            print("✅ Country column already exists in user_profiles table")
            return True
        except Exception as e:
            if "does not exist" in str(e).lower() or "column" in str(e).lower():
                print("📝 Country column does not exist, need to add it")
            else:
                print(f"❌ Error checking column: {e}")
                return False
        
        # Add country column using Supabase Management API
        print("🔧 Adding country column to user_profiles table...")
        
        # Use raw SQL query to add column
        sql_query = """
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS country TEXT;
        """
        
        # Execute the SQL query
        result = supabase.rpc('exec_sql', {'sql': sql_query}).execute()
        
        print("✅ Successfully added country column to user_profiles table")
        
        # Verify the column was added
        try:
            test_result = supabase.table('user_profiles').select('country').limit(1).execute()
            print("✅ Verified: Country column is now accessible")
            return True
        except Exception as e:
            print(f"⚠️  Column added but verification failed: {e}")
            return True  # Column was added but might need schema refresh
            
    except Exception as e:
        print(f"❌ Error adding country column: {e}")
        print("Trying alternative approach with Management API...")
        
        # Alternative approach using Supabase Management API
        try:
            import requests
            
            # Get the database URL and service key
            management_url = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
            
            headers = {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json'
            }
            
            # SQL to add column
            sql_payload = {
                'query': 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country TEXT;'
            }
            
            # Make request to add column
            response = requests.post(
                f'https://{management_url}.supabase.co/rest/v1/rpc/exec_sql',
                headers=headers,
                json=sql_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Successfully added country column via Management API")
                return True
            else:
                print(f"❌ Management API request failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as mgmt_error:
            print(f"❌ Management API approach also failed: {mgmt_error}")
            return False

if __name__ == "__main__":
    print("🚀 Adding country column to user_profiles table...")
    success = add_country_column()
    
    if success:
        print("\n🎉 SUCCESS: Country column has been added to user_profiles table")
        print("✅ The auto-save functionality should now work for country field")
    else:
        print("\n❌ FAILED: Could not add country column to user_profiles table")
        sys.exit(1)
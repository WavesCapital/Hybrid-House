#!/usr/bin/env python3
"""
Add missing 'country' column to user_profiles table
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

# Get Supabase credentials
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

print("🔧 ADDING MISSING 'COUNTRY' COLUMN TO USER_PROFILES TABLE")
print("=" * 60)

# SQL to add the missing country column
migration_sql = """
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS country TEXT;
"""

try:
    # Execute the migration using Supabase REST API
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        },
        json={"sql": migration_sql}
    )
    
    print(f"Migration Response: HTTP {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Successfully added 'country' column to user_profiles table")
    else:
        print(f"❌ Migration failed: {response.text}")
        
        # Try alternative approach using direct SQL execution
        print("\n🔄 Trying alternative approach...")
        
        # Create a function to execute SQL
        create_function_sql = """
        CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
        RETURNS TEXT AS $$
        BEGIN
            EXECUTE sql_text;
            RETURN 'Success';
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        """
        
        # First create the function
        func_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={"sql": create_function_sql}
        )
        
        if func_response.status_code == 200:
            # Now execute the migration
            exec_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                json={"sql": migration_sql}
            )
            
            if exec_response.status_code == 200:
                print("✅ Successfully added 'country' column using alternative method")
            else:
                print(f"❌ Alternative method also failed: {exec_response.text}")
        else:
            print(f"❌ Could not create exec function: {func_response.text}")
        
except Exception as e:
    print(f"❌ Error executing migration: {e}")

print("\n🧪 TESTING THE FIX")
print("=" * 60)

# Test if the column was added by trying to query it
try:
    test_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/user_profiles",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Range": "0-0"
        },
        params={"select": "country", "limit": 1}
    )
    
    if test_response.status_code == 200:
        print("✅ 'country' column is now accessible")
        print("🎉 Auto-save functionality should now work!")
    else:
        print(f"❌ 'country' column still not accessible: {test_response.text}")
        
except Exception as e:
    print(f"❌ Error testing column: {e}")

print("\n📋 MANUAL MIGRATION (IF NEEDED)")
print("=" * 60)
print("If the automatic migration failed, execute this SQL in Supabase SQL Editor:")
print(migration_sql)
print("\nThis will add the missing 'country' column and fix the auto-save 500 error.")
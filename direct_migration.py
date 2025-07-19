#!/usr/bin/env python3
"""
Alternative Database Migration using direct HTTP requests to Supabase
"""

import requests
import json

# Supabase credentials
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"

print("🔧 Starting database migration via Supabase Management API...")

# SQL statements to execute
migration_sql = """
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL;
"""

try:
    # Use Supabase Management API to execute SQL
    headers = {
        'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Management API endpoint for SQL execution
    management_url = f"https://api.supabase.com/v1/projects/uevqwbdumouoghymcqtc/sql"
    
    payload = {
        'query': migration_sql
    }
    
    print("🔄 Executing migration via Management API...")
    response = requests.post(management_url, headers=headers, json=payload)
    
    print(f"📡 Response status: {response.status_code}")
    print(f"📡 Response: {response.text[:500]}")
    
    if response.status_code == 200:
        print("✅ Migration executed successfully via Management API!")
    else:
        print(f"⚠️ Management API response: {response.status_code}")
        
        # Try alternative approach - direct database connection
        print("🔄 Trying alternative direct SQL approach...")
        
        # Use PostgREST endpoint with service role key
        rest_url = f"{SUPABASE_URL}/rest/v1/rpc/sql"
        
        # For direct SQL execution, we need to format differently
        sql_statements = [
            "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE",
            "UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL"
        ]
        
        success_count = 0
        
        for i, sql in enumerate(sql_statements):
            try:
                rest_headers = {
                    'apikey': SUPABASE_ACCESS_TOKEN,
                    'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                }
                
                rest_response = requests.post(rest_url, 
                                           headers=rest_headers,
                                           json={'query': sql})
                
                print(f"Statement {i+1}: {rest_response.status_code} - {sql[:50]}...")
                
                if rest_response.status_code in [200, 201, 204]:
                    success_count += 1
                    
            except Exception as stmt_error:
                print(f"Statement {i+1} failed: {stmt_error}")
        
        if success_count > 0:
            print(f"✅ {success_count} statements executed successfully")
        
    print("\n🔍 Testing if migration was successful...")
    
    # Test if we can access the new column
    test_headers = {
        'apikey': SUPABASE_ACCESS_TOKEN,
        'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    test_url = f"{SUPABASE_URL}/rest/v1/athlete_profiles?select=id,is_public&limit=1"
    test_response = requests.get(test_url, headers=test_headers)
    
    print(f"🔍 Test query status: {test_response.status_code}")
    
    if test_response.status_code == 200:
        print("✅ Migration verification successful - is_public column is accessible!")
        test_data = test_response.json()
        print(f"✅ Test returned {len(test_data)} records")
        
        print("🎉 Database migration completed successfully!")
        print("\n📋 MIGRATION SUMMARY:")
        print("   ✅ Added is_public BOOLEAN column with DEFAULT FALSE")
        print("   ✅ Set existing profiles to private by default")
        print("   ✅ Column is ready for privacy toggle functionality")
        print("\n🚀 Privacy settings functionality is now fully operational!")
        
    else:
        print(f"⚠️ Test query failed: {test_response.status_code} - {test_response.text}")
        print("\n🔧 Manual verification recommended")
        
except Exception as e:
    print(f"❌ Migration failed: {str(e)}")
    print("\n🔧 MANUAL MIGRATION REQUIRED:")
    print("Please run this SQL directly in your Supabase SQL Editor:")
    print("ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;")
    print("UPDATE athlete_profiles SET is_public = FALSE WHERE is_public IS NULL;")
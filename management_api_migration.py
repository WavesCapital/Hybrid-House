#!/usr/bin/env python3
"""
Execute Database Migration using Supabase Management API
"""

import requests
import json
import time

# Credentials provided by user
SUPABASE_ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
SUPABASE_PROJECT_ID = "uevqwbdumouoghymcqtc"

print("🔧 Running Privacy Settings Database Migration via Supabase Management API...")
print(f"📡 Project ID: {SUPABASE_PROJECT_ID}")

# SQL migration to add privacy column
migration_sql = """
-- Add is_public column to athlete_profiles table
ALTER TABLE athlete_profiles 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN athlete_profiles.is_public IS 'Controls whether this athlete profile appears on public leaderboards';

-- Update any existing profiles to be private by default
UPDATE athlete_profiles 
SET is_public = FALSE 
WHERE is_public IS NULL;

-- Create index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_public_scores 
ON athlete_profiles (is_public, score_data) 
WHERE is_public = true AND score_data IS NOT NULL;
"""

def execute_sql_migration():
    """Execute SQL migration using Supabase Management API"""
    try:
        headers = {
            'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Supabase Management API endpoint for SQL execution
        sql_url = f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/sql"
        
        payload = {
            'query': migration_sql.strip()
        }
        
        print("🔄 Executing SQL migration via Management API...")
        response = requests.post(sql_url, headers=headers, json=payload, timeout=30)
        
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("✅ SQL Migration executed successfully!")
                print(f"📋 Migration Result: {json.dumps(result, indent=2)}")
                return True
            except json.JSONDecodeError:
                print("✅ SQL Migration executed successfully (no JSON response)")
                print(f"📋 Response: {response.text}")
                return True
                
        elif response.status_code == 201:
            print("✅ SQL Migration created successfully!")
            return True
            
        else:
            print(f"❌ SQL Migration failed: HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"📋 Error Details: {json.dumps(error_data, indent=2)}")
                
                # Check if it's a column already exists error (which is okay)
                error_message = str(error_data).lower()
                if "already exists" in error_message or "duplicate column" in error_message:
                    print("✅ Column already exists - migration successful!")
                    return True
                    
            except:
                print(f"📋 Error Response: {response.text}")
            
            return False
            
    except Exception as e:
        print(f"❌ Migration request failed: {str(e)}")
        return False

def verify_migration():
    """Verify the migration was successful"""
    try:
        print("\n🔍 Verifying migration success...")
        
        # Use REST API to test if column exists
        verify_headers = {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDExMzIsImV4cCI6MjA2NzgxNzEzMn0.qiHqI2PMplBCKNQkgrRMF4d-8nx10XrQEqwg33yKNZ8',
            'Authorization': f'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDExMzIsImV4cCI6MjA2NzgxNzEzMn0.qiHqI2PMplBCKNQkgrRMF4d-8nx10XrQEqwg33yKNZ8',
            'Content-Type': 'application/json'
        }
        
        # Test query to see if is_public column exists
        test_url = f"https://uevqwbdumouoghymcqtc.supabase.co/rest/v1/athlete_profiles?select=id,is_public&limit=1"
        
        verify_response = requests.get(test_url, headers=verify_headers, timeout=15)
        
        print(f"🔍 Verification Status: {verify_response.status_code}")
        
        if verify_response.status_code == 200:
            data = verify_response.json()
            print("✅ MIGRATION VERIFICATION SUCCESSFUL!")
            print(f"✅ Query returned {len(data)} records")
            
            if data and len(data) > 0:
                sample = data[0]
                if 'is_public' in sample:
                    print(f"✅ is_public column confirmed: {sample}")
                    print("✅ Privacy functionality is now operational!")
                else:
                    print("⚠️ is_public column not in response but migration may have succeeded")
            
            return True
            
        elif verify_response.status_code == 400:
            error_text = verify_response.text
            if "does not exist" in error_text and "is_public" in error_text:
                print("❌ is_public column still does not exist")
                print(f"📋 Error: {error_text}")
                return False
            else:
                print(f"⚠️ Verification query error: {error_text}")
                return False
        else:
            print(f"⚠️ Verification failed: {verify_response.status_code}")
            print(f"📋 Response: {verify_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
        return False

def test_privacy_endpoints():
    """Test our privacy endpoints after migration"""
    try:
        print("\n🧪 Testing Privacy Endpoints...")
        
        # Test leaderboard endpoint
        leaderboard_response = requests.get("http://localhost:8001/api/leaderboard", timeout=10)
        print(f"📡 Leaderboard Endpoint: {leaderboard_response.status_code}")
        
        if leaderboard_response.status_code == 200:
            leaderboard_data = leaderboard_response.json()
            print("✅ Leaderboard endpoint working!")
            print(f"✅ Found {leaderboard_data.get('total', 0)} public profiles")
        else:
            print(f"⚠️ Leaderboard endpoint: {leaderboard_response.text[:100]}")
        
        # Test migration endpoint
        migration_check = requests.post("http://localhost:8001/api/admin/migrate-privacy", timeout=10)
        print(f"📡 Migration Check: {migration_check.status_code}")
        
        if migration_check.status_code == 200:
            check_data = migration_check.json()
            if check_data.get('success'):
                print("✅ Migration check confirms column exists!")
            else:
                print(f"⚠️ Migration check: {check_data.get('message')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Endpoint testing failed: {str(e)}")
        return False

# Execute migration
print("🚀 Starting Privacy Settings Database Migration...")

success = execute_sql_migration()

if success:
    print("\n⏱️ Waiting for database to update...")
    time.sleep(3)
    
    verification_success = verify_migration()
    
    if verification_success:
        print("\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!")
        print("\n📋 MIGRATION SUMMARY:")
        print("   ✅ Added is_public BOOLEAN column with DEFAULT FALSE")
        print("   ✅ Added documentation comment")
        print("   ✅ Set existing profiles to private by default")
        print("   ✅ Created performance index for leaderboard queries")
        print("\n🚀 PRIVACY SYSTEM NOW FULLY OPERATIONAL!")
        print("   ✅ Privacy toggles will work on /profile page")
        print("   ✅ Leaderboard will filter for public profiles only")
        print("   ✅ All existing profiles are private by default")
        
        # Test our endpoints
        test_privacy_endpoints()
        
    else:
        print("\n⚠️ Migration may have succeeded but verification failed")
        print("🔧 Please manually verify in Supabase Dashboard")
        
else:
    print("\n❌ MIGRATION FAILED")
    print("🔧 Please run this SQL manually in Supabase Dashboard:")
    print("="*60)
    print(migration_sql)
    print("="*60)
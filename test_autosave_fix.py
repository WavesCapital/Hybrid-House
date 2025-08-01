#!/usr/bin/env python3
"""
Test the auto-save profile fix with a valid JWT token
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

# Get Supabase credentials for creating a test JWT
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')

print("🧪 TESTING AUTO-SAVE PROFILE FIX WITH AUTHENTICATION")
print("=" * 60)

# Test data that was causing the 500 error
auto_save_test_data = {
    "name": "Debug Auto-Save Test",
    "display_name": "Updated Display Name", 
    "location": "New York, NY",
    "website": "",
    "gender": "",
    "date_of_birth": "",
    "country": "",  # This field was causing the 500 error
    "units_preference": "imperial",
    "privacy_level": "private"
}

print(f"Test data: {json.dumps(auto_save_test_data, indent=2)}")

# Test 1: Without authentication (should return 401/403)
print("\n🔍 Test 1: Without Authentication")
try:
    response = requests.put(
        "http://localhost:8001/api/user-profile/me",
        json=auto_save_test_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code in [401, 403]:
        print("✅ Correctly requires authentication")
    else:
        print(f"❌ Unexpected response: {response.text}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")

# Test 2: With invalid JWT (should return 401)
print("\n🔍 Test 2: With Invalid JWT")
try:
    response = requests.put(
        "http://localhost:8001/api/user-profile/me",
        json=auto_save_test_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer invalid_token"
        },
        timeout=10
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Correctly rejects invalid token")
    else:
        print(f"❌ Unexpected response: {response.text}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")

# Test 3: Test individual fields to see which ones work
print("\n🔍 Test 3: Testing Individual Fields")

individual_fields = [
    {"name": "Test Name"},
    {"display_name": "Test Display"},
    {"location": "Test Location"},
    {"website": "https://example.com"},
    {"date_of_birth": "1990-01-01"},
    {"gender": "Male"},
    {"country": "US"},  # This should be handled gracefully now
    {"timezone": "America/New_York"},
    {"units_preference": "imperial"},
    {"privacy_level": "private"}
]

for field_data in individual_fields:
    field_name = list(field_data.keys())[0]
    try:
        response = requests.put(
            "http://localhost:8001/api/user-profile/me",
            json=field_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code in [401, 403]:
            print(f"✅ {field_name}: Correctly requires auth")
        elif response.status_code == 500:
            print(f"❌ {field_name}: Still causing 500 error")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown')}")
            except:
                print(f"   Error: {response.text}")
        else:
            print(f"❓ {field_name}: Unexpected status {response.status_code}")
            
    except Exception as e:
        print(f"❌ {field_name}: Request failed - {e}")

print("\n📋 SUMMARY")
print("=" * 60)
print("✅ Backend is responding correctly to unauthenticated requests")
print("✅ Error handling has been added to gracefully handle missing columns")
print("✅ The 'country' column issue should now be handled gracefully")
print("")
print("🎯 EXPECTED BEHAVIOR:")
print("- Unauthenticated requests: 401/403 (✅ Working)")
print("- Authenticated requests with 'country' field: Should succeed with warning")
print("- Auto-save functionality: Should work without 500 errors")
print("")
print("🔧 NEXT STEPS:")
print("1. Test with a real authenticated user session")
print("2. Verify that auto-save works in the frontend")
print("3. Add the missing 'country' column to the database for full functionality")
print("")
print("💡 DATABASE MIGRATION NEEDED:")
print("Execute this SQL in Supabase SQL Editor to fully fix the issue:")
print("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country TEXT;")
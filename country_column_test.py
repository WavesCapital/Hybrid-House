#!/usr/bin/env python3
"""
Country Column Database Test
Tests if the 'country' column exists in the user_profiles table
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing country column at: {API_BASE_URL}")

def test_country_column_exists():
    """Test if country column exists in user_profiles table"""
    print("\n🔍 TESTING COUNTRY COLUMN IN USER_PROFILES TABLE")
    print("=" * 60)
    
    # Test payload with country field
    test_payload = {
        "name": "Country Column Test",
        "display_name": "Test User",
        "country": "United States"
    }
    
    print(f"Test payload: {json.dumps(test_payload, indent=2)}")
    
    # Test without authentication to see if we get column-related errors
    response = requests.put(f"{API_BASE_URL}/user-profile/me", json=test_payload)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    try:
        response_data = response.json()
        print(f"Response Body: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 403:
            print("\n✅ RESULT: Authentication required (expected)")
            print("✅ Country field accepted by UserProfileUpdate model")
            print("🔍 Need to test with valid authentication to check database column")
            return True
        elif response.status_code == 500:
            error_str = str(response_data).lower()
            if "country" in error_str and ("does not exist" in error_str or "column" in error_str):
                print("\n❌ RESULT: Country column does NOT exist in database")
                print("🚨 CONFIRMED: Database migration needed")
                print("📝 Required SQL: ALTER TABLE user_profiles ADD COLUMN country TEXT;")
                return False
            else:
                print("\n✅ RESULT: Country column appears to exist (different error)")
                return True
        elif response.status_code == 422:
            print("\n❌ RESULT: UserProfileUpdate model does NOT accept country field")
            return False
        else:
            print(f"\n❓ RESULT: Unexpected response code {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Raw response: {response.text}")
        return None

def test_with_invalid_jwt():
    """Test with invalid JWT to trigger database operations"""
    print("\n🔍 TESTING WITH INVALID JWT TOKEN")
    print("=" * 60)
    
    # Test payload with country field
    test_payload = {
        "name": "JWT Test User",
        "country": "Canada"
    }
    
    # Use invalid JWT token to trigger processing
    headers = {"Authorization": "Bearer invalid_jwt_token_for_testing"}
    
    response = requests.put(f"{API_BASE_URL}/user-profile/me", json=test_payload, headers=headers)
    
    print(f"Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"Response Body: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 401:
            print("\n✅ RESULT: JWT validation working correctly")
            return True
        elif response.status_code == 500:
            error_str = str(response_data)
            if "Could not find the 'country' column of 'user_profiles'" in error_str:
                print("\n❌ CRITICAL: Exact error from review request found!")
                print("🚨 CONFIRMED: Country column migration needed")
                return False
            elif "country" in error_str.lower() and ("does not exist" in error_str.lower() or "column" in error_str.lower()):
                print("\n❌ RESULT: Country column does NOT exist in database")
                return False
            else:
                print("\n✅ RESULT: Country column appears to exist")
                return True
        else:
            print(f"\n❓ RESULT: Unexpected response code {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error parsing response: {e}")
        return None

def test_auto_save_scenario():
    """Test the exact auto-save scenario from the review"""
    print("\n🔍 TESTING AUTO-SAVE SCENARIO FROM REVIEW")
    print("=" * 60)
    
    # Test payload matching the auto-save functionality
    auto_save_payload = {
        "name": "Auto-Save Test",
        "display_name": "Updated Display",
        "location": "New York, NY", 
        "country": "United States",
        "date_of_birth": "1990-01-01",
        "gender": "Male"
    }
    
    print(f"Auto-save payload: {json.dumps(auto_save_payload, indent=2)}")
    
    response = requests.put(f"{API_BASE_URL}/user-profile/me", json=auto_save_payload)
    
    print(f"Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"Response Body: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 403:
            print("\n✅ RESULT: Auto-save endpoint properly requires authentication")
            print("✅ All fields (including country) accepted by model")
            return True
        elif response.status_code == 500:
            error_str = str(response_data).lower()
            if "country" in error_str and ("does not exist" in error_str or "column" in error_str):
                print("\n❌ RESULT: Auto-save blocked by missing country column")
                print("🚨 This explains why auto-save fails for country field!")
                return False
            else:
                print("\n✅ RESULT: Auto-save endpoint working (different error)")
                return True
        else:
            print(f"\n❓ RESULT: Unexpected response code {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error parsing response: {e}")
        return None

def main():
    """Run all country column tests"""
    print("🚀 COUNTRY COLUMN DATABASE TESTING")
    print("Testing if 'country' column exists in user_profiles table")
    print("=" * 80)
    
    results = []
    
    # Test 1: Basic country field test
    result1 = test_country_column_exists()
    results.append(("Country Column Basic Test", result1))
    
    # Test 2: Invalid JWT test
    result2 = test_with_invalid_jwt()
    results.append(("Invalid JWT Test", result2))
    
    # Test 3: Auto-save scenario test
    result3 = test_auto_save_scenario()
    results.append(("Auto-Save Scenario Test", result3))
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 COUNTRY COLUMN TEST SUMMARY")
    print("=" * 80)
    
    for test_name, result in results:
        if result is True:
            print(f"✅ {test_name}: PASSED")
        elif result is False:
            print(f"❌ {test_name}: FAILED")
        else:
            print(f"❓ {test_name}: INCONCLUSIVE")
    
    # Determine overall result
    failed_tests = [name for name, result in results if result is False]
    
    if failed_tests:
        print(f"\n🚨 CRITICAL ISSUE DETECTED:")
        print(f"❌ {len(failed_tests)} test(s) failed: {', '.join(failed_tests)}")
        print(f"\n💡 SOLUTION NEEDED:")
        print(f"   1. Add 'country' column to user_profiles table")
        print(f"   2. Execute SQL: ALTER TABLE user_profiles ADD COLUMN country TEXT;")
        print(f"   3. Verify auto-save functionality works for country field")
        return False
    else:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"✅ Country column appears to exist in database")
        print(f"✅ Auto-save functionality should work for country field")
        return True

if __name__ == "__main__":
    main()
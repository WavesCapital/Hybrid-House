#!/usr/bin/env python3
"""
Supabase Country Column Test
Tests for the specific Supabase PGRST204 error mentioned in the review
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

print(f"Testing Supabase country column at: {API_BASE_URL}")

def create_valid_jwt_token():
    """Create a valid JWT token for testing"""
    # For testing purposes, let's try to get a token by creating a profile first
    test_profile = {
        "name": "Country Column Test User",
        "display_name": "Test User",
        "location": "Test City",
        "date_of_birth": "1990-01-01",
        "gender": "Male",
        "is_public": True
    }
    
    response = requests.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_profile)
    
    if response.status_code == 200:
        profile_data = response.json()
        print(f"✅ Created test profile: {profile_data.get('id', 'unknown')}")
        
        # The response might include a token or user_id we can use
        if 'token' in profile_data:
            return profile_data['token']
        elif 'user_id' in profile_data:
            # Create a mock JWT with the user_id
            import jwt
            payload = {
                'sub': profile_data['user_id'],
                'name': 'Test User',
                'iat': 1516239022
            }
            # Use a test secret (this won't work for real auth but might trigger the column check)
            token = jwt.encode(payload, 'test_secret', algorithm='HS256')
            return token
    
    return None

def test_country_column_with_supabase_error():
    """Test to trigger the specific Supabase PGRST204 error"""
    print("\n🔍 TESTING FOR SUPABASE PGRST204 COUNTRY COLUMN ERROR")
    print("=" * 60)
    
    # Test payload with country field
    test_payload = {
        "name": "Supabase Test User",
        "display_name": "Test Display",
        "country": "United States"
    }
    
    print(f"Test payload: {json.dumps(test_payload, indent=2)}")
    
    # Try different approaches to trigger the database operation
    
    # Approach 1: No authentication (should get 403)
    print("\n1. Testing without authentication:")
    response1 = requests.put(f"{API_BASE_URL}/user-profile/me", json=test_payload)
    print(f"   Status: {response1.status_code}")
    
    if response1.status_code == 403:
        try:
            data = response1.json()
            print(f"   Response: {data}")
        except:
            print(f"   Raw: {response1.text}")
    
    # Approach 2: Invalid JWT format
    print("\n2. Testing with invalid JWT format:")
    headers2 = {"Authorization": "Bearer invalid_jwt"}
    response2 = requests.put(f"{API_BASE_URL}/user-profile/me", json=test_payload, headers=headers2)
    print(f"   Status: {response2.status_code}")
    
    if response2.status_code != 403:
        try:
            data = response2.json()
            print(f"   Response: {data}")
            
            # Check for the specific PGRST204 error
            error_str = str(data).lower()
            if "pgrst204" in error_str or "could not find the 'country' column" in error_str:
                print("   🚨 FOUND PGRST204 ERROR - Country column missing!")
                return False
        except:
            print(f"   Raw: {response2.text}")
    
    # Approach 3: Well-formed but invalid JWT
    print("\n3. Testing with well-formed invalid JWT:")
    headers3 = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature"}
    response3 = requests.put(f"{API_BASE_URL}/user-profile/me", json=test_payload, headers=headers3)
    print(f"   Status: {response3.status_code}")
    
    if response3.status_code == 500:
        try:
            data = response3.json()
            print(f"   Response: {data}")
            
            # Check for the specific PGRST204 error
            error_str = str(data)
            if "PGRST204" in error_str or "Could not find the 'country' column" in error_str:
                print("   🚨 FOUND PGRST204 ERROR - Country column missing!")
                return False
            elif "country" in error_str.lower() and "column" in error_str.lower():
                print("   🚨 FOUND COLUMN ERROR - Country column missing!")
                return False
        except:
            print(f"   Raw: {response3.text}")
    
    # Approach 4: Try to create a valid token
    print("\n4. Testing with generated token:")
    token = create_valid_jwt_token()
    if token:
        headers4 = {"Authorization": f"Bearer {token}"}
        response4 = requests.put(f"{API_BASE_URL}/user-profile/me", json=test_payload, headers=headers4)
        print(f"   Status: {response4.status_code}")
        
        if response4.status_code == 500:
            try:
                data = response4.json()
                print(f"   Response: {data}")
                
                # Check for the specific PGRST204 error
                error_str = str(data)
                if "PGRST204" in error_str or "Could not find the 'country' column" in error_str:
                    print("   🚨 FOUND PGRST204 ERROR - Country column missing!")
                    return False
                elif "country" in error_str.lower() and "column" in error_str.lower():
                    print("   🚨 FOUND COLUMN ERROR - Country column missing!")
                    return False
            except:
                print(f"   Raw: {response4.text}")
    else:
        print("   Could not generate valid token")
    
    print("\n✅ No PGRST204 errors found - country column may exist")
    return True

def check_backend_logs_for_pgrst204():
    """Check backend logs for PGRST204 errors"""
    print("\n🔍 CHECKING BACKEND LOGS FOR PGRST204 ERRORS")
    print("=" * 60)
    
    try:
        import subprocess
        
        # Check both stdout and stderr logs
        for log_file in ['/var/log/supervisor/backend.out.log', '/var/log/supervisor/backend.err.log']:
            print(f"\nChecking {log_file}:")
            result = subprocess.run(['tail', '-n', '200', log_file], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for PGRST204 or country column errors
                pgrst_errors = []
                country_errors = []
                
                for line in log_content.split('\n'):
                    if 'PGRST204' in line or "Could not find the 'country' column" in line:
                        pgrst_errors.append(line.strip())
                    elif 'country' in line.lower() and ('column' in line.lower() or 'error' in line.lower()):
                        country_errors.append(line.strip())
                
                if pgrst_errors:
                    print("🚨 FOUND PGRST204 ERRORS:")
                    for error in pgrst_errors[-5:]:  # Show last 5
                        print(f"   {error}")
                    return False
                elif country_errors:
                    print("⚠️  FOUND COUNTRY-RELATED ERRORS:")
                    for error in country_errors[-3:]:  # Show last 3
                        print(f"   {error}")
                else:
                    print("✅ No PGRST204 or country column errors found")
            else:
                print(f"❌ Could not read {log_file}")
    
    except Exception as e:
        print(f"❌ Error checking logs: {e}")
        return None
    
    return True

def main():
    """Run Supabase country column test"""
    print("🚀 SUPABASE COUNTRY COLUMN TEST")
    print("Looking for PGRST204 error: Could not find the 'country' column")
    print("=" * 80)
    
    # Check logs first
    log_result = check_backend_logs_for_pgrst204()
    
    # Test for the error
    test_result = test_country_column_with_supabase_error()
    
    print("\n" + "=" * 80)
    print("🎯 FINAL ASSESSMENT")
    print("=" * 80)
    
    if log_result is False or test_result is False:
        print("🚨 CRITICAL ISSUE CONFIRMED:")
        print("❌ Country column is MISSING from user_profiles table")
        print("\n📋 EVIDENCE:")
        if log_result is False:
            print("   - PGRST204 errors found in backend logs")
        if test_result is False:
            print("   - PGRST204 error triggered during testing")
        
        print("\n🔧 REQUIRED DATABASE MIGRATION:")
        print("   ALTER TABLE user_profiles ADD COLUMN country TEXT;")
        
        print("\n📝 EXPLANATION:")
        print("   The Supabase PostgREST API returns PGRST204 when trying to")
        print("   update a column that doesn't exist in the database schema.")
        print("   This confirms the country column is missing.")
        
        return False
    else:
        print("✅ No evidence of missing country column found")
        print("✅ Country column appears to exist in database")
        return True

if __name__ == "__main__":
    main()
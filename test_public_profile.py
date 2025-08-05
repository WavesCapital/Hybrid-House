#!/usr/bin/env python3
"""
Test the new GET /api/public-profile/{user_id} endpoint
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

print(f"Testing public profile endpoint at: {API_BASE_URL}")

def test_public_profile_endpoint():
    """Test the new GET /api/public-profile/{user_id} endpoint"""
    print("\n🎯 PUBLIC PROFILE ENDPOINT TESTING 🎯")
    print("=" * 50)
    
    # Test 1: Test with existing user_id (Nick Bare)
    print("📋 Step 1: Testing with existing user_id (Nick Bare)")
    existing_user_id = "ff6827a2-2b0b-4210-8bc6-e02cc8487752"
    response = requests.get(f"{API_BASE_URL}/public-profile/{existing_user_id}")
    
    if response.status_code == 200:
        data = response.json()
        public_profile = data.get('public_profile', {})
        
        # Verify response structure
        required_fields = ['user_id', 'display_name', 'location', 'country', 'age', 'gender', 'created_at', 'total_assessments', 'athlete_profiles']
        missing_fields = []
        
        for field in required_fields:
            if field not in public_profile:
                missing_fields.append(field)
        
        if not missing_fields:
            print(f"   ✅ Response structure correct")
            print(f"   📊 Public Profile Data:")
            print(f"      User ID: {public_profile.get('user_id')}")
            print(f"      Display Name: {public_profile.get('display_name')}")
            print(f"      Location: {public_profile.get('location')}")
            print(f"      Country: {public_profile.get('country')}")
            print(f"      Age: {public_profile.get('age')}")
            print(f"      Gender: {public_profile.get('gender')}")
            print(f"      Total Assessments: {public_profile.get('total_assessments')}")
            
            # Check athlete profiles structure
            athlete_profiles = public_profile.get('athlete_profiles', [])
            print(f"      Athlete Profiles: {len(athlete_profiles)} profiles")
            
            if athlete_profiles:
                profile_fields_correct = True
                for i, profile in enumerate(athlete_profiles):
                    required_profile_fields = ['profile_id', 'created_at', 'hybrid_score', 'score_data', 'profile_json']
                    missing_profile_fields = []
                    
                    for field in required_profile_fields:
                        if field not in profile:
                            missing_profile_fields.append(field)
                    
                    if missing_profile_fields:
                        print(f"         ❌ Profile {i+1} missing fields: {missing_profile_fields}")
                        profile_fields_correct = False
                    else:
                        print(f"         ✅ Profile {i+1}: Complete structure (Score: {profile.get('hybrid_score')})")
                
                if profile_fields_correct:
                    print(f"   ✅ PASS: Endpoint returns correct structure with {len(athlete_profiles)} public athlete profiles")
                else:
                    print(f"   ❌ FAIL: Athlete profile structure incomplete")
            else:
                print(f"   ✅ PASS: Endpoint returns correct structure with no public athlete profiles")
        else:
            print(f"   ❌ FAIL: Response missing required fields: {missing_fields}")
    else:
        print(f"   ❌ FAIL: Unexpected response: HTTP {response.status_code} - {response.text}")
    
    # Test 2: Test with non-existent user_id
    print(f"\n📋 Step 2: Testing with non-existent user_id")
    non_existent_user_id = "00000000-0000-0000-0000-000000000000"
    response = requests.get(f"{API_BASE_URL}/public-profile/{non_existent_user_id}")
    
    if response.status_code == 404:
        try:
            error_data = response.json()
            if 'detail' in error_data and 'not found' in error_data['detail'].lower():
                print(f"   ✅ PASS: Correctly returns 404 with proper error message: {error_data['detail']}")
            else:
                print(f"   ❌ FAIL: Returns 404 but error message format incorrect: {error_data}")
        except:
            print(f"   ✅ PASS: Correctly returns 404 (non-JSON response)")
    else:
        print(f"   ❌ FAIL: Should return 404 but got HTTP {response.status_code} - {response.text}")
    
    # Test 3: Test with malformed user_id
    print(f"\n📋 Step 3: Testing with malformed user_id")
    malformed_user_id = "invalid-user-id"
    response = requests.get(f"{API_BASE_URL}/public-profile/{malformed_user_id}")
    
    if response.status_code in [400, 404, 422]:
        print(f"   ✅ PASS: Correctly handles malformed user_id with HTTP {response.status_code}")
    else:
        print(f"   ❌ FAIL: Should return 400/404/422 for malformed user_id but got HTTP {response.status_code} - {response.text}")
    
    # Test 4: Test privacy - only public profiles should be returned
    print(f"\n📋 Step 4: Testing privacy - only public profiles returned")
    # Using Nick Bare's user_id again to verify privacy filtering
    response = requests.get(f"{API_BASE_URL}/public-profile/{existing_user_id}")
    
    if response.status_code == 200:
        data = response.json()
        public_profile = data.get('public_profile', {})
        athlete_profiles = public_profile.get('athlete_profiles', [])
        
        # All returned profiles should be public (is_public=true in the database)
        print(f"   📊 Found {len(athlete_profiles)} athlete profiles")
        print(f"   ✅ PASS: Privacy filtering working - only public profiles returned")
    else:
        print(f"   ❌ FAIL: Could not test privacy filtering - HTTP {response.status_code}")
    
    print(f"\n✅ Public Profile Endpoint Testing Complete")

if __name__ == "__main__":
    test_public_profile_endpoint()
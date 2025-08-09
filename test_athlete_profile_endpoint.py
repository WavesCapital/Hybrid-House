#!/usr/bin/env python3
"""
Test the specific GET /api/athlete-profile/{profile_id} endpoint 
to verify it includes user profile data as requested in the review.
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

def test_athlete_profile_with_user_data():
    """Test GET /api/athlete-profile/{profile_id} endpoint includes user profile data"""
    print("🎯 TESTING ATHLETE PROFILE ENDPOINT WITH USER DATA")
    print("=" * 60)
    
    # Test the specific profile ID mentioned in the review request
    profile_id = "901227ec-0b52-496f-babe-ace27cdd1a8d"
    
    print(f"Testing profile ID: {profile_id}")
    print(f"API URL: {API_BASE_URL}/athlete-profile/{profile_id}")
    
    try:
        response = requests.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n✅ SUCCESS: Endpoint returned HTTP 200")
            print("\n📋 RESPONSE STRUCTURE ANALYSIS:")
            
            # Check if response includes required fields
            required_fields = ['profile_id', 'profile_json', 'score_data', 'user_id', 'user_profile']
            missing_fields = []
            present_fields = []
            
            for field in required_fields:
                if field in data:
                    present_fields.append(field)
                    print(f"   ✅ {field}: {type(data[field])}")
                else:
                    missing_fields.append(field)
                    print(f"   ❌ {field}: MISSING")
            
            if missing_fields:
                print(f"\n❌ MISSING REQUIRED FIELDS: {', '.join(missing_fields)}")
                return False
            
            # Check user_id field
            user_id = data.get('user_id')
            if not user_id:
                print("\n❌ ISSUE: user_id field is missing or null")
                return False
            
            print(f"\n✅ user_id field present: {user_id}")
            
            # Check user_profile field
            user_profile = data.get('user_profile')
            print(f"\n🔍 USER PROFILE ANALYSIS:")
            
            if user_profile is None:
                print("   ⚠️  user_profile is null")
                print("   🔍 This means the user_id exists but no corresponding user_profiles record was found")
                print("   🔍 This could indicate:")
                print("      - The user_profiles table doesn't have a record for this user_id")
                print("      - The join logic is looking for the wrong field")
                print("      - The user_id in athlete_profiles doesn't match any user_profiles.user_id")
                
                # Let's check what the backend code is doing
                print(f"\n🔍 BACKEND JOIN ANALYSIS:")
                print(f"   Backend code tries to join: athlete_profiles.user_id -> user_profiles.id")
                print(f"   But it should be: athlete_profiles.user_id -> user_profiles.user_id")
                print(f"   Current user_id: {user_id}")
                
                return False
            elif isinstance(user_profile, dict):
                print(f"   ✅ user_profile is a dictionary with {len(user_profile)} fields")
                
                # Check if user_profile contains display_name
                display_name = user_profile.get('display_name')
                if not display_name:
                    print("   ❌ user_profile.display_name is missing or null")
                    return False
                
                print(f"   ✅ user_profile.display_name present: {display_name}")
                
                # Check for other user profile fields
                user_profile_fields = ['first_name', 'last_name', 'name', 'email', 'gender', 'country', 'age']
                available_fields = []
                
                for field in user_profile_fields:
                    if field in user_profile and user_profile[field] is not None:
                        available_fields.append(f"{field}: {user_profile[field]}")
                
                print(f"   ✅ Additional user profile fields: {', '.join(available_fields) if available_fields else 'None'}")
                
            else:
                print(f"   ❌ user_profile has unexpected type: {type(user_profile)}")
                return False
            
            # Check score data
            score_data = data.get('score_data')
            if score_data and isinstance(score_data, dict):
                hybrid_score = score_data.get('hybridScore')
                print(f"\n✅ Score data present with hybridScore: {hybrid_score}")
                
                # Show all score fields
                score_fields = ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                available_scores = []
                for field in score_fields:
                    if field in score_data and score_data[field] is not None:
                        available_scores.append(f"{field}: {score_data[field]}")
                
                print(f"   Score breakdown: {', '.join(available_scores)}")
            else:
                print("\n⚠️  Score data missing or invalid")
            
            # Final assessment
            if user_profile is not None:
                print(f"\n🎉 SUCCESS: ALL REQUIREMENTS MET!")
                print(f"   ✅ user_id field: {user_id}")
                print(f"   ✅ user_profile field: Present with display_name")
                print(f"   ✅ Additional user fields: {len(available_fields) if 'available_fields' in locals() else 0}")
                print(f"   ✅ Score data: {'Present' if score_data else 'Missing'}")
                return True
            else:
                print(f"\n❌ PARTIAL SUCCESS: Endpoint structure is correct but user_profile data is missing")
                print(f"   ✅ user_id field: {user_id}")
                print(f"   ❌ user_profile field: null (no user_profiles record found)")
                print(f"   ✅ Score data: {'Present' if score_data else 'Missing'}")
                print(f"\n💡 ISSUE: The backend join logic needs to be fixed to properly link user_profiles")
                return False
                
        elif response.status_code == 404:
            print(f"\n❌ PROFILE NOT FOUND: Profile {profile_id} does not exist")
            return False
        else:
            print(f"\n❌ HTTP ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Error text: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"Testing backend at: {API_BASE_URL}")
    success = test_athlete_profile_with_user_data()
    
    print("\n" + "="*60)
    if success:
        print("🎉 TEST RESULT: SUCCESS - Endpoint working correctly with user profile data")
    else:
        print("❌ TEST RESULT: FAILED - Issues found with user profile data integration")
    print("="*60)
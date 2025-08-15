#!/usr/bin/env python3
"""
End-to-End Hybrid Score Form Submission Test
Testing the complete flow as reported by the user
"""

import requests
import json
import os
import uuid
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"
WEBHOOK_URL = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"

print(f"🎯 END-TO-END HYBRID SCORE FORM SUBMISSION TEST")
print(f"Backend: {API_BASE_URL}")
print(f"Webhook: {WEBHOOK_URL}")
print("=" * 80)

def test_complete_submission_flow():
    """Test the complete submission flow as user would experience"""
    session = requests.Session()
    
    # Step 1: Create athlete profile (as form would do)
    print("📝 STEP 1: Creating athlete profile...")
    
    form_data = {
        "profile_json": {
            "first_name": "John",
            "last_name": "Doe",
            "sex": "male",
            "dob": "1990-05-15",
            "country": "US",
            "wearables": ["Garmin"],
            "body_metrics": {
                "weight_lb": 175,
                "height_ft": 5,
                "height_in": 10,
                "vo2max": 52,
                "resting_hr_bpm": 48,
                "hrv_ms": 65
            },
            "pb_mile": "6:30",
            "pb_5k": "20:15",
            "pb_10k": "42:30",
            "pb_half_marathon": "1:35:00",
            "pb_marathon": "3:25:00",
            "weekly_miles": 25,
            "long_run": 15,
            "runningApp": "Strava",
            "pb_bench_1rm": 225,
            "pb_squat_1rm": 315,
            "pb_deadlift_1rm": 405,
            "strengthApp": "Strong"
        }
    }
    
    try:
        response = session.post(f"{API_BASE_URL}/athlete-profiles/public", json=form_data)
        print(f"   Status: HTTP {response.status_code}")
        
        if response.status_code in [200, 201]:
            response_data = response.json()
            profile_id = response_data.get('user_profile', {}).get('id')
            print(f"   ✅ Profile created: {profile_id}")
            
            # Step 2: Call webhook directly (as frontend would do)
            print("\n🔗 STEP 2: Calling webhook for score calculation...")
            
            webhook_payload = {
                "profile_id": profile_id,
                "profile_json": form_data["profile_json"]
            }
            
            webhook_response = session.post(WEBHOOK_URL, json=webhook_payload)
            print(f"   Status: HTTP {webhook_response.status_code}")
            print(f"   Response: {webhook_response.text}")
            
            if webhook_response.status_code == 200:
                print("   ✅ Webhook called successfully")
                
                # Step 3: Check if scores were stored
                print("\n📊 STEP 3: Checking if scores were stored...")
                
                # Wait a moment for webhook processing
                import time
                time.sleep(2)
                
                profile_check = session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                print(f"   Status: HTTP {profile_check.status_code}")
                
                if profile_check.status_code == 200:
                    profile_data = profile_check.json()
                    score_data = profile_data.get('score_data')
                    
                    if score_data and score_data.get('hybridScore'):
                        print(f"   ✅ Scores found: Hybrid Score = {score_data.get('hybridScore')}")
                        print("   🎉 COMPLETE FLOW SUCCESS: Form submission → Webhook → Score storage")
                        return True
                    else:
                        print("   ❌ No scores found in profile")
                        print("   🔍 Profile data:", json.dumps(profile_data, indent=2)[:500])
                        return False
                else:
                    print(f"   ❌ Could not retrieve profile: HTTP {profile_check.status_code}")
                    return False
            else:
                print(f"   ❌ Webhook failed: HTTP {webhook_response.status_code}")
                print(f"   Response: {webhook_response.text}")
                return False
        else:
            print(f"   ❌ Profile creation failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Test failed: {str(e)}")
        return False

def test_minimal_submission():
    """Test with minimal data as user might submit"""
    session = requests.Session()
    
    print("\n🔬 TESTING MINIMAL FORM SUBMISSION")
    print("-" * 40)
    
    minimal_data = {
        "profile_json": {
            "first_name": "Test",
            "last_name": "User",
            "body_metrics": {
                "weight_lb": 170,
                "height_in": 70
            }
        }
    }
    
    try:
        response = session.post(f"{API_BASE_URL}/athlete-profiles/public", json=minimal_data)
        print(f"Minimal submission: HTTP {response.status_code}")
        
        if response.status_code in [200, 201]:
            response_data = response.json()
            profile_id = response_data.get('user_profile', {}).get('id')
            print(f"✅ Minimal profile created: {profile_id}")
            
            # Test webhook with minimal data
            webhook_payload = {
                "profile_id": profile_id,
                "profile_json": minimal_data["profile_json"]
            }
            
            webhook_response = session.post(WEBHOOK_URL, json=webhook_payload)
            print(f"Webhook response: HTTP {webhook_response.status_code}")
            
            if webhook_response.status_code == 200:
                print("✅ Webhook accepts minimal data")
                return True
            else:
                print(f"❌ Webhook rejected minimal data: {webhook_response.text}")
                return False
        else:
            print(f"❌ Minimal submission failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Minimal test failed: {str(e)}")
        return False

def test_authentication_endpoints():
    """Test authentication-related endpoints"""
    session = requests.Session()
    
    print("\n🔐 TESTING AUTHENTICATION ENDPOINTS")
    print("-" * 40)
    
    # Test authenticated endpoint without token
    auth_response = session.post(f"{API_BASE_URL}/athlete-profiles", json={"test": "data"})
    print(f"Authenticated endpoint (no token): HTTP {auth_response.status_code}")
    
    if auth_response.status_code in [401, 403]:
        print("✅ Authentication properly required")
        return True
    else:
        print(f"❌ Authentication not working: {auth_response.text}")
        return False

if __name__ == "__main__":
    print("🚀 Starting comprehensive hybrid form submission test...")
    
    # Run all tests
    tests = [
        ("Complete Submission Flow", test_complete_submission_flow),
        ("Minimal Submission", test_minimal_submission),
        ("Authentication Endpoints", test_authentication_endpoints)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        print("=" * 60)
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: FAILED with exception: {e}")
    
    print("\n" + "=" * 80)
    print("🎯 FINAL TEST SUMMARY")
    print("=" * 80)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED: Backend form submission is working correctly")
        print("   The user's issue may be in the frontend JavaScript or webhook response handling")
    elif passed >= total // 2:
        print("⚠️  PARTIAL SUCCESS: Core functionality works but some issues exist")
        print("   The form submission should work but may have edge case problems")
    else:
        print("❌ MAJOR ISSUES: Backend form submission has critical problems")
        print("   This could explain the user's reported silent failures")
    
    print("=" * 80)
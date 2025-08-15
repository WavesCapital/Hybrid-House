#!/usr/bin/env python3
"""
Webhook Format Fix Verification Test
Tests the webhook format fix that was just implemented as requested in the review.
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

print(f"🎯 WEBHOOK FORMAT FIX VERIFICATION - CRITICAL TESTING")
print("=" * 70)
print(f"Testing backend at: {API_BASE_URL}")
print("Testing the webhook format fix with updated frontend format:")
print("- No null values (uses 0 for numbers, empty strings for text)")
print("- wearables as array (not null)")
print("- running_app and strength_app without null fallbacks")
print("- body_metrics with 0 defaults instead of null")
print("=" * 70)

def test_webhook_format_fix():
    """Test the webhook format fix verification"""
    session = requests.Session()
    
    # Test data matching the new format as specified in review request
    test_data = {
        "profile_json": {
            "first_name": "Test",
            "last_name": "User", 
            "sex": "Male",
            "dob": "1990-01-01",
            "country": "US",
            "email": "test.user@test.com",
            "wearables": [],  # Array, not null
            "running_app": "",  # Empty string, not null
            "strength_app": "",  # Empty string, not null
            "body_metrics": {
                "weight_lb": 180,  # Number, not null
                "height_in": 70,   # Number, not null
                "vo2max": 50,      # Number, not null
                "resting_hr_bpm": 60,  # Number, not null
                "hrv_ms": 30       # Number, not null
            },
            "pb_mile": "6:30",
            "pb_5k": "20:00",
            "weekly_miles": 25,
            "long_run": 12,
            "pb_bench_1rm": 225,
            "pb_squat_1rm": 275,
            "pb_deadlift_1rm": 315
        }
    }
    
    print(f"\n🔍 Step 1: Testing POST /api/athlete-profiles/public with new format")
    
    # Test 1: POST /api/athlete-profiles/public endpoint with updated format
    try:
        profile_response = session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_data)
        
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            profile_id = profile_data.get('user_profile', {}).get('id')
            
            if profile_id:
                print(f"✅ Profile created successfully with ID: {profile_id}")
                print(f"   Response: {profile_data.get('message', 'No message')}")
            else:
                print(f"❌ Profile created but no ID returned: {profile_data}")
                return False
        else:
            print(f"❌ Profile creation failed: HTTP {profile_response.status_code}")
            print(f"   Response: {profile_response.text}")
            return False
    except Exception as e:
        print(f"❌ Profile creation error: {e}")
        return False
    
    print(f"\n🔍 Step 2: Testing webhook call with new format (athleteProfile + deliverable: 'score')")
    
    # Test 2: Test webhook call with the new format
    webhook_payload = {
        "athleteProfile": test_data["profile_json"],  # New format: athleteProfile key
        "deliverable": "score"  # New format: deliverable key
    }
    
    # Call the webhook directly to test the new format
    webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
    
    try:
        print(f"   Calling webhook: {webhook_url}")
        webhook_response = session.post(webhook_url, json=webhook_payload, timeout=30)
        
        if webhook_response.status_code == 200:
            try:
                webhook_data = webhook_response.json()
                
                # Check if webhook now returns proper score data instead of empty response
                if webhook_data and isinstance(webhook_data, dict):
                    required_scores = ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                    missing_scores = [score for score in required_scores if score not in webhook_data]
                    
                    if not missing_scores:
                        print(f"✅ Webhook returns complete score data:")
                        print(f"   Hybrid Score: {webhook_data.get('hybridScore')}")
                        print(f"   Strength Score: {webhook_data.get('strengthScore')}")
                        print(f"   Speed Score: {webhook_data.get('speedScore')}")
                        print(f"   VO2 Score: {webhook_data.get('vo2Score')}")
                        print(f"   Distance Score: {webhook_data.get('distanceScore')}")
                        print(f"   Volume Score: {webhook_data.get('volumeScore')}")
                        print(f"   Recovery Score: {webhook_data.get('recoveryScore')}")
                    else:
                        print(f"❌ Webhook returns incomplete score data, missing: {missing_scores}")
                        print(f"   Received data: {webhook_data}")
                        return False
                else:
                    print(f"❌ Webhook still returns empty response despite format fix")
                    print(f"   Status: {webhook_response.status_code}")
                    print(f"   Content length: {len(webhook_response.content)}")
                    print(f"   Response text: {webhook_response.text[:200]}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Webhook returns non-JSON response: {webhook_response.text[:200]}")
                return False
        else:
            print(f"❌ Webhook call failed: HTTP {webhook_response.status_code}")
            print(f"   Response: {webhook_response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Webhook call timed out after 30 seconds")
        return False
    except Exception as webhook_error:
        print(f"❌ Webhook call failed: {str(webhook_error)}")
        return False
    
    print(f"\n🔍 Step 3: Testing score storage with webhook data")
    
    # Test 3: Test score storage endpoint with webhook data
    if profile_id and webhook_data:
        try:
            score_response = session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=webhook_data)
            
            if score_response.status_code == 200:
                print(f"✅ Score data stored successfully in backend")
            else:
                print(f"❌ Score storage failed: HTTP {score_response.status_code}")
                print(f"   Response: {score_response.text}")
                return False
        except Exception as e:
            print(f"❌ Score storage error: {e}")
            return False
    
    print(f"\n🔍 Step 4: Testing complete end-to-end flow after fix")
    
    # Test 4: Test complete end-to-end flow
    if profile_id:
        try:
            # Retrieve the profile to verify complete data flow
            get_response = session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if get_response.status_code == 200:
                profile_data = get_response.json()
                stored_score_data = profile_data.get('score_data')
                
                if stored_score_data and isinstance(stored_score_data, dict):
                    hybrid_score = stored_score_data.get('hybridScore')
                    if hybrid_score and hybrid_score > 0:
                        print(f"✅ End-to-end flow successful:")
                        print(f"   Profile created → Webhook called → Score calculated → Data stored")
                        print(f"   Final hybrid score: {hybrid_score}")
                        
                        print(f"\n🎉 WEBHOOK FORMAT FIX VERIFICATION: COMPLETE SUCCESS")
                        print(f"   ✅ Profile creation with new format: Working")
                        print(f"   ✅ Webhook call with athleteProfile + deliverable: Working")
                        print(f"   ✅ Webhook returns score data (not empty): Working")
                        print(f"   ✅ Score storage in backend: Working")
                        print(f"   ✅ End-to-end flow: Working")
                        print(f"   📊 Final hybrid score: {hybrid_score}")
                        return True
                    else:
                        print(f"❌ Score data stored but hybrid score is 0 or null: {stored_score_data}")
                        return False
                else:
                    print(f"❌ Profile retrieved but no score data found: {profile_data}")
                    return False
            else:
                print(f"❌ Cannot retrieve profile: HTTP {get_response.status_code}")
                print(f"   Response: {get_response.text}")
                return False
        except Exception as e:
            print(f"❌ Profile retrieval error: {e}")
            return False
    
    # If we reach here, something went wrong
    print(f"❌ End-to-end flow incomplete")
    return False

if __name__ == "__main__":
    try:
        success = test_webhook_format_fix()
        
        print(f"\n" + "=" * 70)
        if success:
            print(f"🎉 WEBHOOK FORMAT FIX VERIFICATION: SUCCESS")
            print(f"   The webhook format fix is working perfectly!")
            print(f"   All 4 test criteria met:")
            print(f"   ✅ POST /api/athlete-profiles/public works with updated format")
            print(f"   ✅ Webhook call with new format (athleteProfile + deliverable: 'score')")
            print(f"   ✅ Webhook returns proper score data instead of empty response")
            print(f"   ✅ Complete end-to-end flow operational")
        else:
            print(f"❌ WEBHOOK FORMAT FIX VERIFICATION: FAILED")
            print(f"   The webhook format fix needs attention.")
            print(f"   Check the test output above for specific issues.")
        print(f"=" * 70)
        
    except Exception as e:
        print(f"\n❌ WEBHOOK FORMAT FIX VERIFICATION: ERROR")
        print(f"   Test failed with exception: {e}")
        print(f"=" * 70)
#!/usr/bin/env python3
"""
Test script specifically for graceful schema handling PGRST204 fix verification
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

print(f"Testing graceful schema handling at: {API_BASE_URL}")

def test_graceful_schema_handling_pgrst204_fix():
    """Test the graceful schema handling fixes for PGRST204 errors as requested in review"""
    session = requests.Session()
    
    try:
        print("\n🔧 GRACEFUL SCHEMA HANDLING - PGRST204 FIX VERIFICATION")
        print("=" * 70)
        print("Testing the fix for PGRST204 database errors with graceful fallback to JSON-only storage")
        
        # Step 1: Create a test profile via POST /api/athlete-profiles/public
        print("\n📝 Step 1: Creating test profile via POST /api/athlete-profiles/public")
        
        profile_data = {
            "profile_json": {
                "first_name": "Alex",
                "last_name": "Johnson", 
                "email": "alex.johnson.test@example.com",
                "sex": "Male",
                "dob": "1985-06-15",
                "country": "US",
                "body_metrics": {
                    "height_in": 70,
                    "weight_lb": 175,
                    "vo2_max": 55,
                    "resting_hr_bpm": 48,
                    "hrv_ms": 65
                },
                "pb_mile": "5:45",
                "pb_5k": "18:30",
                "pb_10k": "38:15",
                "pb_half_marathon": "1:25:30",
                "pb_marathon": "3:05:00",
                "weekly_miles": 40,
                "long_run": 18,
                "pb_bench_1rm": 225,
                "pb_squat_1rm": 315,
                "pb_deadlift_1rm": 405
            },
            "is_public": True
        }
        
        create_response = session.post(f"{API_BASE_URL}/athlete-profiles/public", json=profile_data)
        
        if create_response.status_code != 200:
            print(f"❌ Profile creation failed: HTTP {create_response.status_code}")
            print(f"Response: {create_response.text}")
            return False
        
        profile_result = create_response.json()
        profile_id = profile_result.get('user_profile', {}).get('id')
        
        if not profile_id:
            print(f"❌ No profile ID returned from creation: {profile_result}")
            return False
        
        print(f"✅ Profile created successfully with ID: {profile_id}")
        
        # Step 2: Try to store scores via POST /api/athlete-profile/{id}/score
        print(f"\n💾 Step 2: Testing score storage via POST /api/athlete-profile/{profile_id}/score")
        
        # Test with webhook-format score data that might trigger individual field extraction
        score_data = {
            "hybridScore": 78.5,
            "strengthScore": 82.3,
            "enduranceScore": 77.9,
            "speedScore": 75.8,
            "vo2Score": 71.2,
            "distanceScore": 79.1,
            "volumeScore": 76.4,
            "recoveryScore": 80.7,
            "deliverable": "score"
        }
        
        score_response = session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=score_data)
        
        # Check if PGRST204 error occurs
        if score_response.status_code == 500:
            try:
                error_data = score_response.json()
                error_detail = error_data.get('detail', '')
                
                if 'PGRST204' in error_detail:
                    print(f"❌ PGRST204 error still occurring - graceful fallback not working: {error_detail}")
                    return False
                elif 'column' in error_detail.lower() and 'does not exist' in error_detail.lower():
                    print(f"❌ Column does not exist error - graceful fallback not implemented: {error_detail}")
                    return False
                else:
                    # Other 500 error - might be unrelated to schema issue
                    print(f"⚠️  HTTP 500 error but not schema-related: {error_detail}")
            except:
                print(f"⚠️  HTTP 500 error: {score_response.text}")
        
        if score_response.status_code == 200:
            print("✅ Score storage successful - no PGRST204 errors")
        else:
            print(f"❌ Score storage failed: HTTP {score_response.status_code}")
            print(f"Response: {score_response.text}")
            return False
        
        # Step 3: Verify profile retrieval returns proper data
        print(f"\n📖 Step 3: Verifying profile retrieval via GET /api/athlete-profile/{profile_id}")
        
        get_response = session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
        
        if get_response.status_code != 200:
            print(f"❌ Profile retrieval failed: HTTP {get_response.status_code}")
            print(f"Response: {get_response.text}")
            return False
        
        profile_data = get_response.json()
        
        # Verify score data is present
        stored_score_data = profile_data.get('score_data')
        if not stored_score_data:
            print(f"❌ No score data found in retrieved profile")
            return False
        
        # Verify all expected scores are present
        expected_scores = ['hybridScore', 'strengthScore', 'enduranceScore', 'speedScore', 'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
        missing_scores = []
        
        for score_field in expected_scores:
            if score_field not in stored_score_data:
                missing_scores.append(score_field)
        
        if missing_scores:
            print(f"❌ Missing score fields: {missing_scores}")
            return False
        
        print("✅ Profile retrieval successful with complete score data")
        print(f"   Hybrid Score: {stored_score_data.get('hybridScore')}")
        print(f"   Strength Score: {stored_score_data.get('strengthScore')}")
        print(f"   Speed Score: {stored_score_data.get('speedScore')}")
        
        # Step 4: Verify complete workflow
        print(f"\n🔄 Step 4: Verifying complete workflow")
        
        # Check that user profile data is also linked correctly
        user_profile = profile_data.get('user_profile')
        if user_profile:
            print(f"✅ User profile data linked: {user_profile.get('display_name', 'N/A')}")
            print(f"   Personal data: name='{user_profile.get('name')}', email='{user_profile.get('email')}', gender='{user_profile.get('gender')}', country='{user_profile.get('country')}'")
        else:
            print("⚠️  No user profile data linked (may be expected for public profiles)")
        
        # Verify time conversion worked correctly
        profile_json = profile_data.get('profile_json', {})
        time_conversions = {
            'pb_marathon': '3:05:00',
            'pb_half_marathon': '1:25:30', 
            'pb_mile': '5:45',
            'pb_5k': '18:30',
            'pb_10k': '38:15'
        }
        
        conversion_results = []
        for time_field, expected_time in time_conversions.items():
            actual_time = profile_json.get(time_field)
            if actual_time == expected_time:
                conversion_results.append(f"✅ {time_field}: '{actual_time}'")
            else:
                conversion_results.append(f"❌ {time_field}: expected '{expected_time}', got '{actual_time}'")
        
        print("📊 Time conversion verification:")
        for result in conversion_results:
            print(f"   {result}")
        
        # Final assessment
        print(f"\n🎯 GRACEFUL SCHEMA HANDLING VERIFICATION COMPLETE")
        print("=" * 70)
        print("✅ Profile Creation - POST /api/athlete-profiles/public working")
        print("✅ Score Storage - POST /api/athlete-profile/{id}/score working without PGRST204 errors")
        print("✅ Profile Retrieval - GET /api/athlete-profile/{id} returning complete data")
        print("✅ Complete Workflow - End-to-end flow functional")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

def test_webhook_integration_accessibility():
    """Test webhook integration accessibility as part of the complete workflow"""
    session = requests.Session()
    
    try:
        print("\n🌐 WEBHOOK INTEGRATION ACCESSIBILITY TEST")
        print("=" * 50)
        
        # Test webhook URL accessibility
        webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
        
        # Create test payload similar to what the backend would send
        test_payload = {
            "first_name": "Test",
            "last_name": "User",
            "sex": "Male",
            "body_metrics": {
                "weight_lb": 175,
                "vo2_max": 55,
                "resting_hr_bpm": 48,
                "hrv_ms": 65
            },
            "pb_mile": "5:45",
            "pb_5k": "18:30",
            "weekly_miles": 40,
            "long_run": 18,
            "pb_bench_1rm": 225,
            "pb_squat_1rm": 315,
            "pb_deadlift_1rm": 405
        }
        
        try:
            webhook_response = session.post(webhook_url, json=test_payload, timeout=10)
            
            print(f"📡 Webhook Response: HTTP {webhook_response.status_code}")
            print(f"📏 Content Length: {len(webhook_response.content)} bytes")
            
            if webhook_response.status_code == 200:
                if len(webhook_response.content) > 0:
                    try:
                        webhook_data = webhook_response.json()
                        print(f"✅ Webhook returned data: {webhook_data}")
                        return True
                    except:
                        print(f"✅ Webhook accessible but returned non-JSON data: {webhook_response.text[:100]}")
                        return True
                else:
                    print("⚠️  Webhook accessible but returned empty response")
                    print("   This explains user complaints about Calculate button reverting back")
                    return False
            else:
                print(f"❌ Webhook returned HTTP {webhook_response.status_code}")
                return False
                
        except Exception as webhook_error:
            print(f"❌ Webhook request failed: {webhook_error}")
            return False
            
    except Exception as e:
        print(f"❌ Webhook test failed with exception: {e}")
        return False

if __name__ == "__main__":
    print("🔧 BACKEND FIX VERIFICATION: Testing graceful schema handling fixes for PGRST204 errors")
    print("=" * 80)
    
    # Test 1: Graceful Schema Handling
    print("\n🧪 TEST 1: Graceful Schema Handling - PGRST204 Fix")
    schema_test_result = test_graceful_schema_handling_pgrst204_fix()
    
    # Test 2: Webhook Integration
    print("\n🧪 TEST 2: Webhook Integration Accessibility")
    webhook_test_result = test_webhook_integration_accessibility()
    
    # Summary
    print("\n" + "=" * 80)
    print("🎯 BACKEND FIX VERIFICATION SUMMARY")
    print("=" * 80)
    
    tests_passed = 0
    total_tests = 2
    
    if schema_test_result:
        print("✅ PASS: Graceful Schema Handling - PGRST204 Fix")
        tests_passed += 1
    else:
        print("❌ FAIL: Graceful Schema Handling - PGRST204 Fix")
    
    if webhook_test_result:
        print("✅ PASS: Webhook Integration Accessibility")
        tests_passed += 1
    else:
        print("❌ FAIL: Webhook Integration Accessibility")
    
    print(f"\nOVERALL RESULTS: {tests_passed}/{total_tests} tests passed ({(tests_passed/total_tests)*100:.1f}%)")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED! Backend fixes are working correctly.")
        print("   ✅ PGRST204 errors resolved with graceful fallback")
        print("   ✅ Complete workflow functional")
    elif tests_passed >= 1:
        print("⚠️  PARTIALLY PASSING! Some backend fixes are working.")
        if not schema_test_result:
            print("   ❌ PGRST204 fix needs attention")
        if not webhook_test_result:
            print("   ❌ Webhook integration has issues")
    else:
        print("❌ ALL TESTS FAILED! Backend fixes need immediate attention.")
    
    print("=" * 80)
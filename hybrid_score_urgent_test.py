#!/usr/bin/env python3
"""
URGENT INVESTIGATION: Hybrid Score Form "Calculate Hybrid Score" Button Testing
Tests the specific issues reported by user:
- Button shows loading for ~1 second then stops
- Webhook is not being sent
- Silent failures causing button to revert back
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

print(f"🚨 URGENT TESTING: Hybrid Score Form Button Issue")
print(f"Testing backend at: {API_BASE_URL}")
print(f"Testing webhook at: {WEBHOOK_URL}")
print("=" * 80)

class HybridScoreUrgentTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_1_profile_creation_endpoint(self):
        """Test POST /api/athlete-profiles/public endpoint with realistic form data"""
        try:
            print("🔍 TEST 1: Profile Creation Endpoint")
            print("-" * 50)
            
            # Use realistic form data as specified in review request
            realistic_form_data = {
                "profile_json": {
                    "first_name": "John",
                    "last_name": "Doe", 
                    "sex": "Male",
                    "dob": "1990-05-15",
                    "country": "US",
                    "email": "john.doe@test.com",
                    "body_metrics": {
                        "weight_lb": 180,
                        "height_in": 70,
                        "vo2max": 50,
                        "resting_hr_bpm": 60,
                        "hrv_ms": 30
                    },
                    "pb_mile": "6:30",
                    "pb_5k": "22:00", 
                    "pb_10k": "45:00",
                    "pb_half_marathon": "1:45:00",
                    "pb_marathon": "3:30:00",
                    "weekly_miles": 25,
                    "long_run": 12,
                    "pb_bench_1rm": 200,
                    "pb_squat_1rm": 250,
                    "pb_deadlift_1rm": 300
                },
                "is_public": True
            }
            
            print("📤 Sending POST request to /api/athlete-profiles/public...")
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=realistic_form_data)
            
            print(f"📥 Response: HTTP {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                profile_id = data.get('user_profile', {}).get('id')
                
                if profile_id:
                    self.profile_id = profile_id  # Store for later tests
                    self.log_test(
                        "Profile Creation Endpoint", 
                        True, 
                        f"Successfully created profile with ID: {profile_id}",
                        {
                            "profile_id": profile_id,
                            "response_keys": list(data.keys()),
                            "user_profile_keys": list(data.get('user_profile', {}).keys())
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Profile Creation Endpoint", 
                        False, 
                        "Profile created but no ID returned",
                        data
                    )
                    return False
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = response.text
                
                self.log_test(
                    "Profile Creation Endpoint", 
                    False, 
                    f"HTTP {response.status_code} - Profile creation failed",
                    error_data
                )
                return False
                
        except Exception as e:
            self.log_test("Profile Creation Endpoint", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_2_webhook_accessibility(self):
        """Test webhook endpoint accessibility and response"""
        try:
            print("🔍 TEST 2: Webhook Accessibility")
            print("-" * 50)
            
            # Test webhook with realistic data that would be sent from frontend
            webhook_payload = {
                "first_name": "John",
                "last_name": "Doe",
                "sex": "Male", 
                "dob": "1990-05-15",
                "country": "US",
                "email": "john.doe@test.com",
                "body_metrics": {
                    "weight_lb": 180,
                    "height_in": 70,
                    "vo2max": 50,
                    "resting_hr_bpm": 60,
                    "hrv_ms": 30
                },
                "pb_mile": "6:30",
                "pb_5k": "22:00",
                "pb_10k": "45:00", 
                "pb_half_marathon": "1:45:00",
                "pb_marathon": "3:30:00",
                "weekly_miles": 25,
                "long_run": 12,
                "pb_bench_1rm": 200,
                "pb_squat_1rm": 250,
                "pb_deadlift_1rm": 300
            }
            
            print(f"📤 Sending POST request to webhook: {WEBHOOK_URL}")
            response = self.session.post(WEBHOOK_URL, json=webhook_payload, timeout=30)
            
            print(f"📥 Response: HTTP {response.status_code}")
            print(f"📏 Content Length: {len(response.content)} bytes")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    
                    # Check if response contains score data
                    if isinstance(response_data, dict) and any(key.endswith('Score') for key in response_data.keys()):
                        self.webhook_response = response_data  # Store for later tests
                        self.log_test(
                            "Webhook Accessibility", 
                            True, 
                            f"Webhook returned score data successfully",
                            {
                                "response_size": len(response.content),
                                "score_fields": [k for k in response_data.keys() if k.endswith('Score')],
                                "sample_scores": {k: v for k, v in response_data.items() if k.endswith('Score')}
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Webhook Accessibility", 
                            False, 
                            "Webhook returned HTTP 200 but no score data found",
                            {
                                "response_size": len(response.content),
                                "response_data": response_data
                            }
                        )
                        return False
                        
                except json.JSONDecodeError:
                    if len(response.content) == 0:
                        self.log_test(
                            "Webhook Accessibility", 
                            False, 
                            "CRITICAL ISSUE: Webhook returns HTTP 200 but EMPTY response - This explains the button reverting back!",
                            {
                                "status_code": response.status_code,
                                "content_length": len(response.content),
                                "headers": dict(response.headers)
                            }
                        )
                    else:
                        self.log_test(
                            "Webhook Accessibility", 
                            False, 
                            "Webhook returned non-JSON response",
                            {
                                "content_length": len(response.content),
                                "content_preview": response.text[:200]
                            }
                        )
                    return False
            else:
                self.log_test(
                    "Webhook Accessibility", 
                    False, 
                    f"Webhook failed with HTTP {response.status_code}",
                    {
                        "status_code": response.status_code,
                        "response_text": response.text[:500]
                    }
                )
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Webhook Accessibility", False, "Webhook request timed out after 30 seconds")
            return False
        except Exception as e:
            self.log_test("Webhook Accessibility", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_3_score_storage_endpoint(self):
        """Test POST /api/athlete-profile/{profile_id}/score endpoint"""
        try:
            print("🔍 TEST 3: Score Storage Endpoint")
            print("-" * 50)
            
            if not hasattr(self, 'profile_id'):
                # Create a test profile first
                print("⚠️  No profile ID from previous test, creating test profile...")
                if not self.test_1_profile_creation_endpoint():
                    self.log_test("Score Storage Endpoint", False, "Cannot test - profile creation failed")
                    return False
            
            # Use sample score data that webhook should return
            score_data = {
                "hybridScore": 78.5,
                "strengthScore": 82.3,
                "enduranceScore": 77.9,
                "speedScore": 75.8,
                "vo2Score": 71.2,
                "distanceScore": 79.1,
                "volumeScore": 76.4,
                "recoveryScore": 80.7
            }
            
            print(f"📤 Sending POST request to /api/athlete-profile/{self.profile_id}/score...")
            response = self.session.post(f"{API_BASE_URL}/athlete-profile/{self.profile_id}/score", json=score_data)
            
            print(f"📥 Response: HTTP {response.status_code}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    self.log_test(
                        "Score Storage Endpoint", 
                        True, 
                        "Score data stored successfully",
                        {
                            "profile_id": self.profile_id,
                            "stored_scores": score_data,
                            "response": response_data
                        }
                    )
                    return True
                except:
                    self.log_test(
                        "Score Storage Endpoint", 
                        True, 
                        "Score data stored successfully (non-JSON response)",
                        {"profile_id": self.profile_id}
                    )
                    return True
            else:
                try:
                    error_data = response.json()
                    
                    # Check for specific database errors
                    if "PGRST204" in str(error_data) or "does not exist" in str(error_data):
                        self.log_test(
                            "Score Storage Endpoint", 
                            False, 
                            "CRITICAL DATABASE ERROR: PGRST204 - Database schema issue preventing score storage",
                            {
                                "profile_id": self.profile_id,
                                "error": error_data,
                                "diagnosis": "Database missing required columns for individual field extraction"
                            }
                        )
                    else:
                        self.log_test(
                            "Score Storage Endpoint", 
                            False, 
                            f"Score storage failed with HTTP {response.status_code}",
                            {
                                "profile_id": self.profile_id,
                                "error": error_data
                            }
                        )
                except:
                    self.log_test(
                        "Score Storage Endpoint", 
                        False, 
                        f"Score storage failed with HTTP {response.status_code}",
                        {
                            "profile_id": self.profile_id,
                            "response_text": response.text
                        }
                    )
                return False
                
        except Exception as e:
            self.log_test("Score Storage Endpoint", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_4_end_to_end_flow(self):
        """Test complete end-to-end flow: Profile Creation → Webhook Call → Score Storage"""
        try:
            print("🔍 TEST 4: Complete End-to-End Flow")
            print("-" * 50)
            
            # Step 1: Create profile
            print("📋 Step 1: Creating athlete profile...")
            realistic_form_data = {
                "profile_json": {
                    "first_name": "Alex",
                    "last_name": "Johnson",
                    "sex": "Male",
                    "dob": "1990-05-15", 
                    "country": "US",
                    "email": "alex.johnson.test@example.com",
                    "body_metrics": {
                        "weight_lb": 180,
                        "height_in": 70,
                        "vo2max": 50,
                        "resting_hr_bpm": 60,
                        "hrv_ms": 30
                    },
                    "pb_mile": "5:45",
                    "pb_5k": "18:30",
                    "pb_10k": "38:15",
                    "pb_half_marathon": "1:25:30",
                    "pb_marathon": "3:05:00",
                    "weekly_miles": 25,
                    "long_run": 12,
                    "pb_bench_1rm": 225,
                    "pb_squat_1rm": 315,
                    "pb_deadlift_1rm": 405
                },
                "is_public": True
            }
            
            profile_response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=realistic_form_data)
            
            if profile_response.status_code != 200:
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    f"Step 1 failed: Profile creation returned HTTP {profile_response.status_code}",
                    profile_response.text
                )
                return False
            
            profile_data = profile_response.json()
            profile_id = profile_data.get('user_profile', {}).get('id')
            
            if not profile_id:
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    "Step 1 failed: No profile ID returned",
                    profile_data
                )
                return False
            
            print(f"✅ Step 1 complete: Profile created with ID {profile_id}")
            
            # Step 2: Call webhook
            print("🌐 Step 2: Calling webhook for score calculation...")
            webhook_payload = realistic_form_data["profile_json"]
            
            webhook_response = self.session.post(WEBHOOK_URL, json=webhook_payload, timeout=30)
            
            if webhook_response.status_code != 200:
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    f"Step 2 failed: Webhook returned HTTP {webhook_response.status_code}",
                    webhook_response.text
                )
                return False
            
            if len(webhook_response.content) == 0:
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    "Step 2 failed: Webhook returned empty response - ROOT CAUSE OF BUTTON ISSUE!",
                    {
                        "status_code": webhook_response.status_code,
                        "content_length": 0,
                        "diagnosis": "This empty response causes frontend to fail silently and button to revert back"
                    }
                )
                return False
            
            try:
                webhook_data = webhook_response.json()
                if not isinstance(webhook_data, dict) or not any(key.endswith('Score') for key in webhook_data.keys()):
                    self.log_test(
                        "End-to-End Flow", 
                        False, 
                        "Step 2 failed: Webhook returned data but no score fields found",
                        webhook_data
                    )
                    return False
            except json.JSONDecodeError:
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    "Step 2 failed: Webhook returned non-JSON data",
                    webhook_response.text[:200]
                )
                return False
            
            print(f"✅ Step 2 complete: Webhook returned score data")
            
            # Step 3: Store score data
            print("💾 Step 3: Storing score data in backend...")
            score_response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=webhook_data)
            
            if score_response.status_code != 200:
                try:
                    error_data = score_response.json()
                    if "PGRST204" in str(error_data):
                        self.log_test(
                            "End-to-End Flow", 
                            False, 
                            "Step 3 failed: Database schema error (PGRST204) - Score storage broken",
                            {
                                "error": error_data,
                                "diagnosis": "Database missing columns for individual field extraction"
                            }
                        )
                    else:
                        self.log_test(
                            "End-to-End Flow", 
                            False, 
                            f"Step 3 failed: Score storage returned HTTP {score_response.status_code}",
                            error_data
                        )
                except:
                    self.log_test(
                        "End-to-End Flow", 
                        False, 
                        f"Step 3 failed: Score storage returned HTTP {score_response.status_code}",
                        score_response.text
                    )
                return False
            
            print(f"✅ Step 3 complete: Score data stored successfully")
            
            # Step 4: Verify data retrieval
            print("🔍 Step 4: Verifying stored data...")
            get_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if get_response.status_code != 200:
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    f"Step 4 failed: Profile retrieval returned HTTP {get_response.status_code}",
                    get_response.text
                )
                return False
            
            retrieved_data = get_response.json()
            stored_scores = retrieved_data.get('score_data', {})
            
            if not stored_scores or not any(key.endswith('Score') for key in stored_scores.keys()):
                self.log_test(
                    "End-to-End Flow", 
                    False, 
                    "Step 4 failed: No score data found in retrieved profile",
                    retrieved_data
                )
                return False
            
            print(f"✅ Step 4 complete: Score data verified in database")
            
            # Success!
            self.log_test(
                "End-to-End Flow", 
                True, 
                "Complete end-to-end flow successful: Profile → Webhook → Storage → Retrieval",
                {
                    "profile_id": profile_id,
                    "webhook_scores": list(webhook_data.keys()),
                    "stored_scores": list(stored_scores.keys()),
                    "sample_score": stored_scores.get('hybridScore', 'N/A')
                }
            )
            return True
            
        except requests.exceptions.Timeout:
            self.log_test("End-to-End Flow", False, "Webhook request timed out during end-to-end test")
            return False
        except Exception as e:
            self.log_test("End-to-End Flow", False, f"Exception during end-to-end test: {str(e)}")
            return False
    
    def run_urgent_investigation(self):
        """Run all urgent investigation tests"""
        print("🚨 STARTING URGENT INVESTIGATION")
        print("=" * 80)
        print("User Issue: Calculate Hybrid Score button shows loading for ~1s then stops")
        print("Expected Cause: Silent failures in backend or webhook integration")
        print("=" * 80)
        
        tests = [
            ("Profile Creation Test", self.test_1_profile_creation_endpoint),
            ("Webhook Accessibility Test", self.test_2_webhook_accessibility), 
            ("Score Storage Test", self.test_3_score_storage_endpoint),
            ("End-to-End Flow Test", self.test_4_end_to_end_flow)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            print("=" * 60)
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Generate investigation summary
        print("\n" + "="*80)
        print("🚨 URGENT INVESTIGATION SUMMARY")
        print("="*80)
        
        passed_tests = 0
        critical_issues = []
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
            else:
                critical_issues.append(test_name)
        
        print(f"\nRESULTS: {passed_tests}/{len(results)} tests passed")
        
        if passed_tests == len(results):
            print("\n🎉 INVESTIGATION RESULT: All backend systems working correctly")
            print("   The button issue may be frontend-related or timing-related")
        elif "Webhook Accessibility Test" in critical_issues:
            print("\n🚨 ROOT CAUSE IDENTIFIED: WEBHOOK INTEGRATION FAILURE")
            print("   The n8n.cloud webhook is not returning score data properly")
            print("   This causes the frontend to fail silently and button to revert back")
            print("   RECOMMENDATION: Fix webhook configuration or implement fallback scoring")
        elif "Score Storage Test" in critical_issues:
            print("\n🚨 ROOT CAUSE IDENTIFIED: DATABASE SCHEMA ISSUE")
            print("   Backend cannot store webhook score data due to PGRST204 errors")
            print("   This causes navigation to results page to fail")
            print("   RECOMMENDATION: Fix database schema or disable individual field extraction")
        elif "Profile Creation Test" in critical_issues:
            print("\n🚨 ROOT CAUSE IDENTIFIED: PROFILE CREATION FAILURE")
            print("   Backend cannot create athlete profiles from form data")
            print("   This prevents the entire flow from working")
            print("   RECOMMENDATION: Fix profile creation endpoint")
        else:
            print(f"\n⚠️  PARTIAL FAILURE: {len(critical_issues)} issues found")
            print("   Multiple backend issues may be contributing to the button problem")
        
        print("="*80)
        
        return passed_tests >= len(results) // 2

if __name__ == "__main__":
    tester = HybridScoreUrgentTester()
    success = tester.run_urgent_investigation()
    
    if success:
        print("\n✅ Investigation completed successfully")
    else:
        print("\n❌ Investigation found critical issues")
    
    exit(0 if success else 1)
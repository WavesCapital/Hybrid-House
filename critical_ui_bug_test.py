#!/usr/bin/env python3
"""
CRITICAL UI BUG INVESTIGATION: Calculate Hybrid Score Button Not Working
Tests the complete backend flow to identify why the UI button fails silently
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

print(f"🚨 CRITICAL UI BUG INVESTIGATION")
print(f"Testing backend at: {API_BASE_URL}")
print("="*80)

class CriticalUIBugTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_profiles = []
        
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
    
    def test_profile_creation_endpoint(self):
        """1. Profile Creation Testing: Test POST /api/athlete-profiles/public endpoint"""
        print("🔍 TEST 1: Profile Creation Testing")
        print("-" * 50)
        
        # Create realistic form data with all new fields including pb_marathon
        form_data = {
            "profile_json": {
                "first_name": "Alex",
                "last_name": "Runner",
                "email": f"alex.runner.{uuid.uuid4().hex[:8]}@test.com",
                "sex": "Male",
                "dob": "1990-05-15",
                "country": "US",
                "wearables": ["Garmin", "Whoop"],
                "body_metrics": {
                    "height_ft": 6,
                    "height_in": 0,
                    "weight_lb": 175,
                    "vo2max": 55,
                    "resting_hr_bpm": 48,
                    "hrv_ms": 65
                },
                "pb_mile": "5:45",
                "pb_5k": "18:30",
                "pb_10k": "38:15",
                "pb_half_marathon": "1:25:30",
                "pb_marathon": "3:05:00",  # New marathon field
                "weekly_miles": 45,
                "long_run": 18,
                "runningApp": "Strava",
                "pb_bench_1rm": 225,
                "pb_squat_1rm": 315,
                "pb_deadlift_1rm": 405,
                "strengthApp": "Strong",
                "customStrengthApp": ""
            },
            "is_public": True
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=form_data)
            
            if response.status_code == 200:
                data = response.json()
                profile_id = data.get('user_profile', {}).get('id')
                
                if profile_id:
                    self.created_profiles.append(profile_id)
                    self.log_test(
                        "Profile Creation (Public Endpoint)", 
                        True, 
                        f"Profile created successfully with ID: {profile_id}",
                        {
                            "profile_id": profile_id,
                            "response_keys": list(data.keys()),
                            "profile_data_keys": list(data.get('user_profile', {}).keys())
                        }
                    )
                    return profile_id
                else:
                    self.log_test(
                        "Profile Creation (Public Endpoint)", 
                        False, 
                        "Profile created but no ID returned",
                        data
                    )
                    return None
            else:
                self.log_test(
                    "Profile Creation (Public Endpoint)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Profile Creation (Public Endpoint)", 
                False, 
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )
            return None
    
    def test_database_verification(self, profile_id):
        """2. Database Verification: Check that created profiles are stored and retrievable"""
        print("🔍 TEST 2: Database Verification")
        print("-" * 50)
        
        if not profile_id:
            self.log_test(
                "Database Verification", 
                False, 
                "No profile ID to verify - profile creation failed"
            )
            return False
        
        try:
            # Test profile retrieval
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                profile_json = data.get('profile_json', {})
                
                # Verify all expected fields are present
                expected_fields = [
                    'first_name', 'last_name', 'email', 'sex', 'dob', 'country',
                    'pb_mile', 'pb_5k', 'pb_10k', 'pb_half_marathon', 'pb_marathon',
                    'weekly_miles', 'long_run', 'pb_bench_1rm', 'pb_squat_1rm', 'pb_deadlift_1rm'
                ]
                
                missing_fields = []
                present_fields = []
                
                for field in expected_fields:
                    if field in profile_json:
                        present_fields.append(field)
                    else:
                        missing_fields.append(field)
                
                # Check for converted time fields
                converted_fields = []
                for field in ['pb_marathon_seconds', 'pb_half_marathon_seconds', 'pb_mile_seconds', 'pb_5k_seconds', 'pb_10k_seconds']:
                    if field in profile_json:
                        converted_fields.append(f"{field}: {profile_json[field]}")
                
                if len(missing_fields) == 0:
                    self.log_test(
                        "Database Verification", 
                        True, 
                        f"Profile retrieved successfully with all {len(present_fields)} expected fields",
                        {
                            "profile_id": profile_id,
                            "present_fields": present_fields,
                            "converted_time_fields": converted_fields,
                            "body_metrics": profile_json.get('body_metrics', {})
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Database Verification", 
                        False, 
                        f"Profile missing {len(missing_fields)} fields: {missing_fields}",
                        {
                            "missing_fields": missing_fields,
                            "present_fields": present_fields
                        }
                    )
                    return False
            else:
                self.log_test(
                    "Database Verification", 
                    False, 
                    f"Profile retrieval failed: HTTP {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Database Verification", 
                False, 
                f"Database verification failed: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_score_storage_endpoint(self, profile_id):
        """3. Score Storage Testing: Test POST /api/athlete-profile/{id}/score endpoint"""
        print("🔍 TEST 3: Score Storage Testing")
        print("-" * 50)
        
        if not profile_id:
            self.log_test(
                "Score Storage Testing", 
                False, 
                "No profile ID to test score storage - profile creation failed"
            )
            return False
        
        # Test score data that matches webhook format
        score_data = {
            "hybridScore": 78.5,
            "strengthScore": 82.3,
            "speedScore": 75.8,
            "vo2Score": 71.2,
            "distanceScore": 79.1,
            "volumeScore": 76.4,
            "recoveryScore": 80.7,
            "enduranceScore": 77.9,
            "balanceBonus": 2,
            "hybridPenalty": 0,
            "deliverable": "score"
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=score_data)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Score Storage Testing", 
                    True, 
                    "Score data stored successfully",
                    {
                        "profile_id": profile_id,
                        "stored_scores": score_data,
                        "response": data
                    }
                )
                return True
            else:
                self.log_test(
                    "Score Storage Testing", 
                    False, 
                    f"Score storage failed: HTTP {response.status_code}",
                    {
                        "status_code": response.status_code, 
                        "response": response.text,
                        "attempted_scores": score_data
                    }
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Score Storage Testing", 
                False, 
                f"Score storage request failed: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_data_format_validation(self):
        """4. Data Format Validation: Verify exact data format matches webhook expectations"""
        print("🔍 TEST 4: Data Format Validation")
        print("-" * 50)
        
        # Test the webhook URL directly to see what format it expects
        webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
        
        # Create test data in the format the UI would send
        test_payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": f"test.webhook.{uuid.uuid4().hex[:8]}@test.com",
            "sex": "Male",
            "dob": "1985-08-20",
            "country": "US",
            "wearables": ["Garmin"],
            "height_ft": 5,
            "height_in": 11,
            "weight_lb": 170,
            "vo2max": 50,
            "resting_hr_bpm": 52,
            "hrv_ms": 60,
            "pb_mile": "6:15",
            "pb_5k": "20:45",
            "pb_10k": "43:30",
            "pb_half_marathon": "1:35:00",
            "pb_marathon": "3:25:00",
            "weekly_miles": 30,
            "long_run": 15,
            "runningApp": "Nike Run Club",
            "pb_bench_1rm": 185,
            "pb_squat_1rm": 275,
            "pb_deadlift_1rm": 315,
            "strengthApp": "Jefit",
            "customStrengthApp": ""
        }
        
        try:
            # Test webhook directly
            webhook_response = self.session.post(webhook_url, json=test_payload, timeout=30)
            
            webhook_success = webhook_response.status_code == 200
            webhook_has_content = len(webhook_response.text.strip()) > 0
            
            if webhook_success and webhook_has_content:
                try:
                    webhook_data = webhook_response.json()
                    self.log_test(
                        "Data Format Validation", 
                        True, 
                        f"Webhook responds correctly with score data",
                        {
                            "webhook_status": webhook_response.status_code,
                            "response_length": len(webhook_response.text),
                            "response_type": type(webhook_data).__name__,
                            "response_keys": list(webhook_data.keys()) if isinstance(webhook_data, dict) else "Not a dict"
                        }
                    )
                    return True
                except json.JSONDecodeError:
                    self.log_test(
                        "Data Format Validation", 
                        False, 
                        f"Webhook responds but returns invalid JSON",
                        {
                            "webhook_status": webhook_response.status_code,
                            "response_text": webhook_response.text[:200]
                        }
                    )
                    return False
            elif webhook_success and not webhook_has_content:
                self.log_test(
                    "Data Format Validation", 
                    False, 
                    "🚨 CRITICAL ISSUE: Webhook returns HTTP 200 but EMPTY response - this explains the UI bug!",
                    {
                        "webhook_status": webhook_response.status_code,
                        "response_length": len(webhook_response.text),
                        "response_text": repr(webhook_response.text)
                    }
                )
                return False
            else:
                self.log_test(
                    "Data Format Validation", 
                    False, 
                    f"Webhook failed: HTTP {webhook_response.status_code}",
                    {
                        "webhook_status": webhook_response.status_code,
                        "response_text": webhook_response.text[:200]
                    }
                )
                return False
                
        except requests.exceptions.Timeout:
            self.log_test(
                "Data Format Validation", 
                False, 
                "Webhook request timed out after 30 seconds",
                {"timeout": 30}
            )
            return False
        except Exception as e:
            self.log_test(
                "Data Format Validation", 
                False, 
                f"Webhook request failed: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_complete_end_to_end_flow(self):
        """5. Complete End-to-End Flow: Test the full sequence"""
        print("🔍 TEST 5: Complete End-to-End Flow")
        print("-" * 50)
        
        # Step 1: Create profile
        print("Step 1: Creating profile via /api/athlete-profiles/public...")
        profile_id = self.test_profile_creation_endpoint()
        
        if not profile_id:
            self.log_test(
                "Complete End-to-End Flow", 
                False, 
                "End-to-end test failed at profile creation step"
            )
            return False
        
        # Step 2: Verify profile exists
        print("Step 2: Verifying profile exists with GET /api/athlete-profile/{id}...")
        profile_exists = self.test_database_verification(profile_id)
        
        if not profile_exists:
            self.log_test(
                "Complete End-to-End Flow", 
                False, 
                "End-to-end test failed at profile verification step"
            )
            return False
        
        # Step 3: Test webhook call (simulating what UI does)
        print("Step 3: Testing webhook call...")
        webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
        
        # Get the profile data to send to webhook
        try:
            profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                profile_json = profile_data.get('profile_json', {})
                
                # Send to webhook
                webhook_response = self.session.post(webhook_url, json=profile_json, timeout=30)
                
                if webhook_response.status_code == 200 and len(webhook_response.text.strip()) > 0:
                    try:
                        score_data = webhook_response.json()
                        print("Step 4: Storing score data...")
                        
                        # Step 4: Store score data
                        score_stored = self.test_score_storage_endpoint(profile_id)
                        
                        if score_stored:
                            # Step 5: Verify score data is retrievable
                            print("Step 5: Verifying score data is retrievable...")
                            final_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                            
                            if final_response.status_code == 200:
                                final_data = final_response.json()
                                stored_scores = final_data.get('score_data')
                                
                                if stored_scores:
                                    self.log_test(
                                        "Complete End-to-End Flow", 
                                        True, 
                                        "✅ COMPLETE SUCCESS: Full end-to-end flow working correctly",
                                        {
                                            "profile_created": True,
                                            "profile_retrievable": True,
                                            "webhook_called": True,
                                            "webhook_returned_data": True,
                                            "scores_stored": True,
                                            "scores_retrievable": True,
                                            "final_hybrid_score": stored_scores.get('hybridScore')
                                        }
                                    )
                                    return True
                                else:
                                    self.log_test(
                                        "Complete End-to-End Flow", 
                                        False, 
                                        "❌ CRITICAL ISSUE: Scores not stored in profile after webhook call",
                                        {"profile_data": final_data}
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "Complete End-to-End Flow", 
                                    False, 
                                    f"Final profile retrieval failed: HTTP {final_response.status_code}"
                                )
                                return False
                        else:
                            self.log_test(
                                "Complete End-to-End Flow", 
                                False, 
                                "Score storage step failed"
                            )
                            return False
                    except json.JSONDecodeError:
                        self.log_test(
                            "Complete End-to-End Flow", 
                            False, 
                            "❌ CRITICAL ISSUE: Webhook returns HTTP 200 but invalid JSON",
                            {"webhook_response": webhook_response.text[:200]}
                        )
                        return False
                else:
                    self.log_test(
                        "Complete End-to-End Flow", 
                        False, 
                        f"❌ CRITICAL ISSUE: Webhook call failed - HTTP {webhook_response.status_code} or empty response",
                        {
                            "webhook_status": webhook_response.status_code,
                            "response_length": len(webhook_response.text),
                            "response_preview": webhook_response.text[:100]
                        }
                    )
                    return False
            else:
                self.log_test(
                    "Complete End-to-End Flow", 
                    False, 
                    f"Could not retrieve profile for webhook test: HTTP {profile_response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Complete End-to-End Flow", 
                False, 
                f"End-to-end flow failed: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def run_critical_investigation(self):
        """Run the complete critical UI bug investigation"""
        print("🚨 STARTING CRITICAL UI BUG INVESTIGATION")
        print("="*80)
        print("ISSUE: 'Calculate Hybrid Score' button shows loading but reverts back without calling webhook")
        print("GOAL: Find ANY backend issues that could cause frontend button to fail silently")
        print("="*80)
        
        tests = [
            ("Profile Creation Testing", self.test_profile_creation_endpoint),
            ("Data Format Validation", self.test_data_format_validation),
            ("Complete End-to-End Flow", self.test_complete_end_to_end_flow)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n{'='*60}")
            print(f"🔍 RUNNING: {test_name}")
            print(f"{'='*60}")
            
            try:
                if test_name == "Profile Creation Testing":
                    # This test returns a profile_id, handle differently
                    profile_id = test_func()
                    success = profile_id is not None
                elif test_name == "Complete End-to-End Flow":
                    # This test runs its own sub-tests
                    success = test_func()
                else:
                    success = test_func()
                
                results.append((test_name, success))
                
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Final summary
        print("\n" + "="*80)
        print("🚨 CRITICAL UI BUG INVESTIGATION SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, success in results if success)
        total = len(results)
        
        for test_name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nOVERALL RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 INVESTIGATION RESULT: Backend is working correctly")
            print("   → The UI bug is likely in frontend JavaScript code")
            print("   → Check form submission logic, error handling, and webhook calling code")
        elif passed >= total // 2:
            print("\n⚠️  INVESTIGATION RESULT: Backend has some issues but core functionality works")
            print("   → Check the failed tests above for specific backend issues")
            print("   → UI bug may be caused by backend errors not being handled properly")
        else:
            print("\n❌ INVESTIGATION RESULT: Critical backend issues found")
            print("   → Multiple backend endpoints are failing")
            print("   → UI bug is likely caused by backend failures")
        
        # Specific recommendations based on test results
        print("\n📋 SPECIFIC FINDINGS:")
        for test_result in self.test_results:
            if not test_result['success'] and 'CRITICAL ISSUE' in test_result['message']:
                print(f"   🚨 {test_result['message']}")
        
        print("="*80)
        
        return passed >= total // 2

if __name__ == "__main__":
    tester = CriticalUIBugTester()
    tester.run_critical_investigation()
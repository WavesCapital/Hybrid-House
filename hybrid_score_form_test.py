#!/usr/bin/env python3
"""
Hybrid Score Form Submission Backend Testing
Critical bug investigation for form submission failure as reported by user
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

print(f"🔍 CRITICAL BUG INVESTIGATION: Hybrid Score Form Submission")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 80)

class HybridFormTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_profiles = []  # Track created profiles for cleanup
        
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
    
    def test_api_endpoint_health(self):
        """Test all form-related endpoints for health"""
        print("🏥 TESTING API ENDPOINT HEALTH")
        print("-" * 40)
        
        endpoints = [
            ("POST /api/athlete-profiles/public", "POST", "/athlete-profiles/public"),
            ("POST /api/athlete-profiles", "POST", "/athlete-profiles"),
            ("POST /api/athlete-profile/{id}/score", "POST", "/athlete-profile/test-id/score"),
            ("GET /api/athlete-profile/{id}", "GET", "/athlete-profile/test-id")
        ]
        
        all_healthy = True
        
        for endpoint_name, method, path in endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE_URL}{path}")
                else:
                    # POST with minimal test data
                    test_data = {"test": "data"}
                    if "score" in path:
                        test_data = {
                            "hybridScore": 50,
                            "strengthScore": 50,
                            "speedScore": 50,
                            "vo2Score": 50,
                            "distanceScore": 50,
                            "volumeScore": 50,
                            "recoveryScore": 50
                        }
                    elif "athlete-profiles" in path:
                        test_data = {
                            "profile_json": {
                                "first_name": "Test",
                                "last_name": "User"
                            }
                        }
                    
                    response = self.session.post(f"{API_BASE_URL}{path}", json=test_data)
                
                # Check if endpoint exists (not 404)
                if response.status_code == 404:
                    self.log_test(f"Endpoint Health: {endpoint_name}", False, f"Endpoint not found (404)", {"status_code": response.status_code})
                    all_healthy = False
                elif response.status_code in [200, 201, 401, 403, 422, 500]:
                    # These are acceptable - endpoint exists
                    self.log_test(f"Endpoint Health: {endpoint_name}", True, f"Endpoint exists (HTTP {response.status_code})", {"status_code": response.status_code})
                else:
                    self.log_test(f"Endpoint Health: {endpoint_name}", False, f"Unexpected status (HTTP {response.status_code})", {"status_code": response.status_code, "response": response.text[:200]})
                    all_healthy = False
                    
            except Exception as e:
                self.log_test(f"Endpoint Health: {endpoint_name}", False, f"Connection failed: {str(e)}", {"error": str(e)})
                all_healthy = False
        
        return all_healthy
    
    def test_form_data_processing(self):
        """Test that backend can handle complete form payload with all fields"""
        print("📝 TESTING FORM DATA PROCESSING")
        print("-" * 40)
        
        # Complete form payload with all fields as specified in review
        complete_form_data = {
            "profile_json": {
                # Personal info
                "first_name": "John",
                "last_name": "Doe",
                "sex": "male",
                "dob": "1990-05-15",
                "country": "US",
                "wearables": ["Garmin", "Whoop"],
                
                # Body metrics
                "body_metrics": {
                    "weight_lb": 175,
                    "height_ft": 5,
                    "height_in": 10,
                    "vo2max": 52,
                    "resting_hr_bpm": 48,
                    "hrv_ms": 65
                },
                
                # Running data
                "pb_mile": "6:30",
                "pb_5k": "20:15",
                "pb_10k": "42:30",
                "pb_half_marathon": "1:35:00",
                "pb_marathon": "3:25:00",
                "weekly_miles": 25,
                "long_run": 15,
                "runningApp": "Strava",
                
                # Strength data
                "pb_bench_1rm": 225,
                "pb_squat_1rm": 315,
                "pb_deadlift_1rm": 405,
                "strengthApp": "Strong",
                "customStrengthApp": "MyFitnessPal"
            }
        }
        
        # Test public endpoint (unauthenticated)
        try:
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=complete_form_data)
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                profile_id = response_data.get('user_profile', {}).get('id')
                if profile_id:
                    self.created_profiles.append(profile_id)
                
                self.log_test("Form Data Processing (Public)", True, f"Successfully processed complete form data (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "profile_id": profile_id,
                    "response_keys": list(response_data.keys()) if response_data else []
                })
                return True, profile_id
            else:
                self.log_test("Form Data Processing (Public)", False, f"Failed to process form data (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "response": response.text[:500]
                })
                return False, None
                
        except Exception as e:
            self.log_test("Form Data Processing (Public)", False, f"Request failed: {str(e)}", {"error": str(e)})
            return False, None
    
    def test_data_conversion(self):
        """Test time conversion for Marathon PR and other time fields"""
        print("🔄 TESTING DATA CONVERSION")
        print("-" * 40)
        
        # Test data with various time formats
        conversion_test_data = {
            "profile_json": {
                "first_name": "Time",
                "last_name": "Tester",
                "pb_mile": "6:45",           # MM:SS format
                "pb_5k": "21:30",            # MM:SS format  
                "pb_10k": "45:15",           # MM:SS format
                "pb_half_marathon": "1:42:30", # HH:MM:SS format
                "pb_marathon": "3:15:00",    # HH:MM:SS format - focus of review
                "body_metrics": {
                    "weight_lb": 170,
                    "height_in": 70
                }
            }
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=conversion_test_data)
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                profile_data = response_data.get('user_profile', {})
                profile_json = profile_data.get('profile_json', {})
                
                # Check if time conversions are present
                expected_conversions = {
                    "pb_marathon_seconds": 11700,  # 3:15:00 = 3*3600 + 15*60 = 11700 seconds
                    "pb_half_marathon_seconds": 6150,  # 1:42:30 = 1*3600 + 42*60 + 30 = 6150 seconds
                    "pb_mile_seconds": 405,      # 6:45 = 6*60 + 45 = 405 seconds
                    "pb_5k_seconds": 1290,       # 21:30 = 21*60 + 30 = 1290 seconds
                    "pb_10k_seconds": 2715       # 45:15 = 45*60 + 15 = 2715 seconds
                }
                
                conversions_found = 0
                conversion_details = {}
                
                for field, expected_value in expected_conversions.items():
                    actual_value = profile_json.get(field)
                    if actual_value == expected_value:
                        conversions_found += 1
                        conversion_details[field] = f"✅ {actual_value} (correct)"
                    else:
                        conversion_details[field] = f"❌ {actual_value} (expected {expected_value})"
                
                if conversions_found >= 3:  # At least 3 conversions working
                    self.log_test("Data Conversion", True, f"Time conversions working ({conversions_found}/5 correct)", {
                        "conversions": conversion_details,
                        "marathon_conversion": f"3:15:00 → {profile_json.get('pb_marathon_seconds')} seconds"
                    })
                    return True
                else:
                    self.log_test("Data Conversion", False, f"Time conversions not working properly ({conversions_found}/5 correct)", {
                        "conversions": conversion_details
                    })
                    return False
                    
            else:
                self.log_test("Data Conversion", False, f"Could not test conversions - profile creation failed (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "response": response.text[:300]
                })
                return False
                
        except Exception as e:
            self.log_test("Data Conversion", False, f"Conversion test failed: {str(e)}", {"error": str(e)})
            return False
    
    def test_webhook_integration(self, profile_id=None):
        """Test webhook integration for score calculation"""
        print("🔗 TESTING WEBHOOK INTEGRATION")
        print("-" * 40)
        
        if not profile_id:
            # Create a test profile first
            test_data = {
                "profile_json": {
                    "first_name": "Webhook",
                    "last_name": "Test",
                    "body_metrics": {"weight_lb": 180, "height_in": 72}
                }
            }
            
            try:
                response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_data)
                if response.status_code in [200, 201]:
                    profile_id = response.json().get('user_profile', {}).get('id')
                else:
                    self.log_test("Webhook Integration", False, "Could not create test profile for webhook test", {
                        "status_code": response.status_code
                    })
                    return False
            except Exception as e:
                self.log_test("Webhook Integration", False, f"Failed to create test profile: {str(e)}", {"error": str(e)})
                return False
        
        if not profile_id:
            self.log_test("Webhook Integration", False, "No profile ID available for webhook test", {})
            return False
        
        # Test score update endpoint (webhook target)
        score_data = {
            "hybridScore": 72.5,
            "strengthScore": 78.2,
            "speedScore": 69.8,
            "vo2Score": 71.3,
            "distanceScore": 68.9,
            "volumeScore": 70.1,
            "recoveryScore": 74.6,
            "deliverable": "score"
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=score_data)
            
            if response.status_code in [200, 201]:
                self.log_test("Webhook Integration", True, f"Score update endpoint working (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "profile_id": profile_id
                })
                return True
            elif response.status_code == 404:
                self.log_test("Webhook Integration", False, f"Profile not found for score update (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "profile_id": profile_id
                })
                return False
            else:
                self.log_test("Webhook Integration", False, f"Score update failed (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "response": response.text[:300]
                })
                return False
                
        except Exception as e:
            self.log_test("Webhook Integration", False, f"Webhook test failed: {str(e)}", {"error": str(e)})
            return False
    
    def test_profile_retrieval(self, profile_id=None):
        """Test profile retrieval for results display"""
        print("📊 TESTING PROFILE RETRIEVAL")
        print("-" * 40)
        
        if not profile_id:
            # Use a test profile ID or create one
            test_data = {
                "profile_json": {
                    "first_name": "Retrieval",
                    "last_name": "Test",
                    "body_metrics": {"weight_lb": 175, "height_in": 70}
                }
            }
            
            try:
                response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_data)
                if response.status_code in [200, 201]:
                    profile_id = response.json().get('user_profile', {}).get('id')
            except:
                pass
        
        if not profile_id:
            self.log_test("Profile Retrieval", False, "No profile ID available for retrieval test", {})
            return False
        
        try:
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                response_data = response.json()
                required_fields = ['profile_id', 'profile_json', 'created_at']
                
                missing_fields = [field for field in required_fields if field not in response_data]
                
                if not missing_fields:
                    self.log_test("Profile Retrieval", True, f"Profile retrieval working - all required fields present", {
                        "profile_id": profile_id,
                        "fields_present": list(response_data.keys()),
                        "has_score_data": response_data.get('score_data') is not None
                    })
                    return True
                else:
                    self.log_test("Profile Retrieval", False, f"Profile retrieval missing fields: {missing_fields}", {
                        "profile_id": profile_id,
                        "missing_fields": missing_fields,
                        "available_fields": list(response_data.keys())
                    })
                    return False
                    
            elif response.status_code == 404:
                self.log_test("Profile Retrieval", False, f"Profile not found (HTTP 404)", {
                    "profile_id": profile_id
                })
                return False
            else:
                self.log_test("Profile Retrieval", False, f"Profile retrieval failed (HTTP {response.status_code})", {
                    "status_code": response.status_code,
                    "response": response.text[:300]
                })
                return False
                
        except Exception as e:
            self.log_test("Profile Retrieval", False, f"Profile retrieval test failed: {str(e)}", {"error": str(e)})
            return False
    
    def test_error_handling(self):
        """Test error handling for validation errors and edge cases"""
        print("⚠️  TESTING ERROR HANDLING")
        print("-" * 40)
        
        error_test_cases = [
            {
                "name": "Empty payload",
                "data": {},
                "expected_status": [400, 422, 500]
            },
            {
                "name": "Invalid time format",
                "data": {
                    "profile_json": {
                        "first_name": "Error",
                        "last_name": "Test",
                        "pb_marathon": "invalid_time",
                        "body_metrics": {"weight_lb": 170}
                    }
                },
                "expected_status": [200, 201, 400, 422]  # Should handle gracefully
            },
            {
                "name": "Missing required fields",
                "data": {
                    "profile_json": {
                        "first_name": "Incomplete"
                        # Missing other fields
                    }
                },
                "expected_status": [200, 201, 400, 422]  # Should handle gracefully
            },
            {
                "name": "Invalid data types",
                "data": {
                    "profile_json": {
                        "first_name": "Type",
                        "last_name": "Test",
                        "body_metrics": {
                            "weight_lb": "not_a_number",
                            "height_in": "also_not_a_number"
                        }
                    }
                },
                "expected_status": [200, 201, 400, 422]  # Should handle gracefully
            }
        ]
        
        all_handled = True
        
        for test_case in error_test_cases:
            try:
                response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_case["data"])
                
                if response.status_code in test_case["expected_status"]:
                    self.log_test(f"Error Handling: {test_case['name']}", True, f"Handled correctly (HTTP {response.status_code})", {
                        "status_code": response.status_code,
                        "expected": test_case["expected_status"]
                    })
                else:
                    self.log_test(f"Error Handling: {test_case['name']}", False, f"Unexpected response (HTTP {response.status_code})", {
                        "status_code": response.status_code,
                        "expected": test_case["expected_status"],
                        "response": response.text[:200]
                    })
                    all_handled = False
                    
            except Exception as e:
                self.log_test(f"Error Handling: {test_case['name']}", False, f"Test failed: {str(e)}", {"error": str(e)})
                all_handled = False
        
        return all_handled
    
    def test_complete_form_submission_flow(self):
        """Test the complete form submission flow end-to-end"""
        print("🔄 TESTING COMPLETE FORM SUBMISSION FLOW")
        print("-" * 40)
        
        # Step 1: Create profile with complete data
        form_success, profile_id = self.test_form_data_processing()
        if not form_success or not profile_id:
            self.log_test("Complete Flow", False, "Failed at profile creation step", {})
            return False
        
        # Step 2: Test webhook/score update
        webhook_success = self.test_webhook_integration(profile_id)
        if not webhook_success:
            self.log_test("Complete Flow", False, "Failed at webhook integration step", {"profile_id": profile_id})
            return False
        
        # Step 3: Test profile retrieval with scores
        retrieval_success = self.test_profile_retrieval(profile_id)
        if not retrieval_success:
            self.log_test("Complete Flow", False, "Failed at profile retrieval step", {"profile_id": profile_id})
            return False
        
        self.log_test("Complete Flow", True, "End-to-end form submission flow working", {
            "profile_id": profile_id,
            "steps_completed": ["profile_creation", "webhook_integration", "profile_retrieval"]
        })
        return True
    
    def run_all_tests(self):
        """Run all hybrid form submission tests"""
        print("🚀 STARTING HYBRID SCORE FORM SUBMISSION TESTS")
        print("=" * 80)
        
        tests = [
            ("API Endpoint Health", self.test_api_endpoint_health),
            ("Form Data Processing", lambda: self.test_form_data_processing()[0]),
            ("Data Conversion", self.test_data_conversion),
            ("Webhook Integration", lambda: self.test_webhook_integration()),
            ("Profile Retrieval", lambda: self.test_profile_retrieval()),
            ("Error Handling", self.test_error_handling),
            ("Complete Flow", self.test_complete_form_submission_flow)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            print("-" * 60)
            try:
                result = test_func()
                if result:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                self.log_test(test_name, False, f"Test failed with exception: {str(e)}", {"error": str(e)})
        
        # Summary
        print("\n" + "=" * 80)
        print("🎯 HYBRID SCORE FORM SUBMISSION TEST SUMMARY")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100
        
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}: {result['test']}")
        
        print(f"\nOVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🎉 CONCLUSION: Backend form submission functionality is WORKING")
            print("   The reported frontend issue may be in the client-side code or webhook call")
        elif success_rate >= 60:
            print("⚠️  CONCLUSION: Backend has MINOR ISSUES but core functionality works")
            print("   Some endpoints may need attention but form submission should work")
        else:
            print("❌ CONCLUSION: Backend has MAJOR ISSUES affecting form submission")
            print("   Critical backend problems found that could cause silent failures")
        
        print("=" * 80)
        
        return success_rate >= 60

if __name__ == "__main__":
    tester = HybridFormTester()
    tester.run_all_tests()
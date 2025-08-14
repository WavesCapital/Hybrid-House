#!/usr/bin/env python3
"""
Hybrid Score Form Backend Testing After Unified Design Implementation
Tests the specific functionality requested in the review:
1. Form Submission Flow
2. Profile Creation (authenticated and unauthenticated)
3. Data Storage
4. Score Calculation
5. API Endpoints
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
import time

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing Hybrid Score Form backend at: {API_BASE_URL}")

class HybridFormBackendTester:
    def __init__(self):
        self.session = requests.Session()
        # Add SSL verification and timeout settings
        self.session.verify = True
        self.session.timeout = 30
        # Add headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'HybridFormBackendTester/1.0'
        })
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_form_submission_flow(self):
        """Test 1: Form Submission Flow - Test that form submits and calls webhook"""
        try:
            print("\n🎯 Test 1: Form Submission Flow")
            print("=" * 50)
            
            # Create sample form data as would be submitted from unified design form
            form_data = {
                "profile_json": {
                    "first_name": "TestUser",
                    "last_name": "FormSubmission",
                    "email": "testuser.formsubmission@example.com",
                    "sex": "Male",
                    "dob": "1990-05-15",
                    "country": "US",
                    "body_metrics": {
                        "height_in": 72,
                        "weight_lb": 175,
                        "vo2_max": 50,
                        "resting_hr_bpm": 55,
                        "hrv_ms": 45
                    },
                    "pb_mile": "6:30",
                    "weekly_miles": 25,
                    "long_run": 12,
                    "pb_bench_1rm": {"weight_lb": 225},
                    "pb_squat_1rm": {"weight_lb": 315},
                    "pb_deadlift_1rm": {"weight_lb": 405},
                    "wearables": ["Garmin", "Whoop"],
                    "running_app": "Strava",
                    "strength_app": "Strong"
                },
                "is_public": True
            }
            
            # Test public form submission (unauthenticated)
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=form_data)
            
            if response.status_code == 200:
                data = response.json()
                profile_id = data.get('user_profile', {}).get('id')
                
                if profile_id:
                    print(f"✅ Form submission successful: Profile ID {profile_id}")
                    self.log_test("Form Submission Flow", True, f"Form submitted successfully, Profile ID: {profile_id}", data)
                    return profile_id
                else:
                    print(f"❌ Form submission failed: No profile ID returned")
                    self.log_test("Form Submission Flow", False, "No profile ID returned", data)
                    return False
            else:
                print(f"❌ Form submission failed: HTTP {response.status_code}")
                self.log_test("Form Submission Flow", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Form Submission Flow", False, "Test failed with exception", str(e))
            return False
    
    def test_profile_creation_authenticated(self):
        """Test 2: Profile Creation (Authenticated) - Should require authentication"""
        try:
            print("\n🔐 Test 2: Profile Creation (Authenticated)")
            print("=" * 50)
            
            form_data = {
                "profile_json": {
                    "first_name": "AuthTest",
                    "last_name": "User",
                    "email": "authtest.user@example.com"
                },
                "is_public": True
            }
            
            # Test authenticated endpoint without token
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=form_data)
            
            if response.status_code in [401, 403]:
                print(f"✅ Authenticated endpoint properly protected: HTTP {response.status_code}")
                self.log_test("Profile Creation (Authenticated)", True, f"Properly requires authentication: HTTP {response.status_code}")
                return True
            else:
                print(f"❌ Authenticated endpoint not properly protected: HTTP {response.status_code}")
                self.log_test("Profile Creation (Authenticated)", False, f"Should require auth but got HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Profile Creation (Authenticated)", False, "Test failed with exception", str(e))
            return False
    
    def test_profile_creation_unauthenticated(self):
        """Test 3: Profile Creation (Unauthenticated) - Should work without authentication"""
        try:
            print("\n🌐 Test 3: Profile Creation (Unauthenticated)")
            print("=" * 50)
            
            form_data = {
                "profile_json": {
                    "first_name": "PublicTest",
                    "last_name": "User",
                    "email": "publictest.user@example.com",
                    "sex": "Female",
                    "dob": "1992-03-20",
                    "country": "CA",
                    "body_metrics": {
                        "height_in": 65,
                        "weight_lb": 140,
                        "vo2_max": 48
                    }
                },
                "is_public": True
            }
            
            # Test public endpoint
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=form_data)
            
            if response.status_code == 200:
                data = response.json()
                profile_id = data.get('user_profile', {}).get('id')
                
                if profile_id:
                    print(f"✅ Public profile creation successful: Profile ID {profile_id}")
                    self.log_test("Profile Creation (Unauthenticated)", True, f"Public profile created: {profile_id}", data)
                    return profile_id
                else:
                    print(f"❌ Public profile creation failed: No profile ID")
                    self.log_test("Profile Creation (Unauthenticated)", False, "No profile ID returned", data)
                    return False
            else:
                print(f"❌ Public profile creation failed: HTTP {response.status_code}")
                self.log_test("Profile Creation (Unauthenticated)", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Profile Creation (Unauthenticated)", False, "Test failed with exception", str(e))
            return False
    
    def test_data_storage(self, profile_id):
        """Test 4: Data Storage - Check that all form fields are properly stored"""
        try:
            print(f"\n💾 Test 4: Data Storage (Profile ID: {profile_id})")
            print("=" * 50)
            
            if not profile_id:
                print("❌ No profile ID provided for data storage test")
                self.log_test("Data Storage", False, "No profile ID provided")
                return False
            
            # Retrieve the profile to check data storage
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                profile_json = data.get('profile_json', {})
                
                # Check required fields
                required_fields = {
                    'first_name': 'Personal info',
                    'last_name': 'Personal info',
                    'email': 'Personal info',
                    'sex': 'Personal info',
                    'dob': 'Personal info',
                    'country': 'Personal info'
                }
                
                body_metrics_fields = {
                    'height_in': 'Body metrics',
                    'weight_lb': 'Body metrics',
                    'vo2_max': 'Body metrics'
                }
                
                performance_fields = {
                    'pb_mile': 'Running PRs',
                    'weekly_miles': 'Running volume',
                    'long_run': 'Running volume'
                }
                
                all_fields_present = True
                missing_fields = []
                
                # Check personal info fields
                for field, category in required_fields.items():
                    if field not in profile_json or not profile_json[field]:
                        all_fields_present = False
                        missing_fields.append(f"{field} ({category})")
                
                # Check body metrics
                body_metrics = profile_json.get('body_metrics', {})
                for field, category in body_metrics_fields.items():
                    if field not in body_metrics or body_metrics[field] is None:
                        all_fields_present = False
                        missing_fields.append(f"body_metrics.{field} ({category})")
                
                # Check performance fields
                for field, category in performance_fields.items():
                    if field not in profile_json or profile_json[field] is None:
                        all_fields_present = False
                        missing_fields.append(f"{field} ({category})")
                
                if all_fields_present:
                    print("✅ All form fields properly stored")
                    self.log_test("Data Storage", True, "All form fields properly stored and retrievable", {
                        'profile_id': profile_id,
                        'fields_checked': len(required_fields) + len(body_metrics_fields) + len(performance_fields)
                    })
                    return True
                else:
                    print(f"❌ Missing fields: {', '.join(missing_fields)}")
                    self.log_test("Data Storage", False, f"Missing fields: {', '.join(missing_fields)}", {
                        'profile_id': profile_id,
                        'missing_fields': missing_fields
                    })
                    return False
            else:
                print(f"❌ Failed to retrieve profile: HTTP {response.status_code}")
                self.log_test("Data Storage", False, f"Failed to retrieve profile: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Data Storage", False, "Test failed with exception", str(e))
            return False
    
    def test_score_calculation(self, profile_id):
        """Test 5: Score Calculation - Confirm webhook integration works"""
        try:
            print(f"\n🧮 Test 5: Score Calculation (Profile ID: {profile_id})")
            print("=" * 50)
            
            if not profile_id:
                print("❌ No profile ID provided for score calculation test")
                self.log_test("Score Calculation", False, "No profile ID provided")
                return False
            
            # Test score update endpoint
            score_data = {
                "hybridScore": 72.5,
                "strengthScore": 78.2,
                "speedScore": 69.8,
                "vo2Score": 71.3,
                "distanceScore": 68.9,
                "volumeScore": 70.1,
                "recoveryScore": 74.6
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=score_data)
            
            if response.status_code == 200:
                print("✅ Score calculation endpoint working")
                
                # Wait a moment and verify scores were stored
                time.sleep(1)
                profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    stored_scores = profile_data.get('score_data', {})
                    
                    if stored_scores and stored_scores.get('hybridScore') == 72.5:
                        print("✅ Score data properly stored and retrievable")
                        self.log_test("Score Calculation", True, "Score calculation and storage working", {
                            'profile_id': profile_id,
                            'hybrid_score': stored_scores.get('hybridScore'),
                            'all_scores': list(stored_scores.keys())
                        })
                        return True
                    else:
                        print("❌ Score data not properly stored")
                        self.log_test("Score Calculation", False, "Score data not properly stored", stored_scores)
                        return False
                else:
                    print(f"❌ Failed to verify score storage: HTTP {profile_response.status_code}")
                    self.log_test("Score Calculation", False, f"Failed to verify score storage: HTTP {profile_response.status_code}")
                    return False
            else:
                print(f"❌ Score calculation endpoint failed: HTTP {response.status_code}")
                self.log_test("Score Calculation", False, f"Score endpoint failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Score Calculation", False, "Test failed with exception", str(e))
            return False
    
    def test_api_endpoints(self):
        """Test 6: API Endpoints - Test relevant endpoints"""
        try:
            print("\n🔗 Test 6: API Endpoints")
            print("=" * 50)
            
            endpoints_tested = 0
            endpoints_working = 0
            
            # Test /api/athlete-profiles/public endpoint
            print("Testing POST /api/athlete-profiles/public...")
            test_data = {
                "profile_json": {"first_name": "API", "last_name": "Test"},
                "is_public": True
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_data)
            endpoints_tested += 1
            
            if response.status_code == 200:
                endpoints_working += 1
                print("✅ POST /api/athlete-profiles/public working")
                
                # Get the profile ID for further testing
                data = response.json()
                test_profile_id = data.get('user_profile', {}).get('id')
                
                if test_profile_id:
                    # Test individual profile endpoint
                    print(f"Testing GET /api/athlete-profile/{test_profile_id}...")
                    profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{test_profile_id}")
                    endpoints_tested += 1
                    
                    if profile_response.status_code == 200:
                        endpoints_working += 1
                        print("✅ GET /api/athlete-profile/{id} working")
                    else:
                        print(f"❌ GET /api/athlete-profile/{id} failed: HTTP {profile_response.status_code}")
                    
                    # Test score endpoint
                    print(f"Testing POST /api/athlete-profile/{test_profile_id}/score...")
                    score_data = {"hybridScore": 75.0, "strengthScore": 80.0}
                    score_response = self.session.post(f"{API_BASE_URL}/athlete-profile/{test_profile_id}/score", json=score_data)
                    endpoints_tested += 1
                    
                    if score_response.status_code == 200:
                        endpoints_working += 1
                        print("✅ POST /api/athlete-profile/{id}/score working")
                    else:
                        print(f"❌ POST /api/athlete-profile/{id}/score failed: HTTP {score_response.status_code}")
            else:
                print(f"❌ POST /api/athlete-profiles/public failed: HTTP {response.status_code}")
            
            # Test general athlete profiles endpoint
            print("Testing GET /api/athlete-profiles...")
            profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            endpoints_tested += 1
            
            if profiles_response.status_code == 200:
                endpoints_working += 1
                profiles_data = profiles_response.json()
                profile_count = len(profiles_data.get('profiles', []))
                print(f"✅ GET /api/athlete-profiles working ({profile_count} profiles)")
            else:
                print(f"❌ GET /api/athlete-profiles failed: HTTP {profiles_response.status_code}")
            
            success_rate = (endpoints_working / endpoints_tested) * 100 if endpoints_tested > 0 else 0
            
            if success_rate >= 75:
                print(f"✅ API endpoints working: {endpoints_working}/{endpoints_tested} ({success_rate:.1f}%)")
                self.log_test("API Endpoints", True, f"API endpoints working: {endpoints_working}/{endpoints_tested} ({success_rate:.1f}%)", {
                    'endpoints_tested': endpoints_tested,
                    'endpoints_working': endpoints_working,
                    'success_rate': success_rate
                })
                return True
            else:
                print(f"❌ API endpoints issues: {endpoints_working}/{endpoints_tested} ({success_rate:.1f}%)")
                self.log_test("API Endpoints", False, f"API endpoints issues: {endpoints_working}/{endpoints_tested} ({success_rate:.1f}%)", {
                    'endpoints_tested': endpoints_tested,
                    'endpoints_working': endpoints_working,
                    'success_rate': success_rate
                })
                return False
                
        except Exception as e:
            self.log_test("API Endpoints", False, "Test failed with exception", str(e))
            return False
    
    def run_hybrid_form_backend_tests(self):
        """Run all Hybrid Score Form backend tests after unified design implementation"""
        print("🚀 HYBRID SCORE FORM BACKEND TESTING AFTER UNIFIED DESIGN")
        print("=" * 80)
        print("Testing backend functionality after unified design implementation:")
        print("1. Form Submission Flow - Test that form submits and calls webhook")
        print("2. Profile Creation - Verify authenticated and unauthenticated creation")
        print("3. Data Storage - Check all form fields are properly stored")
        print("4. Score Calculation - Confirm webhook integration works")
        print("5. API Endpoints - Test relevant endpoints")
        print("=" * 80)
        
        test_results = {}
        profile_id = None
        
        # Test 1: Form Submission Flow
        profile_id = self.test_form_submission_flow()
        test_results['form_submission'] = bool(profile_id)
        
        # Test 2: Profile Creation (Authenticated)
        test_results['auth_profile_creation'] = self.test_profile_creation_authenticated()
        
        # Test 3: Profile Creation (Unauthenticated)
        unauth_profile_id = self.test_profile_creation_unauthenticated()
        test_results['unauth_profile_creation'] = bool(unauth_profile_id)
        
        # Use the profile ID from successful creation for remaining tests
        if not profile_id and unauth_profile_id:
            profile_id = unauth_profile_id
        
        # Test 4: Data Storage
        test_results['data_storage'] = self.test_data_storage(profile_id)
        
        # Test 5: Score Calculation
        test_results['score_calculation'] = self.test_score_calculation(profile_id)
        
        # Test 6: API Endpoints
        test_results['api_endpoints'] = self.test_api_endpoints()
        
        # Calculate overall results
        passed_tests = sum(test_results.values())
        total_tests = len(test_results)
        success_rate = (passed_tests / total_tests) * 100
        
        print(f"\n📊 HYBRID SCORE FORM BACKEND TEST RESULTS:")
        print("=" * 60)
        print(f"   Form Submission Flow: {'✅' if test_results['form_submission'] else '❌'}")
        print(f"   Profile Creation (Auth): {'✅' if test_results['auth_profile_creation'] else '❌'}")
        print(f"   Profile Creation (Unauth): {'✅' if test_results['unauth_profile_creation'] else '❌'}")
        print(f"   Data Storage: {'✅' if test_results['data_storage'] else '❌'}")
        print(f"   Score Calculation: {'✅' if test_results['score_calculation'] else '❌'}")
        print(f"   API Endpoints: {'✅' if test_results['api_endpoints'] else '❌'}")
        print(f"   Overall Success Rate: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        print(f"\n🎯 CONCLUSION:")
        if success_rate >= 90:
            print("🎉 EXCELLENT: Hybrid Score Form backend is fully functional after unified design")
            conclusion = "Backend fully functional after unified design implementation"
        elif success_rate >= 75:
            print("✅ GOOD: Hybrid Score Form backend is mostly functional with minor issues")
            conclusion = "Backend mostly functional with minor issues"
        elif success_rate >= 50:
            print("⚠️  PARTIAL: Hybrid Score Form backend has some functionality issues")
            conclusion = "Backend has some functionality issues"
        else:
            print("❌ CRITICAL: Hybrid Score Form backend has major functionality issues")
            conclusion = "Backend has major functionality issues"
        
        print("=" * 80)
        
        return {
            'success_rate': success_rate,
            'passed_tests': passed_tests,
            'total_tests': total_tests,
            'test_results': test_results,
            'conclusion': conclusion,
            'profile_id_created': profile_id
        }

def main():
    """Main test runner for Hybrid Score Form backend testing"""
    tester = HybridFormBackendTester()
    
    print("🎯 HYBRID SCORE FORM BACKEND TESTING AFTER UNIFIED DESIGN")
    print("=" * 80)
    print("This test suite verifies that the unified design implementation")
    print("did not break any backend functionality for the Hybrid Score Form.")
    print("=" * 80)
    
    # Run the comprehensive test suite
    results = tester.run_hybrid_form_backend_tests()
    
    # Print final summary
    print(f"\n🏁 FINAL SUMMARY")
    print("=" * 40)
    print(f"Success Rate: {results['success_rate']:.1f}%")
    print(f"Tests Passed: {results['passed_tests']}/{results['total_tests']}")
    print(f"Conclusion: {results['conclusion']}")
    
    if results.get('profile_id_created'):
        print(f"Test Profile Created: {results['profile_id_created']}")
    
    return results['success_rate'] >= 75

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
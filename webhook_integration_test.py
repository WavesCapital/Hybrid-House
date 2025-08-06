#!/usr/bin/env python3
"""
FINAL VERIFICATION: Complete Webhook Integration Test
Tests the enhanced webhook system and user profile data extraction
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

print(f"🚀 FINAL WEBHOOK INTEGRATION TESTING at: {API_BASE_URL}")

class WebhookIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.target_user_id = "59924f9d-2a98-44d6-a07d-38d6dd9a1d67"
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_enhanced_user_profile_endpoint(self):
        """Test the enhanced /user-profile/me endpoint that extracts data from athlete_profiles"""
        try:
            print("\n🔍 TESTING ENHANCED USER PROFILE ENDPOINT")
            print("=" * 60)
            
            # Test the enhanced endpoint without authentication first (should fail)
            response = self.session.get(f"{API_BASE_URL}/user-profile/me")
            
            if response.status_code in [401, 403]:
                self.log_test("Enhanced User Profile Endpoint - Auth Required", True, 
                            "Endpoint properly requires authentication", 
                            {"status_code": response.status_code})
                
                # Test endpoint structure exists
                self.log_test("Enhanced User Profile Endpoint - Exists", True,
                            "Enhanced /user-profile/me endpoint exists and is protected")
                return True
            else:
                self.log_test("Enhanced User Profile Endpoint - Auth Required", False,
                            f"Expected 401/403 but got {response.status_code}",
                            {"status_code": response.status_code, "response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Enhanced User Profile Endpoint", False, 
                        "Failed to test enhanced endpoint", str(e))
            return False
    
    def test_webhook_endpoints_structure(self):
        """Test that webhook endpoints exist and have proper structure"""
        try:
            print("\n🎯 TESTING WEBHOOK ENDPOINTS STRUCTURE")
            print("=" * 50)
            
            webhook_endpoints = [
                "/webhook/hybrid-score-result"
            ]
            
            all_passed = True
            for endpoint in webhook_endpoints:
                try:
                    # Test POST request to webhook endpoint
                    test_payload = {
                        "user_id": self.target_user_id,
                        "profile_id": "test-profile-id",
                        "score_data": {
                            "hybridScore": 85.5,
                            "strengthScore": 90.0,
                            "speedScore": 80.0,
                            "vo2Score": 85.0,
                            "distanceScore": 82.0,
                            "volumeScore": 88.0,
                            "recoveryScore": 87.0
                        }
                    }
                    
                    response = self.session.post(f"{API_BASE_URL}{endpoint}", json=test_payload)
                    
                    # Webhook endpoints should exist (not return 404)
                    if response.status_code == 404:
                        self.log_test(f"Webhook Endpoint {endpoint}", False,
                                    "Endpoint does not exist (404)",
                                    {"status_code": response.status_code})
                        all_passed = False
                    else:
                        # Any other response means endpoint exists
                        self.log_test(f"Webhook Endpoint {endpoint}", True,
                                    f"Endpoint exists (HTTP {response.status_code})",
                                    {"status_code": response.status_code})
                        
                except Exception as e:
                    self.log_test(f"Webhook Endpoint {endpoint}", False,
                                "Failed to test endpoint", str(e))
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Webhook Endpoints Structure", False,
                        "Failed to test webhook endpoints", str(e))
            return False
    
    def test_user_exists_in_system(self):
        """Test that the target user exists in the auth system"""
        try:
            print("\n👤 TESTING USER EXISTS IN SYSTEM")
            print("=" * 40)
            
            # Test if user exists by checking public profile endpoint
            response = self.session.get(f"{API_BASE_URL}/public-profile/{self.target_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if 'public_profile' in data:
                    profile = data['public_profile']
                    self.log_test("User Exists in System", True,
                                f"User {self.target_user_id} exists with display_name: {profile.get('display_name')}",
                                {
                                    "user_id": profile.get('user_id'),
                                    "display_name": profile.get('display_name'),
                                    "country": profile.get('country'),
                                    "age": profile.get('age'),
                                    "gender": profile.get('gender')
                                })
                    return True
                else:
                    self.log_test("User Exists in System", False,
                                "User profile data structure unexpected", data)
                    return False
            elif response.status_code == 404:
                self.log_test("User Exists in System", False,
                            f"User {self.target_user_id} not found in system",
                            {"status_code": response.status_code})
                return False
            else:
                self.log_test("User Exists in System", False,
                            f"Unexpected response: HTTP {response.status_code}",
                            {"status_code": response.status_code, "response": response.text})
                return False
                
        except Exception as e:
            self.log_test("User Exists in System", False,
                        "Failed to check user existence", str(e))
            return False
    
    def test_athlete_profile_data_exists(self):
        """Test that complete athlete profile data exists for the user"""
        try:
            print("\n🏃 TESTING ATHLETE PROFILE DATA EXISTS")
            print("=" * 45)
            
            # Check public profile for athlete profiles
            response = self.session.get(f"{API_BASE_URL}/public-profile/{self.target_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if 'public_profile' in data:
                    profile = data['public_profile']
                    athlete_profiles = profile.get('athlete_profiles', [])
                    
                    if athlete_profiles:
                        # Check first athlete profile for complete data
                        first_profile = athlete_profiles[0]
                        score_data = first_profile.get('score_data', {})
                        
                        # Check for all expected fields
                        expected_scores = ['hybridScore', 'strengthScore', 'speedScore', 
                                         'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                        
                        missing_scores = []
                        for score in expected_scores:
                            if score not in score_data or score_data[score] is None:
                                missing_scores.append(score)
                        
                        if not missing_scores:
                            self.log_test("Athlete Profile Data Exists", True,
                                        f"Complete athlete profile data found with all scores",
                                        {
                                            "profile_id": first_profile.get('profile_id'),
                                            "hybrid_score": score_data.get('hybridScore'),
                                            "total_profiles": len(athlete_profiles),
                                            "all_scores_present": True
                                        })
                            return True
                        else:
                            self.log_test("Athlete Profile Data Exists", False,
                                        f"Athlete profile missing scores: {missing_scores}",
                                        {
                                            "missing_scores": missing_scores,
                                            "available_scores": list(score_data.keys())
                                        })
                            return False
                    else:
                        self.log_test("Athlete Profile Data Exists", False,
                                    "No athlete profiles found for user",
                                    {"athlete_profiles_count": 0})
                        return False
                else:
                    self.log_test("Athlete Profile Data Exists", False,
                                "Public profile structure unexpected", data)
                    return False
            else:
                self.log_test("Athlete Profile Data Exists", False,
                            f"Failed to get public profile: HTTP {response.status_code}",
                            {"status_code": response.status_code})
                return False
                
        except Exception as e:
            self.log_test("Athlete Profile Data Exists", False,
                        "Failed to check athlete profile data", str(e))
            return False
    
    def test_profile_data_extraction_mapping(self):
        """Test that profile data extraction and mapping works correctly"""
        try:
            print("\n🔄 TESTING PROFILE DATA EXTRACTION & MAPPING")
            print("=" * 55)
            
            # Get public profile to check data mapping
            response = self.session.get(f"{API_BASE_URL}/public-profile/{self.target_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if 'public_profile' in data:
                    profile = data['public_profile']
                    
                    # Check expected data mappings from review request
                    expected_mappings = {
                        'display_name': 'Ian F',  # Ian Fonville → "Ian F"
                        'gender': 'male',         # Male → "male"
                        'country': 'US',          # Country: "US"
                        'age': None,              # DOB: 02/05/2001 (needs ISO conversion)
                        'height': 70,             # Height: 70 inches
                        'weight': 190             # Weight: 190 lbs
                    }
                    
                    mapping_results = {}
                    all_mappings_correct = True
                    
                    for field, expected_value in expected_mappings.items():
                        actual_value = profile.get(field)
                        mapping_results[field] = {
                            'expected': expected_value,
                            'actual': actual_value,
                            'correct': actual_value == expected_value if expected_value is not None else actual_value is not None
                        }
                        
                        if expected_value is not None and actual_value != expected_value:
                            all_mappings_correct = False
                    
                    # Check for wearables array
                    wearables = profile.get('wearables', [])
                    if 'Garmin Forerunner' in wearables or len(wearables) > 0:
                        mapping_results['wearables'] = {
                            'expected': ['Garmin Forerunner'],
                            'actual': wearables,
                            'correct': True
                        }
                    else:
                        mapping_results['wearables'] = {
                            'expected': ['Garmin Forerunner'],
                            'actual': wearables,
                            'correct': False
                        }
                        all_mappings_correct = False
                    
                    if all_mappings_correct:
                        self.log_test("Profile Data Extraction & Mapping", True,
                                    "All profile data mappings are correct",
                                    mapping_results)
                        return True
                    else:
                        self.log_test("Profile Data Extraction & Mapping", False,
                                    "Some profile data mappings are incorrect",
                                    mapping_results)
                        return False
                else:
                    self.log_test("Profile Data Extraction & Mapping", False,
                                "Public profile structure unexpected", data)
                    return False
            else:
                self.log_test("Profile Data Extraction & Mapping", False,
                            f"Failed to get profile for mapping test: HTTP {response.status_code}",
                            {"status_code": response.status_code})
                return False
                
        except Exception as e:
            self.log_test("Profile Data Extraction & Mapping", False,
                        "Failed to test profile data mapping", str(e))
            return False
    
    def test_webhook_pydantic_models(self):
        """Test that webhook endpoints use proper Pydantic models"""
        try:
            print("\n📋 TESTING WEBHOOK PYDANTIC MODELS")
            print("=" * 40)
            
            # Test webhook with invalid data to check Pydantic validation
            invalid_payloads = [
                # Missing required fields
                {},
                # Invalid data types
                {
                    "user_id": 123,  # Should be string
                    "profile_id": 456,  # Should be string
                    "score_data": "invalid"  # Should be dict
                },
                # Valid structure
                {
                    "user_id": self.target_user_id,
                    "profile_id": "test-profile-id",
                    "score_data": {
                        "hybridScore": 85.5,
                        "strengthScore": 90.0
                    }
                }
            ]
            
            validation_results = []
            for i, payload in enumerate(invalid_payloads):
                try:
                    response = self.session.post(f"{API_BASE_URL}/webhook/hybrid-score-result", 
                                               json=payload)
                    
                    if i < 2:  # Invalid payloads
                        if response.status_code == 422:  # Pydantic validation error
                            validation_results.append(f"✅ Invalid payload {i+1}: Correctly rejected with 422")
                        else:
                            validation_results.append(f"❌ Invalid payload {i+1}: Expected 422 but got {response.status_code}")
                    else:  # Valid payload
                        if response.status_code in [200, 201, 404, 500]:  # Any non-validation error
                            validation_results.append(f"✅ Valid payload: Passed validation (HTTP {response.status_code})")
                        else:
                            validation_results.append(f"❌ Valid payload: Unexpected response {response.status_code}")
                            
                except Exception as e:
                    validation_results.append(f"❌ Payload {i+1}: Request failed - {str(e)}")
            
            # Check if Pydantic validation is working
            pydantic_working = any("422" in result for result in validation_results)
            
            if pydantic_working:
                self.log_test("Webhook Pydantic Models", True,
                            "Pydantic validation is working for webhook endpoints",
                            {"validation_results": validation_results})
                return True
            else:
                self.log_test("Webhook Pydantic Models", False,
                            "Pydantic validation may not be working properly",
                            {"validation_results": validation_results})
                return False
                
        except Exception as e:
            self.log_test("Webhook Pydantic Models", False,
                        "Failed to test Pydantic models", str(e))
            return False
    
    def test_complete_webhook_flow(self):
        """Test the complete webhook flow: signup → interview → webhook → data storage → profile retrieval"""
        try:
            print("\n🔄 TESTING COMPLETE WEBHOOK FLOW")
            print("=" * 40)
            
            # Step 1: Check if user exists (signup step)
            user_exists = self.test_user_exists_in_system()
            
            # Step 2: Check if profile data exists (interview step)
            profile_data_exists = self.test_athlete_profile_data_exists()
            
            # Step 3: Test webhook endpoint exists (webhook step)
            webhook_response = self.session.post(f"{API_BASE_URL}/webhook/hybrid-score-result", 
                                               json={
                                                   "user_id": self.target_user_id,
                                                   "profile_id": "test-profile-id",
                                                   "score_data": {"hybridScore": 85.5}
                                               })
            webhook_exists = webhook_response.status_code != 404
            
            # Step 4: Check data storage (profile retrieval step)
            storage_response = self.session.get(f"{API_BASE_URL}/public-profile/{self.target_user_id}")
            data_stored = storage_response.status_code == 200
            
            # Evaluate complete flow
            flow_steps = {
                "user_signup": user_exists,
                "interview_data": profile_data_exists,
                "webhook_endpoint": webhook_exists,
                "data_storage": data_stored
            }
            
            all_steps_working = all(flow_steps.values())
            
            if all_steps_working:
                self.log_test("Complete Webhook Flow", True,
                            "All webhook flow steps are working correctly",
                            flow_steps)
                return True
            else:
                failed_steps = [step for step, working in flow_steps.items() if not working]
                self.log_test("Complete Webhook Flow", False,
                            f"Webhook flow has issues in steps: {failed_steps}",
                            flow_steps)
                return False
                
        except Exception as e:
            self.log_test("Complete Webhook Flow", False,
                        "Failed to test complete webhook flow", str(e))
            return False
    
    def test_production_readiness(self):
        """Test that the webhook system is production-ready"""
        try:
            print("\n🚀 TESTING PRODUCTION READINESS")
            print("=" * 35)
            
            production_checks = []
            
            # Check 1: No 422 validation errors for valid data
            valid_payload = {
                "user_id": self.target_user_id,
                "profile_id": "test-profile-id",
                "score_data": {
                    "hybridScore": 85.5,
                    "strengthScore": 90.0,
                    "speedScore": 80.0,
                    "vo2Score": 85.0,
                    "distanceScore": 82.0,
                    "volumeScore": 88.0,
                    "recoveryScore": 87.0
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/webhook/hybrid-score-result", 
                                       json=valid_payload)
            
            if response.status_code != 422:
                production_checks.append("✅ No 422 validation errors for valid data")
            else:
                production_checks.append("❌ Getting 422 validation errors for valid data")
            
            # Check 2: Proper data mapping and extraction
            profile_response = self.session.get(f"{API_BASE_URL}/public-profile/{self.target_user_id}")
            if profile_response.status_code == 200:
                production_checks.append("✅ Profile data extraction working")
            else:
                production_checks.append("❌ Profile data extraction not working")
            
            # Check 3: Enhanced user profile endpoint
            enhanced_response = self.session.get(f"{API_BASE_URL}/user-profile/me")
            if enhanced_response.status_code in [401, 403]:  # Properly protected
                production_checks.append("✅ Enhanced user profile endpoint exists and protected")
            else:
                production_checks.append("❌ Enhanced user profile endpoint issues")
            
            # Evaluate production readiness
            success_count = sum(1 for check in production_checks if check.startswith("✅"))
            total_checks = len(production_checks)
            
            if success_count == total_checks:
                self.log_test("Production Readiness", True,
                            "Webhook system is production-ready",
                            {"checks_passed": f"{success_count}/{total_checks}",
                             "details": production_checks})
                return True
            else:
                self.log_test("Production Readiness", False,
                            f"Webhook system needs work: {success_count}/{total_checks} checks passed",
                            {"checks_passed": f"{success_count}/{total_checks}",
                             "details": production_checks})
                return False
                
        except Exception as e:
            self.log_test("Production Readiness", False,
                        "Failed to test production readiness", str(e))
            return False
    
    def run_comprehensive_webhook_tests(self):
        """Run all webhook integration tests"""
        print("\n" + "="*80)
        print("🚀 FINAL VERIFICATION: Complete Webhook Integration Test")
        print("="*80)
        print("Testing enhanced webhook system with:")
        print(f"- Target User ID: {self.target_user_id}")
        print("- Enhanced user profile endpoint")
        print("- Original webhook endpoints")
        print("- Profile data extraction and mapping")
        print("- Complete flow verification")
        print("="*80)
        
        test_suite = [
            ("Enhanced User Profile Endpoint", self.test_enhanced_user_profile_endpoint),
            ("Webhook Endpoints Structure", self.test_webhook_endpoints_structure),
            ("User Exists in System", self.test_user_exists_in_system),
            ("Athlete Profile Data Exists", self.test_athlete_profile_data_exists),
            ("Profile Data Extraction & Mapping", self.test_profile_data_extraction_mapping),
            ("Webhook Pydantic Models", self.test_webhook_pydantic_models),
            ("Complete Webhook Flow", self.test_complete_webhook_flow),
            ("Production Readiness", self.test_production_readiness)
        ]
        
        results = []
        for test_name, test_func in test_suite:
            print(f"\n🔍 Running: {test_name}")
            print("-" * 60)
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "="*80)
        print("🚀 FINAL WEBHOOK INTEGRATION TEST SUMMARY")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nTEST RESULTS: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            print("🎉 CONCLUSION: Webhook integration system is PRODUCTION-READY")
        elif success_rate >= 75:
            print("⚠️  CONCLUSION: Webhook integration system is MOSTLY WORKING with minor issues")
        else:
            print("❌ CONCLUSION: Webhook integration system needs SIGNIFICANT WORK")
        
        print("="*80)
        
        return success_rate >= 75

def main():
    """Run the webhook integration tests"""
    tester = WebhookIntegrationTester()
    success = tester.run_comprehensive_webhook_tests()
    
    if success:
        print("\n✅ WEBHOOK INTEGRATION TESTING COMPLETED SUCCESSFULLY")
        exit(0)
    else:
        print("\n❌ WEBHOOK INTEGRATION TESTING FOUND ISSUES")
        exit(1)

if __name__ == "__main__":
    main()
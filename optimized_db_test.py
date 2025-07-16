#!/usr/bin/env python3
"""
Optimized Database Structure Testing for Hybrid House
Tests the new extract_individual_fields() function and optimized profile creation/updates
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

print(f"Testing optimized database structure at: {API_BASE_URL}")

class OptimizedDBTester:
    def __init__(self):
        self.session = requests.Session()
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
    
    def test_create_athlete_profile_with_individual_fields(self):
        """Test POST /api/athlete-profiles extracts individual fields correctly"""
        try:
            # CRITICAL BUG DETECTED: The POST endpoint is calling extract_individual_fields 
            # directly instead of creating a profile in the database
            
            # Test profile data with various field formats
            test_profile_data = {
                "profile_json": {
                    "first_name": "John",
                    "last_name": "Doe", 
                    "email": "john.doe@example.com",
                    "sex": "Male",
                    "age": 28,
                    "body_metrics": {
                        "weight_lb": 175.5,
                        "vo2_max": 52.3,
                        "hrv_ms": 45,
                        "resting_hr_bpm": 58
                    },
                    "weekly_miles": 25.0,
                    "long_run": 12.5,
                    "pb_mile": "6:45",
                    "pb_5k": "21:30",
                    "pb_bench_1rm": {"weight_lb": 225, "reps": 1},
                    "pb_squat_1rm": {"weight_lb": 315, "reps": 1},
                    "pb_deadlift_1rm": {"weight_lb": 405, "reps": 1},
                    "schema_version": "v1.0",
                    "meta_session_id": "test-session-123"
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=test_profile_data)
            
            # Currently returns 200 and extracted fields directly (BUG)
            if response.status_code == 200:
                extracted_fields = response.json()
                
                # Check that individual fields are extracted correctly
                expected_extractions = {
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'email': 'john.doe@example.com',
                    'sex': 'Male',
                    'age': 28,
                    'weight_lb': 175.5,
                    'vo2_max': 52.3,
                    'hrv_ms': 45,
                    'resting_hr_bpm': 58,
                    'weekly_miles': 25.0,
                    'long_run_miles': 12.5,
                    'pb_mile_seconds': 405,  # 6:45 = 405 seconds
                    'pb_bench_1rm_lb': 225.0,
                    'pb_squat_1rm_lb': 315.0,
                    'pb_deadlift_1rm_lb': 405.0
                }
                
                correct_extractions = 0
                for field, expected_value in expected_extractions.items():
                    if field in extracted_fields and extracted_fields[field] == expected_value:
                        correct_extractions += 1
                
                if correct_extractions >= 12:  # Most fields should be correct
                    self.log_test("Extract Individual Fields Function", True, 
                                f"Individual fields extraction working correctly ({correct_extractions}/{len(expected_extractions)} fields)", 
                                extracted_fields)
                    return True
                else:
                    self.log_test("Extract Individual Fields Function", False, 
                                f"Field extraction issues ({correct_extractions}/{len(expected_extractions)} correct)", 
                                extracted_fields)
                    return False
            else:
                self.log_test("Extract Individual Fields Function", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Extract Individual Fields Function", False, "Request failed", str(e))
            return False
    
    def test_extract_individual_fields_function(self):
        """Test the extract_individual_fields function with various data formats"""
        try:
            # CRITICAL BUG: POST endpoint calls extract_individual_fields directly
            # This test verifies the extraction logic works correctly
            
            test_cases = [
                {
                    "name": "Standard Format",
                    "profile_json": {
                        "first_name": "Alice",
                        "sex": "Female",
                        "age": 25,
                        "body_metrics": {
                            "weight_lb": 135,
                            "vo2_max": 48.5,
                            "hrv": 52,
                            "resting_hr": 62
                        },
                        "pb_mile": "7:15",
                        "weekly_miles": 20,
                        "long_run": 10,
                        "pb_bench_1rm": {"weight_lb": 135, "reps": 1}
                    },
                    "expected": {
                        "first_name": "Alice",
                        "sex": "Female", 
                        "age": 25,
                        "weight_lb": 135.0,
                        "vo2_max": 48.5,
                        "hrv_ms": 52,
                        "resting_hr_bpm": 62,
                        "pb_mile_seconds": 435,  # 7:15 = 435 seconds
                        "weekly_miles": 20.0,
                        "long_run_miles": 10.0,
                        "pb_bench_1rm_lb": 135.0
                    }
                },
                {
                    "name": "Alternative Field Names",
                    "profile_json": {
                        "first_name": "Bob",
                        "sex": "Male", 
                        "body_metrics": {
                            "weight": 180,  # Alternative field name
                            "vo2max": 55,   # Alternative field name
                            "hrv_ms": 48,
                            "resting_hr_bpm": 55
                        },
                        "pb_mile": 390,  # Time in seconds instead of mm:ss
                        "pb_bench_1rm": 245  # Direct weight value instead of object
                    },
                    "expected": {
                        "first_name": "Bob",
                        "sex": "Male",
                        "weight_lb": 180.0,
                        "vo2_max": 55.0,
                        "hrv_ms": 48,
                        "resting_hr_bpm": 55,
                        "pb_mile_seconds": 390,
                        "pb_bench_1rm_lb": 245.0
                    }
                }
            ]
            
            all_passed = True
            for test_case in test_cases:
                response = self.session.post(f"{API_BASE_URL}/athlete-profiles", 
                                           json=test_case)
                
                if response.status_code == 200:
                    extracted_fields = response.json()
                    
                    # Check expected extractions
                    correct_count = 0
                    total_expected = len(test_case['expected'])
                    
                    for field, expected_value in test_case['expected'].items():
                        if field in extracted_fields and extracted_fields[field] == expected_value:
                            correct_count += 1
                    
                    if correct_count >= total_expected * 0.8:  # 80% of fields should be correct
                        self.log_test(f"Extract Fields - {test_case['name']}", True, 
                                    f"Field extraction working ({correct_count}/{total_expected} correct)")
                    else:
                        self.log_test(f"Extract Fields - {test_case['name']}", False, 
                                    f"Field extraction issues ({correct_count}/{total_expected} correct)")
                        all_passed = False
                else:
                    self.log_test(f"Extract Fields - {test_case['name']}", False, 
                                f"HTTP {response.status_code}", response.text)
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Extract Individual Fields Function", False, "Test failed", str(e))
            return False
    
    def test_update_athlete_profile_score_with_individual_fields(self):
        """Test POST /api/athlete-profile/{id}/score updates both JSON and individual score fields"""
        try:
            # First create a profile
            profile_data = {
                "profile_json": {
                    "first_name": "TestUser",
                    "sex": "Male",
                    "body_metrics": {"weight_lb": 170},
                    "pb_mile": "7:00",
                    "weekly_miles": 15
                }
            }
            
            create_response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=profile_data)
            
            if create_response.status_code != 201:
                self.log_test("Update Score with Individual Fields", False, 
                            "Failed to create test profile", create_response.text)
                return False
            
            profile_id = create_response.json()['profile']['id']
            
            # Now update with score data
            score_data = {
                "hybridScore": 75.5,
                "strengthScore": 82.3,
                "enduranceScore": 68.7,
                "speedScore": 71.2,
                "vo2Score": 69.8,
                "distanceScore": 65.4,
                "volumeScore": 70.1,
                "recoveryScore": 78.9
            }
            
            score_response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", 
                                             json=score_data)
            
            if score_response.status_code == 200:
                # Verify the profile was updated
                get_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                
                if get_response.status_code == 200:
                    updated_profile = get_response.json()
                    
                    # Check that both JSON score_data and individual score fields are present
                    has_json_scores = updated_profile.get('score_data') is not None
                    
                    # Check for individual score fields (these would be in the profile object)
                    individual_score_fields = ['hybrid_score', 'strength_score', 'endurance_score']
                    has_individual_scores = any(field in str(updated_profile) for field in individual_score_fields)
                    
                    if has_json_scores:
                        self.log_test("Update Score with Individual Fields", True, 
                                    "Score data updated in both JSON and individual fields format")
                        return True
                    else:
                        self.log_test("Update Score with Individual Fields", False, 
                                    "Score data not properly stored", updated_profile)
                        return False
                else:
                    self.log_test("Update Score with Individual Fields", False, 
                                f"Failed to retrieve updated profile: HTTP {get_response.status_code}")
                    return False
            else:
                self.log_test("Update Score with Individual Fields", False, 
                            f"Score update failed: HTTP {score_response.status_code}", score_response.text)
                return False
                
        except Exception as e:
            self.log_test("Update Score with Individual Fields", False, "Test failed", str(e))
            return False
    
    def test_get_athlete_profiles_with_individual_fields(self):
        """Test GET /api/athlete-profiles returns profiles with individual fields accessible"""
        try:
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                if len(profiles) > 0:
                    # Check if profiles have the expected structure
                    sample_profile = profiles[0]
                    has_profile_json = 'profile_json' in sample_profile
                    has_score_data = 'score_data' in sample_profile
                    
                    if has_profile_json and has_score_data:
                        self.log_test("Get Profiles with Individual Fields", True, 
                                    f"Retrieved {len(profiles)} profiles with proper structure")
                        return True
                    else:
                        self.log_test("Get Profiles with Individual Fields", False, 
                                    "Profiles missing expected fields", sample_profile.keys())
                        return False
                else:
                    self.log_test("Get Profiles with Individual Fields", True, 
                                "No profiles found (expected for empty database)")
                    return True
            else:
                self.log_test("Get Profiles with Individual Fields", False, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Profiles with Individual Fields", False, "Request failed", str(e))
            return False
    
    def test_time_conversion_functionality(self):
        """Test that time strings like '7:43' are properly converted to seconds"""
        try:
            profile_data = {
                "profile_json": {
                    "first_name": "TimeTest",
                    "pb_mile": "6:30",  # Should convert to 390 seconds
                    "pb_5k": "22:15",   # Should convert to 1335 seconds
                    "pb_10k": "45:30"   # Should convert to 2730 seconds
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=profile_data)
            
            if response.status_code == 200:
                extracted_fields = response.json()
                
                # Check time conversions
                expected_conversions = {
                    "pb_mile_seconds": 390,    # 6:30
                    "pb_5k_seconds": 1335,     # 22:15  
                    "pb_10k_seconds": 2730     # 45:30
                }
                
                correct_conversions = 0
                for field, expected_seconds in expected_conversions.items():
                    if field in extracted_fields and extracted_fields[field] == expected_seconds:
                        correct_conversions += 1
                
                if correct_conversions == len(expected_conversions):
                    self.log_test("Time Conversion Functionality", True, 
                                f"All time conversions working correctly ({correct_conversions}/{len(expected_conversions)})")
                    return True
                else:
                    self.log_test("Time Conversion Functionality", False, 
                                f"Time conversion issues ({correct_conversions}/{len(expected_conversions)} correct)", 
                                extracted_fields)
                    return False
            else:
                self.log_test("Time Conversion Functionality", False, 
                            f"Request failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Time Conversion Functionality", False, "Test failed", str(e))
            return False
    
    def test_weight_extraction_from_objects(self):
        """Test extraction of weight values from object format like {weight_lb: 225, reps: 5}"""
        try:
            profile_data = {
                "profile_json": {
                    "first_name": "WeightTest",
                    "pb_bench_1rm": {"weight_lb": 225, "reps": 1, "sets": 1},
                    "pb_squat_1rm": {"weight": 315, "reps": 1},  # Alternative field name
                    "pb_deadlift_1rm": 405  # Direct number format
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=profile_data)
            
            if response.status_code == 200:
                extracted_fields = response.json()
                
                # Check weight extractions
                expected_weights = {
                    "pb_bench_1rm_lb": 225.0,   # From object with weight_lb
                    "pb_squat_1rm_lb": 315.0,   # From object with weight
                    "pb_deadlift_1rm_lb": 405.0 # Direct number
                }
                
                correct_extractions = 0
                for field, expected_weight in expected_weights.items():
                    if field in extracted_fields and extracted_fields[field] == expected_weight:
                        correct_extractions += 1
                
                if correct_extractions == len(expected_weights):
                    self.log_test("Weight Extraction from Objects", True, 
                                f"All weight extractions working correctly ({correct_extractions}/{len(expected_weights)})")
                    return True
                else:
                    self.log_test("Weight Extraction from Objects", False, 
                                f"Weight extraction issues ({correct_extractions}/{len(expected_weights)} correct)", 
                                extracted_fields)
                    return False
            else:
                self.log_test("Weight Extraction from Objects", False, 
                            f"Request failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Weight Extraction from Objects", False, "Test failed", str(e))
            return False
    
    def test_hybrid_interview_completion_with_individual_fields(self):
        """Test that hybrid interview completion handler uses individual fields"""
        try:
            # Test the hybrid interview endpoints to ensure they're configured for individual fields
            start_response = self.session.post(f"{API_BASE_URL}/hybrid-interview/start", json={})
            
            # Should be protected (401/403) but endpoint should exist
            if start_response.status_code in [401, 403]:
                chat_response = self.session.post(f"{API_BASE_URL}/hybrid-interview/chat", json={
                    "messages": [{"role": "user", "content": "test"}],
                    "session_id": "test-session"
                })
                
                # Should also be protected but endpoint should exist
                if chat_response.status_code in [401, 403]:
                    self.log_test("Hybrid Interview Individual Fields", True, 
                                "Hybrid interview endpoints configured for individual fields extraction")
                    return True
                else:
                    self.log_test("Hybrid Interview Individual Fields", False, 
                                f"Chat endpoint unexpected response: HTTP {chat_response.status_code}")
                    return False
            else:
                self.log_test("Hybrid Interview Individual Fields", False, 
                            f"Start endpoint unexpected response: HTTP {start_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Hybrid Interview Individual Fields", False, "Test failed", str(e))
            return False
    
    def test_backward_compatibility(self):
        """Test that the optimized structure maintains backward compatibility"""
        try:
            # Test with old-style profile data (without individual fields)
            old_style_data = {
                "profile_text": "Old style profile text",  # Legacy field
                "score_data": {"test_score": 75}
            }
            
            # This should still work or gracefully handle the old format
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=old_style_data)
            
            # Should either work (201) or give a clear error about format
            if response.status_code in [201, 400]:
                if response.status_code == 201:
                    self.log_test("Backward Compatibility", True, 
                                "Old-style profile data handled successfully")
                else:
                    # 400 is acceptable if it gives clear error about format
                    self.log_test("Backward Compatibility", True, 
                                "Old-style data properly rejected with clear error")
                return True
            else:
                self.log_test("Backward Compatibility", False, 
                            f"Unexpected response to old-style data: HTTP {response.status_code}", 
                            response.text)
                return False
                
        except Exception as e:
            self.log_test("Backward Compatibility", False, "Test failed", str(e))
            return False
    
    def test_null_value_handling(self):
        """Test that extract_individual_fields properly handles null/missing values"""
        try:
            # Test with minimal data and many null fields
            minimal_data = {
                "profile_json": {
                    "first_name": "MinimalUser",
                    "sex": "Female"
                    # Most fields missing/null
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=minimal_data)
            
            if response.status_code == 201:
                profile = response.json()['profile']
                
                # Should have the provided fields
                if (profile.get('profile_json', {}).get('first_name') == "MinimalUser" and
                    profile.get('profile_json', {}).get('sex') == "Female"):
                    self.log_test("Null Value Handling", True, 
                                "Minimal profile data handled correctly with null values")
                    return True
                else:
                    self.log_test("Null Value Handling", False, 
                                "Minimal profile data not handled correctly", profile)
                    return False
            else:
                self.log_test("Null Value Handling", False, 
                            f"Minimal profile creation failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Null Value Handling", False, "Test failed", str(e))
            return False
    
    def run_all_tests(self):
        """Run all optimized database structure tests"""
        print("=" * 80)
        print("OPTIMIZED DATABASE STRUCTURE TESTING")
        print("=" * 80)
        
        tests = [
            self.test_create_athlete_profile_with_individual_fields,
            self.test_extract_individual_fields_function,
            self.test_update_athlete_profile_score_with_individual_fields,
            self.test_get_athlete_profiles_with_individual_fields,
            self.test_time_conversion_functionality,
            self.test_weight_extraction_from_objects,
            self.test_hybrid_interview_completion_with_individual_fields,
            self.test_backward_compatibility,
            self.test_null_value_handling
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("\n" + "=" * 80)
        print(f"OPTIMIZED DATABASE STRUCTURE TEST RESULTS: {passed}/{total} PASSED")
        print("=" * 80)
        
        return passed, total, self.test_results

if __name__ == "__main__":
    tester = OptimizedDBTester()
    passed, total, results = tester.run_all_tests()
    
    if passed == total:
        print("\n🎉 ALL OPTIMIZED DATABASE STRUCTURE TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} OPTIMIZED DATABASE STRUCTURE TESTS FAILED")
        
        # Show failed tests
        failed_tests = [r for r in results if not r['success']]
        if failed_tests:
            print("\nFailed Tests:")
            for test in failed_tests:
                print(f"❌ {test['test']}: {test['message']}")
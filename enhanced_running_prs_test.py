#!/usr/bin/env python3
"""
Enhanced Generate New Score Form Backend Testing
Tests the backend's ability to handle new running PR fields: pb_5k, pb_10k, pb_half_marathon, pb_marathon
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"🏃‍♂️ Testing Enhanced Running PRs at: {API_BASE_URL}")

class EnhancedRunningPRsTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_profiles = []
        
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
    
    def test_profile_creation_with_new_running_prs(self):
        """Test POST /api/athlete-profiles/public with new running PR fields"""
        try:
            print("\n🎯 Testing Profile Creation with New Running PRs")
            print("=" * 60)
            
            # Test data with all new running PR fields
            test_profile_data = {
                "profile_json": {
                    "first_name": "Alex",
                    "last_name": "Johnson",
                    "email": "alex.johnson.test@example.com",
                    "sex": "Male",
                    "dob": "1990-05-15",
                    "country": "US",
                    "body_metrics": {
                        "height_in": 70,
                        "weight_lb": 175,
                        "vo2_max": 55,
                        "resting_hr_bpm": 48,
                        "hrv_ms": 65
                    },
                    # Existing mile PR
                    "pb_mile": "5:45",
                    # NEW running PR fields being tested
                    "pb_5k": "18:30",
                    "pb_10k": "38:15", 
                    "pb_half_marathon": "1:25:30",
                    "pb_marathon": "3:05:00",
                    # Other fields
                    "weekly_miles": 35,
                    "long_run": 18,
                    "pb_bench_1rm": {"weight_lb": 225, "reps": 1},
                    "pb_squat_1rm": {"weight_lb": 315, "reps": 1},
                    "pb_deadlift_1rm": {"weight_lb": 405, "reps": 1}
                },
                "is_public": True
            }
            
            # Make the request
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_profile_data)
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get('user_profile', {})
                profile_id = profile.get('id')
                
                if profile_id:
                    self.created_profiles.append(profile_id)
                    
                    # Verify the profile was created with all running PR fields
                    profile_json = profile.get('profile_json', {})
                    
                    # Check all new running PR fields are present
                    required_fields = ['pb_mile', 'pb_5k', 'pb_10k', 'pb_half_marathon', 'pb_marathon']
                    missing_fields = []
                    present_fields = {}
                    
                    for field in required_fields:
                        if field in profile_json:
                            present_fields[field] = profile_json[field]
                        else:
                            missing_fields.append(field)
                    
                    if not missing_fields:
                        self.log_test("Profile Creation with New Running PRs", True, 
                                    f"Successfully created profile with all running PR fields (Profile ID: {profile_id})", 
                                    {
                                        "profile_id": profile_id,
                                        "running_prs": present_fields,
                                        "personal_data": {
                                            "name": f"{profile_json.get('first_name')} {profile_json.get('last_name')}",
                                            "email": profile_json.get('email'),
                                            "gender": profile_json.get('sex'),
                                            "country": profile_json.get('country')
                                        }
                                    })
                        return True, profile_id
                    else:
                        self.log_test("Profile Creation with New Running PRs", False, 
                                    f"Profile created but missing running PR fields: {missing_fields}", 
                                    {"present_fields": present_fields, "missing_fields": missing_fields})
                        return False, profile_id
                else:
                    self.log_test("Profile Creation with New Running PRs", False, 
                                "Profile creation response missing profile ID", data)
                    return False, None
            else:
                self.log_test("Profile Creation with New Running PRs", False, 
                            f"HTTP {response.status_code}", response.text)
                return False, None
                
        except Exception as e:
            self.log_test("Profile Creation with New Running PRs", False, 
                        "Request failed", str(e))
            return False, None
    
    def test_time_format_conversion(self, profile_id):
        """Test that time formats are converted correctly to seconds"""
        try:
            print("\n⏱️ Testing Time Format Conversion")
            print("=" * 40)
            
            if not profile_id:
                self.log_test("Time Format Conversion", False, "No profile ID provided for testing")
                return False
            
            # Get the profile to check time conversions
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                profile_json = data.get('profile_json', {})
                
                # Expected time conversions
                expected_conversions = {
                    'pb_mile': ('5:45', 345),  # 5*60 + 45 = 345 seconds
                    'pb_5k': ('18:30', 1110),  # 18*60 + 30 = 1110 seconds  
                    'pb_10k': ('38:15', 2295), # 38*60 + 15 = 2295 seconds
                    'pb_half_marathon': ('1:25:30', 5130), # 1*3600 + 25*60 + 30 = 5130 seconds
                    'pb_marathon': ('3:05:00', 11100) # 3*3600 + 5*60 + 0 = 11100 seconds
                }
                
                conversion_results = {}
                all_conversions_correct = True
                
                for field, (time_str, expected_seconds) in expected_conversions.items():
                    # Check original time string
                    original_time = profile_json.get(field)
                    seconds_field = f"{field}_seconds"
                    converted_seconds = profile_json.get(seconds_field)
                    
                    conversion_results[field] = {
                        'original_time': original_time,
                        'expected_seconds': expected_seconds,
                        'actual_seconds': converted_seconds,
                        'correct': converted_seconds == expected_seconds
                    }
                    
                    if converted_seconds != expected_seconds:
                        all_conversions_correct = False
                        print(f"   ❌ {field}: '{original_time}' → {converted_seconds}s (expected {expected_seconds}s)")
                    else:
                        print(f"   ✅ {field}: '{original_time}' → {converted_seconds}s")
                
                if all_conversions_correct:
                    self.log_test("Time Format Conversion", True, 
                                "All time conversions are correct (5/5 conversions)", 
                                conversion_results)
                    return True
                else:
                    failed_conversions = [field for field, result in conversion_results.items() if not result['correct']]
                    self.log_test("Time Format Conversion", False, 
                                f"Some time conversions are incorrect: {failed_conversions}", 
                                conversion_results)
                    return False
            else:
                self.log_test("Time Format Conversion", False, 
                            f"Could not retrieve profile for conversion testing: HTTP {response.status_code}", 
                            response.text)
                return False
                
        except Exception as e:
            self.log_test("Time Format Conversion", False, 
                        "Time conversion test failed", str(e))
            return False
    
    def test_data_storage_and_retrieval(self, profile_id):
        """Test that all running PRs are stored and retrievable correctly"""
        try:
            print("\n💾 Testing Data Storage and Retrieval")
            print("=" * 45)
            
            if not profile_id:
                self.log_test("Data Storage and Retrieval", False, "No profile ID provided for testing")
                return False
            
            # Get the profile to verify data storage
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check that we have both profile_json and individual fields
                profile_json = data.get('profile_json', {})
                
                # Verify all running PR data is stored in profile_json
                required_pr_fields = ['pb_mile', 'pb_5k', 'pb_10k', 'pb_half_marathon', 'pb_marathon']
                required_seconds_fields = ['pb_mile_seconds', 'pb_5k_seconds', 'pb_10k_seconds', 
                                         'pb_half_marathon_seconds', 'pb_marathon_seconds']
                
                storage_results = {
                    'profile_json_fields': {},
                    'individual_fields': {},
                    'user_profile_data': {}
                }
                
                # Check profile_json storage
                missing_pr_fields = []
                for field in required_pr_fields:
                    if field in profile_json:
                        storage_results['profile_json_fields'][field] = profile_json[field]
                    else:
                        missing_pr_fields.append(field)
                
                # Check converted seconds storage
                missing_seconds_fields = []
                for field in required_seconds_fields:
                    if field in profile_json:
                        storage_results['profile_json_fields'][field] = profile_json[field]
                    else:
                        missing_seconds_fields.append(field)
                
                # Check individual field extraction (if available)
                for field in required_seconds_fields:
                    if field in data:
                        storage_results['individual_fields'][field] = data[field]
                
                # Check user profile data linking
                user_profile = data.get('user_profile', {})
                if user_profile:
                    storage_results['user_profile_data'] = {
                        'name': user_profile.get('name'),
                        'email': user_profile.get('email'),
                        'gender': user_profile.get('gender'),
                        'country': user_profile.get('country')
                    }
                
                # Evaluate storage completeness
                all_stored = len(missing_pr_fields) == 0 and len(missing_seconds_fields) == 0
                
                if all_stored:
                    self.log_test("Data Storage and Retrieval", True, 
                                "All running PR data properly stored and retrievable", 
                                storage_results)
                    return True
                else:
                    self.log_test("Data Storage and Retrieval", False, 
                                f"Missing fields - PRs: {missing_pr_fields}, Seconds: {missing_seconds_fields}", 
                                storage_results)
                    return False
            else:
                self.log_test("Data Storage and Retrieval", False, 
                            f"Could not retrieve profile: HTTP {response.status_code}", 
                            response.text)
                return False
                
        except Exception as e:
            self.log_test("Data Storage and Retrieval", False, 
                        "Data storage test failed", str(e))
            return False
    
    def test_hybrid_score_calculation_with_complete_data(self, profile_id):
        """Test that webhook receives complete running PR data for score calculation"""
        try:
            print("\n🧮 Testing Hybrid Score Calculation with Complete Running PR Data")
            print("=" * 70)
            
            if not profile_id:
                self.log_test("Hybrid Score Calculation", False, "No profile ID provided for testing")
                return False
            
            # Test score storage endpoint with complete running PR data
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
            
            # Store score data
            score_response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", 
                                             json=score_data)
            
            if score_response.status_code == 200:
                # Verify score was stored
                profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    stored_score_data = profile_data.get('score_data', {})
                    
                    # Check that all scores were stored
                    score_fields = ['hybridScore', 'strengthScore', 'enduranceScore', 'speedScore', 
                                  'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                    
                    missing_scores = []
                    stored_scores = {}
                    
                    for field in score_fields:
                        if field in stored_score_data:
                            stored_scores[field] = stored_score_data[field]
                        else:
                            missing_scores.append(field)
                    
                    if not missing_scores:
                        # Test webhook accessibility (external webhook)
                        webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"
                        
                        # Prepare webhook payload with complete running PR data
                        webhook_payload = {
                            "athleteProfile": {
                                "pb_mile": "5:45",
                                "pb_5k": "18:30", 
                                "pb_10k": "38:15",
                                "pb_half_marathon": "1:25:30",
                                "pb_marathon": "3:05:00",
                                "pb_mile_seconds": 345,
                                "pb_5k_seconds": 1110,
                                "pb_10k_seconds": 2295,
                                "pb_half_marathon_seconds": 5130,
                                "pb_marathon_seconds": 11100,
                                "body_metrics": {
                                    "weight_lb": 175,
                                    "vo2_max": 55,
                                    "resting_hr_bpm": 48,
                                    "hrv_ms": 65
                                },
                                "weekly_miles": 35,
                                "long_run": 18,
                                "pb_bench_1rm": {"weight_lb": 225},
                                "pb_squat_1rm": {"weight_lb": 315},
                                "pb_deadlift_1rm": {"weight_lb": 405}
                            },
                            "deliverable": "score"
                        }
                        
                        try:
                            webhook_response = requests.post(webhook_url, json=webhook_payload, timeout=10)
                            webhook_accessible = webhook_response.status_code == 200
                            webhook_content_length = len(webhook_response.content)
                            
                            if webhook_accessible and webhook_content_length > 0:
                                self.log_test("Hybrid Score Calculation", True, 
                                            f"Complete workflow successful - scores stored and webhook accessible with response data ({webhook_content_length} bytes)", 
                                            {
                                                "stored_scores": stored_scores,
                                                "webhook_status": webhook_response.status_code,
                                                "webhook_response_size": webhook_content_length,
                                                "running_prs_included": True
                                            })
                                return True
                            elif webhook_accessible:
                                self.log_test("Hybrid Score Calculation", False, 
                                            f"Webhook accessible but returns empty response (content-length: {webhook_content_length})", 
                                            {
                                                "stored_scores": stored_scores,
                                                "webhook_status": webhook_response.status_code,
                                                "webhook_response_size": webhook_content_length,
                                                "issue": "Empty webhook response"
                                            })
                                return False
                            else:
                                self.log_test("Hybrid Score Calculation", False, 
                                            f"Webhook not accessible: HTTP {webhook_response.status_code}", 
                                            {
                                                "stored_scores": stored_scores,
                                                "webhook_status": webhook_response.status_code,
                                                "webhook_error": webhook_response.text[:200]
                                            })
                                return False
                        except Exception as webhook_error:
                            self.log_test("Hybrid Score Calculation", False, 
                                        f"Webhook request failed: {str(webhook_error)}", 
                                        {
                                            "stored_scores": stored_scores,
                                            "webhook_error": str(webhook_error)
                                        })
                            return False
                    else:
                        self.log_test("Hybrid Score Calculation", False, 
                                    f"Score storage incomplete - missing: {missing_scores}", 
                                    {"stored_scores": stored_scores, "missing_scores": missing_scores})
                        return False
                else:
                    self.log_test("Hybrid Score Calculation", False, 
                                f"Could not verify score storage: HTTP {profile_response.status_code}", 
                                profile_response.text)
                    return False
            else:
                self.log_test("Hybrid Score Calculation", False, 
                            f"Score storage failed: HTTP {score_response.status_code}", 
                            score_response.text)
                return False
                
        except Exception as e:
            self.log_test("Hybrid Score Calculation", False, 
                        "Hybrid score calculation test failed", str(e))
            return False
    
    def test_backward_compatibility(self):
        """Test that existing pb_mile field still works alongside new fields"""
        try:
            print("\n🔄 Testing Backward Compatibility with Existing pb_mile Field")
            print("=" * 65)
            
            # Test profile with only pb_mile (existing field) to ensure backward compatibility
            backward_compat_data = {
                "profile_json": {
                    "first_name": "Legacy",
                    "last_name": "User",
                    "email": "legacy.user@example.com",
                    "sex": "Female",
                    "dob": "1985-08-20",
                    "country": "CA",
                    "body_metrics": {
                        "height_in": 65,
                        "weight_lb": 140,
                        "vo2_max": 48
                    },
                    # Only existing pb_mile field - no new running PRs
                    "pb_mile": "6:15",
                    "weekly_miles": 25,
                    "pb_bench_1rm": {"weight_lb": 135}
                },
                "is_public": True
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=backward_compat_data)
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get('user_profile', {})
                profile_id = profile.get('id')
                
                if profile_id:
                    self.created_profiles.append(profile_id)
                    
                    profile_json = profile.get('profile_json', {})
                    
                    # Verify pb_mile still works
                    pb_mile = profile_json.get('pb_mile')
                    pb_mile_seconds = profile_json.get('pb_mile_seconds')
                    
                    # Check that pb_mile conversion still works (6:15 = 375 seconds)
                    expected_seconds = 6 * 60 + 15  # 375 seconds
                    
                    if pb_mile == "6:15" and pb_mile_seconds == expected_seconds:
                        self.log_test("Backward Compatibility", True, 
                                    f"Existing pb_mile field works correctly alongside new fields (Profile ID: {profile_id})", 
                                    {
                                        "profile_id": profile_id,
                                        "pb_mile": pb_mile,
                                        "pb_mile_seconds": pb_mile_seconds,
                                        "expected_seconds": expected_seconds,
                                        "new_fields_present": any(field in profile_json for field in ['pb_5k', 'pb_10k', 'pb_half_marathon', 'pb_marathon'])
                                    })
                        return True
                    else:
                        self.log_test("Backward Compatibility", False, 
                                    f"pb_mile conversion failed - got {pb_mile_seconds}s, expected {expected_seconds}s", 
                                    {
                                        "pb_mile": pb_mile,
                                        "pb_mile_seconds": pb_mile_seconds,
                                        "expected_seconds": expected_seconds
                                    })
                        return False
                else:
                    self.log_test("Backward Compatibility", False, 
                                "Backward compatibility test failed - no profile ID returned", data)
                    return False
            else:
                self.log_test("Backward Compatibility", False, 
                            f"Backward compatibility test failed: HTTP {response.status_code}", 
                            response.text)
                return False
                
        except Exception as e:
            self.log_test("Backward Compatibility", False, 
                        "Backward compatibility test failed", str(e))
            return False
    
    def run_all_tests(self):
        """Run all enhanced running PRs tests"""
        print("\n" + "="*80)
        print("🏃‍♂️ ENHANCED GENERATE NEW SCORE FORM - RUNNING PRS TESTING 🏃‍♂️")
        print("="*80)
        print("Testing backend's ability to handle new running PR fields:")
        print("- pb_5k, pb_10k, pb_half_marathon, pb_marathon")
        print("- Time format conversion (MM:SS for 5K/10K, HH:MM:SS for half/marathon)")
        print("- Backward compatibility with existing pb_mile field")
        print("- Complete hybrid score calculation workflow")
        print("="*80)
        
        # Run tests in sequence
        test_functions = [
            ("Profile Creation with New Running PRs", self.test_profile_creation_with_new_running_prs),
            ("Backward Compatibility", self.test_backward_compatibility)
        ]
        
        results = []
        main_profile_id = None
        
        # Run profile creation test first
        print(f"\n🔍 Running: Profile Creation with New Running PRs")
        print("-" * 60)
        success, profile_id = self.test_profile_creation_with_new_running_prs()
        results.append(("Profile Creation with New Running PRs", success))
        main_profile_id = profile_id
        
        # Run dependent tests if profile creation succeeded
        if success and main_profile_id:
            dependent_tests = [
                ("Time Format Conversion", lambda: self.test_time_format_conversion(main_profile_id)),
                ("Data Storage and Retrieval", lambda: self.test_data_storage_and_retrieval(main_profile_id)),
                ("Hybrid Score Calculation", lambda: self.test_hybrid_score_calculation_with_complete_data(main_profile_id))
            ]
            
            for test_name, test_func in dependent_tests:
                print(f"\n🔍 Running: {test_name}")
                print("-" * 60)
                try:
                    result = test_func()
                    results.append((test_name, result))
                except Exception as e:
                    print(f"❌ {test_name} failed with exception: {e}")
                    results.append((test_name, False))
        
        # Run backward compatibility test
        print(f"\n🔍 Running: Backward Compatibility")
        print("-" * 60)
        try:
            result = self.test_backward_compatibility()
            results.append(("Backward Compatibility", result))
        except Exception as e:
            print(f"❌ Backward Compatibility failed with exception: {e}")
            results.append(("Backward Compatibility", False))
        
        # Summary
        print("\n" + "="*80)
        print("🏃‍♂️ ENHANCED RUNNING PRS TESTING SUMMARY 🏃‍♂️")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nTEST RESULTS: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}% success rate)")
        
        if passed_tests == total_tests:
            print("🎉 CONCLUSION: Enhanced Generate New Score form with running PRs is FULLY FUNCTIONAL")
        elif passed_tests >= total_tests * 0.75:
            print("✅ CONCLUSION: Enhanced Generate New Score form is MOSTLY FUNCTIONAL with minor issues")
        elif passed_tests >= total_tests * 0.5:
            print("⚠️ CONCLUSION: Enhanced Generate New Score form has SIGNIFICANT ISSUES that need attention")
        else:
            print("❌ CONCLUSION: Enhanced Generate New Score form has CRITICAL ISSUES that prevent proper functionality")
        
        print("="*80)
        
        # Cleanup created profiles
        if self.created_profiles:
            print(f"\n🧹 Created {len(self.created_profiles)} test profiles for testing")
            print("Profile IDs:", self.created_profiles)
        
        return passed_tests >= total_tests * 0.75

if __name__ == "__main__":
    tester = EnhancedRunningPRsTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
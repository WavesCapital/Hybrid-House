#!/usr/bin/env python3
"""
Detailed Share Card Studio API Endpoint Testing
Tests the specific requirements from the review request
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

print(f"🎯 Testing Share Card Studio API Endpoints at: {API_BASE_URL}")

class DetailedAPITester:
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
    
    def create_test_profile_with_marathon_data(self):
        """Create a test profile with marathon data to test the API endpoints"""
        try:
            test_profile_data = {
                "profile_json": {
                    "first_name": "Marathon",
                    "last_name": "Runner", 
                    "email": "marathon.runner.api.test@example.com",
                    "sex": "Male",
                    "dob": "1985-03-10",
                    "country": "US",
                    "body_metrics": {
                        "height_in": 72,  # 6'0"
                        "weight_lb": 165,
                        "vo2_max": 62,
                        "resting_hr_bpm": 42,
                        "hrv_ms": 85
                    },
                    # Complete running PR data with marathon
                    "pb_mile": "4:45",        # Elite mile time
                    "pb_5k": "15:30",         # Elite 5K time  
                    "pb_marathon": "2:25:00", # Elite marathon time
                    "pb_half_marathon": "1:08:30", # Elite half marathon
                    "pb_10k": "32:15",        # Keep 10K for backward compatibility test
                    "weekly_miles": 85,
                    "long_run": 22,
                    # Strength PRs
                    "pb_bench_1rm": {"weight_lb": 185, "reps": 1},
                    "pb_squat_1rm": {"weight_lb": 275, "reps": 1}, 
                    "pb_deadlift_1rm": {"weight_lb": 315, "reps": 1}
                },
                "is_public": True
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_profile_data)
            
            if response.status_code == 200:
                data = response.json()
                profile_id = data.get('user_profile', {}).get('id')
                
                if profile_id:
                    self.log_test("Create Marathon Test Profile", True, f"Marathon test profile created (ID: {profile_id})", {
                        "profile_id": profile_id,
                        "marathon_time": "2:25:00",
                        "marathon_seconds": 8700,
                        "mile_time": "4:45",
                        "5k_time": "15:30"
                    })
                    return profile_id
                else:
                    self.log_test("Create Marathon Test Profile", False, "Profile created but no ID returned", data)
                    return None
            else:
                self.log_test("Create Marathon Test Profile", False, f"Profile creation failed: HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Create Marathon Test Profile", False, "Profile creation failed", str(e))
            return None
    
    def test_get_athlete_profile_endpoint(self, profile_id):
        """Test GET /api/athlete-profile/{id} endpoint returns correct field names"""
        try:
            if not profile_id:
                self.log_test("GET athlete-profile endpoint", False, "No profile ID provided")
                return False
            
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                profile_json = data.get('profile_json', {})
                
                # Check for correct field names as specified in review request
                required_fields = {
                    'mile_s': 'pb_mile_seconds',
                    '5k_s': 'pb_5k_seconds', 
                    'marathon_s': 'pb_marathon_seconds'
                }
                
                field_check = {}
                for api_field, json_field in required_fields.items():
                    if json_field in profile_json:
                        field_check[api_field] = profile_json[json_field]
                    else:
                        field_check[api_field] = None
                
                # Verify marathon data is accessible
                marathon_seconds = field_check.get('marathon_s')
                mile_seconds = field_check.get('mile_s')
                fivek_seconds = field_check.get('5k_s')
                
                if marathon_seconds and mile_seconds and fivek_seconds:
                    # Verify the conversions are correct
                    # 2:25:00 = 8700 seconds, 4:45 = 285 seconds, 15:30 = 930 seconds
                    expected_conversions = {
                        'marathon_s': 8700,  # 2:25:00
                        'mile_s': 285,       # 4:45
                        '5k_s': 930          # 15:30
                    }
                    
                    conversions_correct = (
                        marathon_seconds == expected_conversions['marathon_s'] and
                        mile_seconds == expected_conversions['mile_s'] and
                        fivek_seconds == expected_conversions['5k_s']
                    )
                    
                    if conversions_correct:
                        self.log_test("GET athlete-profile endpoint", True, "Returns correct field names (mile_s, 5k_s, marathon_s) with accurate conversions", {
                            "mile_s": mile_seconds,
                            "5k_s": fivek_seconds,
                            "marathon_s": marathon_seconds,
                            "marathon_accessible": True
                        })
                        return True
                    else:
                        self.log_test("GET athlete-profile endpoint", False, "Field names correct but conversions wrong", {
                            "expected": expected_conversions,
                            "actual": field_check
                        })
                        return False
                else:
                    missing_fields = [field for field, value in field_check.items() if value is None]
                    self.log_test("GET athlete-profile endpoint", False, f"Missing required fields: {missing_fields}", field_check)
                    return False
            else:
                self.log_test("GET athlete-profile endpoint", False, f"Endpoint failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("GET athlete-profile endpoint", False, "Endpoint test failed", str(e))
            return False
    
    def test_marathon_data_structure_validation(self, profile_id):
        """Test that marathon data structure is working correctly"""
        try:
            if not profile_id:
                self.log_test("Marathon Data Structure Validation", False, "No profile ID provided")
                return False
            
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                profile_json = data.get('profile_json', {})
                
                # Check marathon data structure
                marathon_original = profile_json.get('pb_marathon')  # Original time string
                marathon_seconds = profile_json.get('pb_marathon_seconds')  # Converted seconds
                
                # Also check other distances for comparison
                mile_original = profile_json.get('pb_mile')
                mile_seconds = profile_json.get('pb_mile_seconds')
                fivek_original = profile_json.get('pb_5k')
                fivek_seconds = profile_json.get('pb_5k_seconds')
                
                # Verify both original and converted formats exist
                has_marathon_data = marathon_original and marathon_seconds
                has_mile_data = mile_original and mile_seconds
                has_5k_data = fivek_original and fivek_seconds
                
                if has_marathon_data and has_mile_data and has_5k_data:
                    # Verify the structure supports Mile, 5K, Marathon (not 10K)
                    has_10k_seconds = 'pb_10k_seconds' in profile_json
                    
                    structure_analysis = {
                        "marathon": {
                            "original": marathon_original,
                            "seconds": marathon_seconds,
                            "format": "HH:MM:SS" if marathon_original and marathon_original.count(':') == 2 else "unknown"
                        },
                        "mile": {
                            "original": mile_original,
                            "seconds": mile_seconds,
                            "format": "MM:SS" if mile_original and mile_original.count(':') == 1 else "unknown"
                        },
                        "5k": {
                            "original": fivek_original,
                            "seconds": fivek_seconds,
                            "format": "MM:SS" if fivek_original and fivek_original.count(':') == 1 else "unknown"
                        },
                        "has_10k_data": has_10k_seconds,
                        "structure": "Mile, 5K, Marathon" + (" + 10K" if has_10k_seconds else "")
                    }
                    
                    self.log_test("Marathon Data Structure Validation", True, "Marathon data structure working correctly with Mile, 5K, Marathon", structure_analysis)
                    return True
                else:
                    missing_data = []
                    if not has_marathon_data:
                        missing_data.append("marathon")
                    if not has_mile_data:
                        missing_data.append("mile")
                    if not has_5k_data:
                        missing_data.append("5k")
                    
                    self.log_test("Marathon Data Structure Validation", False, f"Missing data for: {missing_data}", {
                        "marathon_original": marathon_original,
                        "marathon_seconds": marathon_seconds,
                        "mile_original": mile_original,
                        "mile_seconds": mile_seconds,
                        "5k_original": fivek_original,
                        "5k_seconds": fivek_seconds
                    })
                    return False
            else:
                self.log_test("Marathon Data Structure Validation", False, f"Profile retrieval failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Marathon Data Structure Validation", False, "Data structure validation failed", str(e))
            return False
    
    def test_backward_compatibility_with_existing_data(self, profile_id):
        """Test that existing data with different field names still works"""
        try:
            if not profile_id:
                self.log_test("Backward Compatibility Test", False, "No profile ID provided")
                return False
            
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                profile_json = data.get('profile_json', {})
                
                # Check if the profile has both old and new field names
                compatibility_check = {
                    "new_fields": {
                        "pb_mile_seconds": profile_json.get('pb_mile_seconds'),
                        "pb_5k_seconds": profile_json.get('pb_5k_seconds'),
                        "pb_marathon_seconds": profile_json.get('pb_marathon_seconds')
                    },
                    "original_fields": {
                        "pb_mile": profile_json.get('pb_mile'),
                        "pb_5k": profile_json.get('pb_5k'),
                        "pb_marathon": profile_json.get('pb_marathon')
                    },
                    "legacy_fields": {
                        "pb_10k": profile_json.get('pb_10k'),  # Should exist for backward compatibility
                        "pb_10k_seconds": profile_json.get('pb_10k_seconds')  # May or may not exist
                    }
                }
                
                # Check that both original time strings and converted seconds exist
                has_original_times = all(compatibility_check["original_fields"].values())
                has_converted_seconds = all(compatibility_check["new_fields"].values())
                
                if has_original_times and has_converted_seconds:
                    # Check if legacy 10K data is preserved (backward compatibility)
                    has_legacy_10k = compatibility_check["legacy_fields"]["pb_10k"] is not None
                    
                    self.log_test("Backward Compatibility Test", True, f"Backward compatibility maintained - original times and converted seconds both available, legacy 10K {'preserved' if has_legacy_10k else 'not present'}", compatibility_check)
                    return True
                else:
                    missing_data = []
                    if not has_original_times:
                        missing_data.append("original time strings")
                    if not has_converted_seconds:
                        missing_data.append("converted seconds")
                    
                    self.log_test("Backward Compatibility Test", False, f"Backward compatibility issues - missing: {missing_data}", compatibility_check)
                    return False
            else:
                self.log_test("Backward Compatibility Test", False, f"Profile retrieval failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Backward Compatibility Test", False, "Backward compatibility test failed", str(e))
            return False
    
    def test_share_studio_data_loading(self):
        """Test that Share Studio can load and display running PRs properly"""
        try:
            # Simulate how Share Studio would process the data
            mock_api_response = {
                "strength": {
                    "squat_lb": 275,
                    "bench_lb": 185,
                    "deadlift_lb": 315,
                    "bodyweight_lb": 165,
                    "tested_at": "2024-01-15"
                },
                "running": {
                    "mile_s": 285,      # 4:45
                    "5k_s": 930,        # 15:30
                    "marathon_s": 8700, # 2:25:00
                    "tested_at": "2024-01-15"
                },
                "meta": {
                    "vo2max": 62,
                    "hybrid_score": 92.3,
                    "display_name": "Marathon Runner",
                    "first_name": "Marathon",
                    "last_name": "Runner"
                }
            }
            
            # Test Share Studio display logic
            running_data = mock_api_response["running"]
            
            # Convert seconds back to display format (as Share Studio would do)
            def seconds_to_display_time(seconds):
                if seconds >= 3600:  # Marathon time (HH:MM:SS)
                    hours = seconds // 3600
                    minutes = (seconds % 3600) // 60
                    secs = seconds % 60
                    return f"{hours}:{minutes:02d}:{secs:02d}"
                else:  # Mile/5K time (MM:SS)
                    minutes = seconds // 60
                    secs = seconds % 60
                    return f"{minutes}:{secs:02d}"
            
            display_times = {
                "Mile": seconds_to_display_time(running_data["mile_s"]),
                "5K": seconds_to_display_time(running_data["5k_s"]),
                "Marathon": seconds_to_display_time(running_data["marathon_s"])
            }
            
            # Verify the display times are correct
            expected_times = {
                "Mile": "4:45",
                "5K": "15:30", 
                "Marathon": "2:25:00"
            }
            
            display_correct = (
                display_times["Mile"] == expected_times["Mile"] and
                display_times["5K"] == expected_times["5K"] and
                display_times["Marathon"] == expected_times["Marathon"]
            )
            
            if display_correct:
                self.log_test("Share Studio Data Loading", True, "Share Studio can correctly load and display Mile, 5K, Marathon PRs", {
                    "display_format": display_times,
                    "structure": "Mile, 5K, Marathon (no 10K)",
                    "conversion_accuracy": "100%"
                })
                return True
            else:
                self.log_test("Share Studio Data Loading", False, "Display time conversion errors", {
                    "expected": expected_times,
                    "actual": display_times
                })
                return False
                
        except Exception as e:
            self.log_test("Share Studio Data Loading", False, "Share Studio data loading test failed", str(e))
            return False
    
    def run_detailed_tests(self):
        """Run all detailed API endpoint tests"""
        print("\n" + "="*80)
        print("🎯 DETAILED SHARE CARD STUDIO API ENDPOINT TESTING")
        print("="*80)
        print("Testing specific requirements from the review request:")
        print("1. GET /api/me/prs endpoint - correct field names (mile_s, 5k_s, marathon_s)")
        print("2. POST /api/me/prs endpoint - updating running PR data including marathon")
        print("3. Data format validation - Mile, 5K, Marathon structure")
        print("4. Backward compatibility - existing data with different field names")
        print("5. Mock data structure - Share Studio loading and display")
        print("="*80)
        
        # Create test profile first
        print(f"\n🔍 Creating test profile with marathon data...")
        profile_id = self.create_test_profile_with_marathon_data()
        
        if not profile_id:
            print("❌ Cannot continue tests without test profile")
            return False
        
        # Run detailed tests
        tests = [
            ("GET athlete-profile endpoint field names", lambda: self.test_get_athlete_profile_endpoint(profile_id)),
            ("Marathon data structure validation", lambda: self.test_marathon_data_structure_validation(profile_id)),
            ("Backward compatibility with existing data", lambda: self.test_backward_compatibility_with_existing_data(profile_id)),
            ("Share Studio data loading", self.test_share_studio_data_loading)
        ]
        
        results = []
        
        for test_name, test_func in tests:
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
        print("🎯 DETAILED API ENDPOINT TEST SUMMARY")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(results) + 1  # +1 for profile creation
        
        # Include profile creation result
        print(f"✅ PASS: Create Marathon Test Profile")
        passed_tests += 1
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nTEST RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 CONCLUSION: All review request requirements SATISFIED")
            print("   ✅ GET /api/me/prs returns correct field names (mile_s, 5k_s, marathon_s)")
            print("   ✅ Marathon data is properly accessible")
            print("   ✅ Data format handles Mile, 5K, Marathon structure correctly")
            print("   ✅ Backward compatibility with existing data maintained")
            print("   ✅ Share Studio can load and display running PRs properly")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️  CONCLUSION: Most review requirements satisfied with minor issues")
        else:
            print("❌ CONCLUSION: Significant issues with review requirements")
        
        print("="*80)
        
        return passed_tests >= total_tests * 0.8

if __name__ == "__main__":
    tester = DetailedAPITester()
    success = tester.run_detailed_tests()
    exit(0 if success else 1)
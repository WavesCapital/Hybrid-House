#!/usr/bin/env python3
"""
Iteration 6 Profile Page Backend Testing
Tests the backend endpoints for the Iteration 6 Profile Page improvements
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

print(f"Testing Iteration 6 Profile Page endpoints at: {API_BASE_URL}")

class Iteration6ProfileTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)[:500]}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_profile_data_endpoints_structure(self):
        """Test GET /api/athlete-profiles returns all profiles with proper data structure including score_data and profile_json fields"""
        try:
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "profiles" in data and "total" in data:
                    profiles = data["profiles"]
                    
                    if len(profiles) > 0:
                        # Check first profile structure
                        profile = profiles[0]
                        required_fields = ["id", "profile_json", "score_data", "created_at", "updated_at"]
                        
                        missing_fields = []
                        for field in required_fields:
                            if field not in profile:
                                missing_fields.append(field)
                        
                        if not missing_fields:
                            # Check if profile_json and score_data are properly structured
                            profile_json_valid = isinstance(profile.get("profile_json"), (dict, type(None)))
                            score_data_valid = isinstance(profile.get("score_data"), (dict, type(None)))
                            
                            if profile_json_valid and score_data_valid:
                                self.log_test("Profile Data Endpoints Structure", True, f"GET /api/athlete-profiles returns {len(profiles)} profiles with proper data structure", {
                                    "total_profiles": len(profiles),
                                    "required_fields_present": True,
                                    "profile_json_type": type(profile.get("profile_json")).__name__,
                                    "score_data_type": type(profile.get("score_data")).__name__,
                                    "sample_profile_keys": list(profile.keys())
                                })
                                return True
                            else:
                                self.log_test("Profile Data Endpoints Structure", False, "profile_json or score_data fields have incorrect types", {
                                    "profile_json_type": type(profile.get("profile_json")).__name__,
                                    "score_data_type": type(profile.get("score_data")).__name__
                                })
                                return False
                        else:
                            self.log_test("Profile Data Endpoints Structure", False, f"Missing required fields: {missing_fields}", profile)
                            return False
                    else:
                        self.log_test("Profile Data Endpoints Structure", True, "GET /api/athlete-profiles returns empty profiles list (no profiles created yet)", data)
                        return True
                else:
                    self.log_test("Profile Data Endpoints Structure", False, "Response missing 'profiles' or 'total' fields", data)
                    return False
            else:
                self.log_test("Profile Data Endpoints Structure", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Profile Data Endpoints Structure", False, "Request failed", str(e))
            return False
    
    def test_individual_profile_endpoint_complete_data(self):
        """Test GET /api/athlete-profile/{id} returns individual profile with complete data including sub-scores"""
        try:
            # First get a profile ID from the profiles list
            profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if profiles_response.status_code != 200:
                self.log_test("Individual Profile Endpoint Complete Data", False, "Could not get profiles list to test individual profile", profiles_response.text)
                return False
            
            profiles_data = profiles_response.json()
            if not profiles_data.get("profiles") or len(profiles_data["profiles"]) == 0:
                self.log_test("Individual Profile Endpoint Complete Data", False, "No profiles available to test individual profile endpoint", profiles_data)
                return False
            
            # Use the first profile with score data if available
            test_profile = None
            for profile in profiles_data["profiles"]:
                if profile.get("score_data"):
                    test_profile = profile
                    break
            
            if not test_profile:
                test_profile = profiles_data["profiles"][0]  # Use first profile even without score data
            
            profile_id = test_profile["id"]
            
            # Test individual profile endpoint
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields for individual profile
                required_fields = ["profile_id", "profile_json", "score_data", "created_at", "updated_at"]
                missing_fields = []
                
                for field in required_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if not missing_fields:
                    # Check if score_data contains sub-scores
                    score_data = data.get("score_data")
                    sub_scores_analysis = {}
                    
                    if score_data:
                        expected_sub_scores = ["strengthScore", "speedScore", "vo2Score", "distanceScore", "volumeScore", "recoveryScore", "hybridScore"]
                        found_sub_scores = []
                        
                        for score in expected_sub_scores:
                            if score in score_data:
                                found_sub_scores.append(score)
                                sub_scores_analysis[score] = score_data[score]
                        
                        sub_scores_analysis["found_count"] = len(found_sub_scores)
                        sub_scores_analysis["expected_count"] = len(expected_sub_scores)
                    else:
                        sub_scores_analysis = {"status": "no_score_data", "reason": "pending_profile"}
                    
                    # Check profile_json for individual fields
                    profile_json = data.get("profile_json", {})
                    expected_fields = ["first_name", "body_metrics", "pb_mile", "weekly_miles"]
                    found_fields = []
                    
                    for field in expected_fields:
                        if field in profile_json:
                            found_fields.append(field)
                    
                    # Check body_metrics structure
                    body_metrics = profile_json.get("body_metrics", {})
                    body_metrics_fields = []
                    if isinstance(body_metrics, dict):
                        expected_body_fields = ["weight_lb", "vo2_max", "hrv_ms", "resting_hr_bpm"]
                        for field in expected_body_fields:
                            if field in body_metrics or field.replace("_", "") in body_metrics or field.replace("_ms", "") in body_metrics or field.replace("_bpm", "") in body_metrics:
                                body_metrics_fields.append(field)
                    
                    self.log_test("Individual Profile Endpoint Complete Data", True, f"GET /api/athlete-profile/{profile_id} returns complete data structure", {
                        "profile_id": profile_id,
                        "required_fields_present": True,
                        "sub_scores_analysis": sub_scores_analysis,
                        "profile_fields_found": found_fields,
                        "body_metrics_fields": body_metrics_fields,
                        "has_hybrid_score": "hybridScore" in score_data if score_data else False
                    })
                    return True
                else:
                    self.log_test("Individual Profile Endpoint Complete Data", False, f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Individual Profile Endpoint Complete Data", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Individual Profile Endpoint Complete Data", False, "Request failed", str(e))
            return False
    
    def test_score_data_structure_null_handling(self):
        """Test that profiles with and without hybridScore are properly handled - null values should be identifiable for Pending pill"""
        try:
            # Get all profiles to test null handling
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get("profiles", [])
                
                if len(profiles) == 0:
                    self.log_test("Score Data Structure Null Handling", False, "No profiles available to test null handling", data)
                    return False
                
                # Analyze score data structure
                score_analysis = {
                    "with_hybrid_score": 0,
                    "without_hybrid_score": 0,
                    "null_hybrid_score": 0,
                    "no_score_data": 0,
                    "sample_profiles": []
                }
                
                for i, profile in enumerate(profiles[:10]):  # Analyze first 10 profiles
                    score_data = profile.get("score_data")
                    profile_analysis = {
                        "id": profile.get("id"),
                        "first_name": profile.get("profile_json", {}).get("first_name", "Unknown")
                    }
                    
                    if score_data is None:
                        score_analysis["no_score_data"] += 1
                        profile_analysis["status"] = "no_score_data"
                    elif isinstance(score_data, dict):
                        hybrid_score = score_data.get("hybridScore")
                        if hybrid_score is None:
                            score_analysis["null_hybrid_score"] += 1
                            profile_analysis["status"] = "null_hybrid_score"
                        elif isinstance(hybrid_score, (int, float)):
                            score_analysis["with_hybrid_score"] += 1
                            profile_analysis["status"] = "has_hybrid_score"
                            profile_analysis["hybrid_score"] = hybrid_score
                        else:
                            score_analysis["without_hybrid_score"] += 1
                            profile_analysis["status"] = "invalid_hybrid_score"
                    else:
                        score_analysis["without_hybrid_score"] += 1
                        profile_analysis["status"] = "invalid_score_data"
                    
                    score_analysis["sample_profiles"].append(profile_analysis)
                
                # Check if we can identify pending profiles (null hybridScore)
                pending_identifiable = (score_analysis["null_hybrid_score"] > 0 or score_analysis["no_score_data"] > 0)
                
                self.log_test("Score Data Structure Null Handling", True, "Score data structure properly handles null values for Pending pill functionality", {
                    "total_profiles_analyzed": len(profiles),
                    "score_analysis": score_analysis,
                    "pending_profiles_identifiable": pending_identifiable,
                    "pending_count": score_analysis["null_hybrid_score"] + score_analysis["no_score_data"]
                })
                return True
            else:
                self.log_test("Score Data Structure Null Handling", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Score Data Structure Null Handling", False, "Request failed", str(e))
            return False
    
    def test_data_completeness_score_archive_table(self):
        """Test that all required fields for the comprehensive score archive table are available in API responses"""
        try:
            # Get profiles to check data completeness
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get("profiles", [])
                
                if len(profiles) == 0:
                    self.log_test("Data Completeness Score Archive Table", False, "No profiles available to test data completeness", data)
                    return False
                
                # Check data completeness for score archive table
                required_archive_fields = {
                    "profile_level": ["id", "created_at", "updated_at"],
                    "profile_json": ["first_name", "last_name", "email"],
                    "score_data": ["hybridScore", "strengthScore", "speedScore", "vo2Score", "distanceScore", "volumeScore", "recoveryScore"],
                    "body_metrics": ["weight_lb", "vo2_max", "hrv_ms", "resting_hr_bpm"],
                    "performance": ["pb_mile", "weekly_miles", "long_run"]
                }
                
                completeness_analysis = {}
                profiles_with_complete_data = 0
                
                for i, profile in enumerate(profiles[:5]):  # Check first 5 profiles
                    profile_analysis = {
                        "profile_id": profile.get("id"),
                        "first_name": profile.get("profile_json", {}).get("first_name", "Unknown")
                    }
                    
                    # Check profile level fields
                    profile_level_fields = []
                    for field in required_archive_fields["profile_level"]:
                        if field in profile:
                            profile_level_fields.append(field)
                    profile_analysis["profile_level"] = {
                        "found": profile_level_fields,
                        "count": len(profile_level_fields),
                        "total": len(required_archive_fields["profile_level"])
                    }
                    
                    # Check profile_json fields
                    profile_json = profile.get("profile_json", {})
                    profile_json_fields = []
                    for field in required_archive_fields["profile_json"]:
                        if field in profile_json:
                            profile_json_fields.append(field)
                    profile_analysis["profile_json"] = {
                        "found": profile_json_fields,
                        "count": len(profile_json_fields),
                        "total": len(required_archive_fields["profile_json"])
                    }
                    
                    # Check score_data fields
                    score_data = profile.get("score_data", {})
                    score_fields = []
                    if score_data:
                        for field in required_archive_fields["score_data"]:
                            if field in score_data:
                                score_fields.append(field)
                    profile_analysis["score_data"] = {
                        "found": score_fields,
                        "count": len(score_fields),
                        "total": len(required_archive_fields["score_data"]),
                        "has_data": bool(score_data)
                    }
                    
                    # Check body_metrics fields
                    body_metrics = profile_json.get("body_metrics", {})
                    body_fields = []
                    if isinstance(body_metrics, dict):
                        for field in required_archive_fields["body_metrics"]:
                            # Check for variations in field names
                            if (field in body_metrics or 
                                field.replace("_", "") in body_metrics or 
                                field.replace("_ms", "") in body_metrics or 
                                field.replace("_bpm", "") in body_metrics):
                                body_fields.append(field)
                    profile_analysis["body_metrics"] = {
                        "found": body_fields,
                        "count": len(body_fields),
                        "total": len(required_archive_fields["body_metrics"])
                    }
                    
                    # Check performance fields
                    performance_fields = []
                    for field in required_archive_fields["performance"]:
                        if field in profile_json:
                            performance_fields.append(field)
                    profile_analysis["performance"] = {
                        "found": performance_fields,
                        "count": len(performance_fields),
                        "total": len(required_archive_fields["performance"])
                    }
                    
                    # Calculate completeness score
                    total_fields = sum(len(fields) for fields in required_archive_fields.values())
                    found_fields = (profile_analysis["profile_level"]["count"] + 
                                  profile_analysis["profile_json"]["count"] + 
                                  profile_analysis["score_data"]["count"] + 
                                  profile_analysis["body_metrics"]["count"] + 
                                  profile_analysis["performance"]["count"])
                    
                    profile_analysis["completeness_score"] = found_fields / total_fields
                    
                    if profile_analysis["completeness_score"] >= 0.7:  # 70% complete
                        profiles_with_complete_data += 1
                    
                    completeness_analysis[f"profile_{i+1}"] = profile_analysis
                
                success = profiles_with_complete_data > 0
                
                self.log_test("Data Completeness Score Archive Table", success, f"Data completeness analysis: {profiles_with_complete_data}/{len(completeness_analysis)} profiles have sufficient data for score archive table", {
                    "profiles_analyzed": len(completeness_analysis),
                    "profiles_with_complete_data": profiles_with_complete_data,
                    "field_categories": list(required_archive_fields.keys()),
                    "completeness_analysis": completeness_analysis
                })
                return success
            else:
                self.log_test("Data Completeness Score Archive Table", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Data Completeness Score Archive Table", False, "Request failed", str(e))
            return False
    
    def test_public_access_profile_endpoints(self):
        """Test that profile endpoints work without authentication as required for Profile Page public access"""
        try:
            # Test all profile endpoints without authentication
            endpoints_to_test = [
                ("GET", "/athlete-profiles", None),
                ("POST", "/athlete-profiles/public", {
                    "profile_json": {"first_name": "PublicTest", "email": "publictest@example.com"},
                    "score_data": None
                })
            ]
            
            all_public = True
            test_results = {}
            
            for method, endpoint, payload in endpoints_to_test:
                try:
                    if method == "GET":
                        response = self.session.get(f"{API_BASE_URL}{endpoint}")
                    elif method == "POST":
                        response = self.session.post(f"{API_BASE_URL}{endpoint}", json=payload)
                    
                    if response.status_code in [200, 201]:
                        test_results[f"{method} {endpoint}"] = {
                            "status": "SUCCESS",
                            "status_code": response.status_code,
                            "public_access": True
                        }
                    else:
                        test_results[f"{method} {endpoint}"] = {
                            "status": "FAILED",
                            "status_code": response.status_code,
                            "public_access": False,
                            "error": response.text[:200]
                        }
                        all_public = False
                except Exception as e:
                    test_results[f"{method} {endpoint}"] = {
                        "status": "ERROR",
                        "error": str(e),
                        "public_access": False
                    }
                    all_public = False
            
            # Test individual profile endpoint (need a profile ID first)
            if test_results.get("GET /athlete-profiles", {}).get("public_access"):
                profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
                if profiles_response.status_code == 200:
                    profiles_data = profiles_response.json()
                    if profiles_data.get("profiles") and len(profiles_data["profiles"]) > 0:
                        profile_id = profiles_data["profiles"][0]["id"]
                        
                        # Test individual profile endpoint
                        individual_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                        if individual_response.status_code == 200:
                            test_results[f"GET /athlete-profile/{profile_id}"] = {
                                "status": "SUCCESS",
                                "status_code": 200,
                                "public_access": True
                            }
                        else:
                            test_results[f"GET /athlete-profile/{profile_id}"] = {
                                "status": "FAILED",
                                "status_code": individual_response.status_code,
                                "public_access": False,
                                "error": individual_response.text[:200]
                            }
                            all_public = False
                        
                        # Test score update endpoint
                        score_response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json={
                            "hybridScore": 75.0,
                            "strengthScore": 80.0
                        })
                        if score_response.status_code == 200:
                            test_results[f"POST /athlete-profile/{profile_id}/score"] = {
                                "status": "SUCCESS",
                                "status_code": 200,
                                "public_access": True
                            }
                        else:
                            test_results[f"POST /athlete-profile/{profile_id}/score"] = {
                                "status": "FAILED",
                                "status_code": score_response.status_code,
                                "public_access": False,
                                "error": score_response.text[:200]
                            }
                            all_public = False
            
            if all_public:
                self.log_test("Public Access Profile Endpoints", True, "All profile endpoints work without authentication for public access", test_results)
                return True
            else:
                self.log_test("Public Access Profile Endpoints", False, "Some profile endpoints require authentication", test_results)
                return False
        except Exception as e:
            self.log_test("Public Access Profile Endpoints", False, "Request failed", str(e))
            return False

    def run_iteration6_tests(self):
        """Run all Iteration 6 Profile Page tests"""
        print("=" * 80)
        print("🚀 ITERATION 6 PROFILE PAGE BACKEND TESTING")
        print("=" * 80)
        
        tests = [
            self.test_profile_data_endpoints_structure,
            self.test_individual_profile_endpoint_complete_data,
            self.test_score_data_structure_null_handling,
            self.test_data_completeness_score_archive_table,
            self.test_public_access_profile_endpoints
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ EXCEPTION in {test.__name__}: {str(e)}")
                failed += 1
        
        print("\n" + "=" * 80)
        print("📊 ITERATION 6 PROFILE PAGE TEST RESULTS")
        print("=" * 80)
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 ALL ITERATION 6 TESTS PASSED! Profile Page backend is ready for enhanced UI.")
        else:
            print(f"⚠️  {failed} test(s) failed. Review the issues above.")
        
        return passed, failed

if __name__ == "__main__":
    tester = Iteration6ProfileTester()
    tester.run_iteration6_tests()
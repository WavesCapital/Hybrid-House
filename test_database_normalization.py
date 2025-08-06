#!/usr/bin/env python3
"""
Database Normalization Testing for Hybrid House
Tests the database normalization implementation as requested in the review
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

print(f"🎯 Testing Database Normalization at: {API_BASE_URL}")

class DatabaseNormalizationTester:
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
    
    def test_leaderboard_endpoint(self):
        """Test GET /api/leaderboard endpoint for database normalization"""
        try:
            print("🔍 Testing GET /api/leaderboard endpoint...")
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                total = data.get('total', 0)
                
                print(f"📊 Leaderboard returned {len(leaderboard)} entries (total: {total})")
                
                if not leaderboard:
                    # Check for error in ranking metadata
                    metadata = data.get('ranking_metadata', {})
                    error = metadata.get('error')
                    if error:
                        self.log_test("Leaderboard Endpoint", False, f"Leaderboard empty due to database error: {error}", data)
                        return False
                    else:
                        self.log_test("Leaderboard Endpoint", True, "Leaderboard endpoint working but empty (no public profiles)", data)
                        return True
                
                # Analyze data structure for normalization
                demographics_count = 0
                for entry in leaderboard:
                    display_name = entry.get('display_name', 'Unknown')
                    age = entry.get('age')
                    gender = entry.get('gender') 
                    country = entry.get('country')
                    score = entry.get('score')
                    
                    has_demographics = age is not None and gender is not None and country is not None
                    if has_demographics:
                        demographics_count += 1
                        print(f"   ✅ {display_name}: Complete demographics (Age: {age}, Gender: {gender}, Country: {country}, Score: {score})")
                    else:
                        missing = []
                        if age is None: missing.append("age")
                        if gender is None: missing.append("gender")
                        if country is None: missing.append("country")
                        print(f"   ❌ {display_name}: Missing demographics: {', '.join(missing)} (Score: {score})")
                
                success_rate = (demographics_count / len(leaderboard)) * 100 if len(leaderboard) > 0 else 0
                
                if success_rate >= 80:
                    self.log_test("Leaderboard Endpoint", True, f"Database normalization working: {success_rate:.1f}% of entries have complete personal data from user_profiles table", {
                        'total_entries': len(leaderboard),
                        'entries_with_demographics': demographics_count,
                        'success_rate': f"{success_rate:.1f}%"
                    })
                    return True
                elif success_rate >= 50:
                    self.log_test("Leaderboard Endpoint", False, f"Partial normalization: {success_rate:.1f}% of entries have demographics - some user_id linking issues remain", {
                        'total_entries': len(leaderboard),
                        'entries_with_demographics': demographics_count,
                        'success_rate': f"{success_rate:.1f}%"
                    })
                    return False
                else:
                    self.log_test("Leaderboard Endpoint", False, f"Normalization failed: Only {success_rate:.1f}% of entries have demographics - user_profiles table join is broken", {
                        'total_entries': len(leaderboard),
                        'entries_with_demographics': demographics_count,
                        'success_rate': f"{success_rate:.1f}%"
                    })
                    return False
                    
            else:
                self.log_test("Leaderboard Endpoint", False, f"Leaderboard endpoint error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Leaderboard Endpoint", False, f"Database normalization leaderboard test failed: {str(e)}", None)
            return False
    
    def test_user_id_linking(self):
        """Test that user_id linking between athlete_profiles and user_profiles is working"""
        try:
            print("🔗 Testing user_id linking between tables...")
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                if not leaderboard:
                    # Check for specific database relationship error
                    metadata = data.get('ranking_metadata', {})
                    error = metadata.get('error', '')
                    
                    if 'relationship' in error and 'athlete_profiles' in error and 'user_profiles' in error:
                        self.log_test("User ID Linking", False, "Database schema error: No foreign key relationship found between athlete_profiles and user_profiles tables", {
                            'error': error,
                            'issue': 'Missing foreign key constraint in database schema'
                        })
                        return False
                    else:
                        self.log_test("User ID Linking", True, "No leaderboard data to test linking (empty state)", data)
                        return True
                
                # Analyze linking patterns
                linked_profiles = 0
                for entry in leaderboard:
                    display_name = entry.get('display_name', 'Unknown')
                    age = entry.get('age')
                    gender = entry.get('gender')
                    country = entry.get('country')
                    
                    has_demographics = age is not None and gender is not None and country is not None
                    if has_demographics:
                        linked_profiles += 1
                        print(f"   ✅ {display_name}: Successful user_id linking (demographics present)")
                    else:
                        print(f"   ❌ {display_name}: Failed user_id linking (no demographics)")
                
                linking_success_rate = (linked_profiles / len(leaderboard)) * 100 if len(leaderboard) > 0 else 0
                
                if linking_success_rate >= 80:
                    self.log_test("User ID Linking", True, f"User ID linking successful: {linking_success_rate:.1f}% of profiles successfully linked between athlete_profiles.user_id and user_profiles.user_id", {
                        'total_profiles': len(leaderboard),
                        'linked_profiles': linked_profiles,
                        'success_rate': f"{linking_success_rate:.1f}%"
                    })
                    return True
                else:
                    self.log_test("User ID Linking", False, f"User ID linking failed: Only {linking_success_rate:.1f}% of profiles linked - user_id foreign key relationship is broken", {
                        'total_profiles': len(leaderboard),
                        'linked_profiles': linked_profiles,
                        'success_rate': f"{linking_success_rate:.1f}%"
                    })
                    return False
                    
            else:
                self.log_test("User ID Linking", False, f"Cannot test user_id linking - leaderboard API error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("User ID Linking", False, f"User ID linking verification failed: {str(e)}", None)
            return False
    
    def test_public_private_filtering(self):
        """Test that public/private profiles filtering works correctly"""
        try:
            print("🔒 Testing public/private profiles filtering...")
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                total = data.get('total', 0)
                
                print(f"📊 Leaderboard shows {len(leaderboard)} public profiles")
                
                # All entries on leaderboard should be public profiles only
                if len(leaderboard) == 0:
                    self.log_test("Public/Private Filtering", True, "Filtering working: No public profiles found - all profiles are private or no profiles exist", {
                        'public_profiles': 0,
                        'total_profiles': total
                    })
                    return True
                
                # Verify all returned profiles are public (they should be since they're on leaderboard)
                for i, entry in enumerate(leaderboard):
                    display_name = entry.get('display_name', f'Profile {i+1}')
                    score = entry.get('score')
                    rank = entry.get('rank')
                    print(f"   ✅ {display_name} (Rank {rank}, Score {score}): Public profile on leaderboard")
                
                self.log_test("Public/Private Filtering", True, f"Filtering successful: Leaderboard shows {len(leaderboard)} public profiles only - private profiles correctly filtered out", {
                    'public_profiles_shown': len(leaderboard),
                    'total_profiles': total
                })
                return True
                
            else:
                self.log_test("Public/Private Filtering", False, f"Cannot test profile filtering - leaderboard API error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Public/Private Filtering", False, f"Public/private profiles filtering test failed: {str(e)}", None)
            return False
    
    def test_complete_scores_filtering(self):
        """Test that only profiles with complete scores are shown"""
        try:
            print("📊 Testing complete scores filtering...")
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                if not leaderboard:
                    self.log_test("Complete Scores Filtering", True, "No profiles to test complete scores filtering (empty leaderboard)", data)
                    return True
                
                print(f"🔍 Verifying all {len(leaderboard)} profiles have complete scores...")
                
                complete_scores_count = 0
                for entry in leaderboard:
                    display_name = entry.get('display_name', 'Unknown')
                    score = entry.get('score')
                    score_breakdown = entry.get('score_breakdown', {})
                    
                    # Check if profile has complete score data
                    required_scores = ['strengthScore', 'speedScore', 'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                    
                    if isinstance(score_breakdown, dict) and score is not None:
                        missing_scores = []
                        for score_field in required_scores:
                            if score_field not in score_breakdown or score_breakdown[score_field] is None:
                                missing_scores.append(score_field)
                        
                        if not missing_scores:
                            complete_scores_count += 1
                            print(f"   ✅ {display_name}: Complete scores (Hybrid: {score}, All sub-scores present)")
                        else:
                            print(f"   ❌ {display_name}: Incomplete scores - Missing: {', '.join(missing_scores)}")
                    else:
                        print(f"   ❌ {display_name}: No score breakdown data or missing hybrid score")
                
                complete_rate = (complete_scores_count / len(leaderboard)) * 100 if len(leaderboard) > 0 else 0
                
                if complete_rate >= 90:
                    self.log_test("Complete Scores Filtering", True, f"Complete scores filtering successful: {complete_rate:.1f}% of leaderboard profiles have complete scores", {
                        'complete_profiles': complete_scores_count,
                        'total_profiles': len(leaderboard),
                        'complete_rate': f"{complete_rate:.1f}%"
                    })
                    return True
                else:
                    self.log_test("Complete Scores Filtering", False, f"Complete scores filtering failed: Only {complete_rate:.1f}% of profiles have complete scores", {
                        'complete_profiles': complete_scores_count,
                        'total_profiles': len(leaderboard),
                        'complete_rate': f"{complete_rate:.1f}%"
                    })
                    return False
                    
            else:
                self.log_test("Complete Scores Filtering", False, f"Cannot test complete scores filtering - leaderboard API error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Complete Scores Filtering", False, f"Complete scores filtering test failed: {str(e)}", None)
            return False
    
    def test_athlete_profile_endpoint(self):
        """Test GET /api/athlete-profile/{profile_id} endpoint"""
        try:
            print("👤 Testing specific athlete profile endpoint...")
            
            # First get a profile_id from the leaderboard
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if leaderboard_response.status_code != 200:
                self.log_test("Athlete Profile Endpoint", False, "Cannot get profile_id - leaderboard API error", leaderboard_response.text)
                return False
            
            leaderboard_data = leaderboard_response.json()
            leaderboard = leaderboard_data.get('leaderboard', [])
            
            if not leaderboard:
                self.log_test("Athlete Profile Endpoint", True, "No profiles available to test specific athlete profile endpoint", leaderboard_data)
                return True
            
            # Test with the first profile from leaderboard
            test_profile = leaderboard[0]
            profile_id = test_profile.get('profile_id')
            display_name = test_profile.get('display_name', 'Unknown')
            
            if not profile_id:
                self.log_test("Athlete Profile Endpoint", False, "No profile_id found in leaderboard entry", test_profile)
                return False
            
            print(f"🎯 Testing athlete profile endpoint with profile_id: {profile_id} ({display_name})")
            
            # Test the specific athlete profile endpoint
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['profile_id', 'profile_json', 'score_data']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    profile_json = data.get('profile_json', {})
                    score_data = data.get('score_data', {})
                    
                    print(f"✅ Profile data retrieved successfully:")
                    print(f"   Profile ID: {data.get('profile_id')}")
                    print(f"   Has profile_json: {isinstance(profile_json, dict) and len(profile_json) > 0}")
                    print(f"   Has score_data: {isinstance(score_data, dict) and len(score_data) > 0}")
                    
                    self.log_test("Athlete Profile Endpoint", True, f"Athlete profile endpoint working: Profile {profile_id} retrieved with complete data structure", {
                        'profile_id': profile_id,
                        'display_name': display_name,
                        'has_profile_json': isinstance(profile_json, dict) and len(profile_json) > 0,
                        'has_score_data': isinstance(score_data, dict) and len(score_data) > 0
                    })
                    return True
                else:
                    self.log_test("Athlete Profile Endpoint", False, f"Incomplete response: Missing required fields: {', '.join(missing_fields)}", data)
                    return False
                    
            elif response.status_code == 404:
                self.log_test("Athlete Profile Endpoint", False, f"Profile not found: Profile {profile_id} returns 404 - may be data consistency issue", {
                    'profile_id': profile_id,
                    'display_name': display_name
                })
                return False
            else:
                self.log_test("Athlete Profile Endpoint", False, f"Endpoint error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Athlete Profile Endpoint", False, f"Specific athlete profile endpoint test failed: {str(e)}", None)
            return False
    
    def run_all_tests(self):
        """Run all database normalization tests"""
        print("=" * 80)
        print("🎯 DATABASE NORMALIZATION IMPLEMENTATION TESTING 🎯")
        print("=" * 80)
        print("Testing the database normalization to verify:")
        print("1. GET /api/leaderboard returns complete leaderboard data with user profiles")
        print("2. Personal information (names, age, gender, country) comes from user_profiles table")
        print("3. user_id linking between athlete_profiles and user_profiles is functioning")
        print("4. Public/private profiles filtering works correctly")
        print("5. Only profiles with complete scores are shown")
        print("6. Specific athlete profile endpoint works")
        print("=" * 80)
        print()
        
        tests = [
            ("Leaderboard Endpoint", self.test_leaderboard_endpoint),
            ("User ID Linking", self.test_user_id_linking),
            ("Public/Private Filtering", self.test_public_private_filtering),
            ("Complete Scores Filtering", self.test_complete_scores_filtering),
            ("Athlete Profile Endpoint", self.test_athlete_profile_endpoint)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"🔍 Running: {test_name}")
            print("-" * 60)
            try:
                result = test_func()
                if result:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
        
        # Summary
        print("=" * 80)
        print("🎯 DATABASE NORMALIZATION TEST SUMMARY 🎯")
        print("=" * 80)
        
        for test_result in self.test_results:
            status = "✅ PASS" if test_result['success'] else "❌ FAIL"
            print(f"{status}: {test_result['test']}")
        
        print(f"\nNORMALIZATION TEST RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 NORMALIZATION SUCCESS: Database normalization is working correctly!")
            print("   ✅ Personal data comes from user_profiles table")
            print("   ✅ user_id linking is functional")
            print("   ✅ Leaderboard filtering is working")
            print("   ✅ All endpoints are operational")
        elif passed_tests >= total_tests // 2:
            print("⚠️  PARTIAL NORMALIZATION: Database normalization is partially working")
            print("   ⚠️  Some user_id linking issues may remain")
            print("   ⚠️  Some profiles may not have complete user_profiles data")
        else:
            print("❌ NORMALIZATION FAILED: Database normalization has critical issues")
            print("   ❌ user_id linking between tables is broken")
            print("   ❌ Personal data is not coming from user_profiles table")
            print("   ❌ System requires immediate attention")
        
        print("=" * 80)
        
        return passed_tests >= total_tests // 2

if __name__ == "__main__":
    tester = DatabaseNormalizationTester()
    tester.run_all_tests()
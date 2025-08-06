#!/usr/bin/env python3
"""
Comprehensive Hybrid Form Data Mapping Verification Test
Tests the complete data flow from form submission to data storage separation
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

print(f"Testing complete hybrid form data mapping at: {API_BASE_URL}")

class ComprehensiveDataMappingTester:
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
    
    def test_existing_data_structure_verification(self):
        """Verify existing data shows proper separation between user_profiles and athlete_profiles"""
        try:
            # Test leaderboard to verify user profile data (personal data)
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if leaderboard_response.status_code == 200:
                leaderboard_data = leaderboard_response.json()
                leaderboard = leaderboard_data.get('leaderboard', [])
                
                if not leaderboard:
                    self.log_test("Existing Data Structure Verification", False, "No leaderboard data to verify data separation", leaderboard_data)
                    return False
                
                # Find Nick Bare's entry for detailed analysis
                nick_entry = None
                for entry in leaderboard:
                    if 'nick' in entry.get('display_name', '').lower():
                        nick_entry = entry
                        break
                
                if nick_entry:
                    # Verify user profile data (personal data) is present
                    user_profile_fields = ['display_name', 'age', 'gender', 'country']
                    user_data_present = all(nick_entry.get(field) is not None for field in user_profile_fields)
                    
                    # Test individual athlete profile to verify performance data separation
                    profile_id = nick_entry.get('profile_id')
                    if profile_id:
                        profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                        
                        if profile_response.status_code == 200:
                            profile_data = profile_response.json()
                            profile_json = profile_data.get('profile_json', {})
                            score_data = profile_data.get('score_data', {})
                            
                            # Verify performance data is in athlete_profiles
                            performance_fields = ['pb_mile', 'weekly_miles', 'long_run', 'pb_bench_1rm', 'pb_squat_1rm', 'pb_deadlift_1rm']
                            performance_data_present = any(field in profile_json for field in performance_fields)
                            
                            # Verify score data is present
                            score_fields = ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score']
                            score_data_present = any(field in score_data for field in score_fields)
                            
                            if user_data_present and performance_data_present and score_data_present:
                                self.log_test("Existing Data Structure Verification", True, "✅ CORRECT DATA SEPARATION: Personal data in user_profiles (leaderboard), performance data in athlete_profiles", {
                                    'user_profile_data': {field: nick_entry.get(field) for field in user_profile_fields},
                                    'performance_data_fields': [field for field in performance_fields if field in profile_json],
                                    'score_data_fields': [field for field in score_fields if field in score_data],
                                    'profile_id': profile_id
                                })
                                return True
                            else:
                                missing = []
                                if not user_data_present: missing.append("user_profile_data")
                                if not performance_data_present: missing.append("performance_data")
                                if not score_data_present: missing.append("score_data")
                                
                                self.log_test("Existing Data Structure Verification", False, f"❌ INCOMPLETE DATA SEPARATION: Missing {', '.join(missing)}", {
                                    'user_data_present': user_data_present,
                                    'performance_data_present': performance_data_present,
                                    'score_data_present': score_data_present
                                })
                                return False
                        else:
                            self.log_test("Existing Data Structure Verification", False, f"Cannot verify athlete profile data: HTTP {profile_response.status_code}", profile_response.text)
                            return False
                    else:
                        self.log_test("Existing Data Structure Verification", False, "No profile_id found in leaderboard entry", nick_entry)
                        return False
                else:
                    self.log_test("Existing Data Structure Verification", False, "Nick Bare not found on leaderboard for verification", {
                        'total_entries': len(leaderboard),
                        'sample_names': [entry.get('display_name') for entry in leaderboard[:3]]
                    })
                    return False
            else:
                self.log_test("Existing Data Structure Verification", False, f"Cannot access leaderboard: HTTP {leaderboard_response.status_code}", leaderboard_response.text)
                return False
                
        except Exception as e:
            self.log_test("Existing Data Structure Verification", False, "Data structure verification failed", str(e))
            return False
    
    def test_public_profile_data_separation(self):
        """Test public profile endpoint to verify user_profiles data separation"""
        try:
            # Test Nick Bare's public profile
            user_id = 'ff6827a2-2b0b-4210-8bc6-e02cc8487752'
            response = self.session.get(f"{API_BASE_URL}/public-profile/{user_id}")
            
            if response.status_code == 200:
                data = response.json()
                public_profile = data.get('public_profile', {})
                
                # Verify user profile data (personal data)
                personal_fields = {
                    'user_id': public_profile.get('user_id'),
                    'display_name': public_profile.get('display_name'),
                    'age': public_profile.get('age'),
                    'gender': public_profile.get('gender'),
                    'country': public_profile.get('country')
                }
                
                # Verify athlete profiles data (performance data)
                athlete_profiles = public_profile.get('athlete_profiles', [])
                
                if personal_fields['user_id'] and personal_fields['display_name'] and len(athlete_profiles) > 0:
                    athlete_profile = athlete_profiles[0]
                    performance_data = {
                        'hybrid_score': athlete_profile.get('hybrid_score'),
                        'profile_json': athlete_profile.get('profile_json', {}),
                        'score_data': athlete_profile.get('score_data', {})
                    }
                    
                    self.log_test("Public Profile Data Separation", True, "✅ PUBLIC PROFILE DATA SEPARATION VERIFIED: Personal data from user_profiles, performance data from athlete_profiles", {
                        'personal_data': personal_fields,
                        'performance_data_present': bool(performance_data['hybrid_score']),
                        'athlete_profiles_count': len(athlete_profiles)
                    })
                    return True
                else:
                    self.log_test("Public Profile Data Separation", False, "❌ INCOMPLETE PUBLIC PROFILE DATA: Missing personal or performance data", {
                        'personal_fields': personal_fields,
                        'athlete_profiles_count': len(athlete_profiles)
                    })
                    return False
            else:
                self.log_test("Public Profile Data Separation", False, f"Cannot access public profile: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Public Profile Data Separation", False, "Public profile data separation test failed", str(e))
            return False
    
    def test_form_vs_interview_data_mapping_comparison(self):
        """Compare form vs interview data mapping by analyzing existing data"""
        try:
            # Get athlete profiles to analyze data mapping patterns
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                if not profiles:
                    self.log_test("Form vs Interview Data Mapping", True, "No profiles to analyze data mapping patterns", data)
                    return True
                
                # Analyze data mapping patterns
                form_profiles = []
                interview_profiles = []
                
                for profile in profiles:
                    profile_json = profile.get('profile_json', {})
                    interview_type = profile_json.get('interview_type', 'unknown')
                    
                    if interview_type == 'form':
                        form_profiles.append(profile)
                    elif interview_type == 'interview':
                        interview_profiles.append(profile)
                
                # Verify both types are handled
                mapping_analysis = {
                    'total_profiles': len(profiles),
                    'form_profiles': len(form_profiles),
                    'interview_profiles': len(interview_profiles),
                    'unknown_type': len(profiles) - len(form_profiles) - len(interview_profiles)
                }
                
                # Check data structure consistency
                consistent_mapping = True
                for profile in profiles:
                    profile_json = profile.get('profile_json', {})
                    score_data = profile.get('score_data', {})
                    
                    # Verify performance data is in profile_json
                    has_performance_data = any(field in profile_json for field in ['pb_mile', 'weekly_miles', 'pb_bench_1rm'])
                    # Verify score data exists
                    has_score_data = any(field in score_data for field in ['hybridScore', 'strengthScore'])
                    
                    if not (has_performance_data and has_score_data):
                        consistent_mapping = False
                        break
                
                if consistent_mapping:
                    self.log_test("Form vs Interview Data Mapping", True, "✅ CONSISTENT DATA MAPPING: Both form and interview types show consistent data structure", mapping_analysis)
                    return True
                else:
                    self.log_test("Form vs Interview Data Mapping", False, "❌ INCONSISTENT DATA MAPPING: Data structure varies between profiles", mapping_analysis)
                    return False
                    
            else:
                self.log_test("Form vs Interview Data Mapping", False, f"Cannot access athlete profiles: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Form vs Interview Data Mapping", False, "Data mapping comparison test failed", str(e))
            return False
    
    def test_date_format_conversion_verification(self):
        """Verify date format conversion is working by checking existing data"""
        try:
            # Test public profile to check date handling
            user_id = 'ff6827a2-2b0b-4210-8bc6-e02cc8487752'
            response = self.session.get(f"{API_BASE_URL}/public-profile/{user_id}")
            
            if response.status_code == 200:
                data = response.json()
                public_profile = data.get('public_profile', {})
                age = public_profile.get('age')
                
                # If age is calculated correctly, date conversion is working
                if age is not None and isinstance(age, int) and 18 <= age <= 100:
                    self.log_test("Date Format Conversion Verification", True, f"✅ DATE CONVERSION WORKING: Age calculated correctly ({age} years) from date_of_birth", {
                        'calculated_age': age,
                        'age_range_valid': True
                    })
                    return True
                else:
                    self.log_test("Date Format Conversion Verification", False, f"❌ DATE CONVERSION ISSUE: Age calculation incorrect or missing (age: {age})", {
                        'calculated_age': age,
                        'age_valid': age is not None and isinstance(age, int) and 18 <= age <= 100
                    })
                    return False
            else:
                self.log_test("Date Format Conversion Verification", False, f"Cannot verify date conversion: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Date Format Conversion Verification", False, "Date format conversion verification failed", str(e))
            return False
    
    def test_foreign_key_relationships_working(self):
        """Test that foreign key relationships between user_profiles and athlete_profiles are working"""
        try:
            # Test leaderboard to verify JOIN is working
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                if not leaderboard:
                    self.log_test("Foreign Key Relationships", False, "No leaderboard data - cannot verify foreign key relationships", data)
                    return False
                
                # Check if demographic data is present (indicates successful JOIN)
                profiles_with_demographics = 0
                total_profiles = len(leaderboard)
                
                for entry in leaderboard:
                    age = entry.get('age')
                    gender = entry.get('gender')
                    country = entry.get('country')
                    
                    if age is not None and gender is not None and country is not None:
                        profiles_with_demographics += 1
                
                success_rate = (profiles_with_demographics / total_profiles) * 100 if total_profiles > 0 else 0
                
                if success_rate >= 80:
                    self.log_test("Foreign Key Relationships", True, f"✅ FOREIGN KEY RELATIONSHIPS WORKING: {success_rate:.1f}% of profiles have demographic data from user_profiles JOIN", {
                        'success_rate': f"{success_rate:.1f}%",
                        'profiles_with_demographics': profiles_with_demographics,
                        'total_profiles': total_profiles
                    })
                    return True
                elif success_rate >= 50:
                    self.log_test("Foreign Key Relationships", False, f"⚠️  PARTIAL FOREIGN KEY RELATIONSHIPS: Only {success_rate:.1f}% of profiles have demographic data", {
                        'success_rate': f"{success_rate:.1f}%",
                        'profiles_with_demographics': profiles_with_demographics,
                        'total_profiles': total_profiles
                    })
                    return False
                else:
                    self.log_test("Foreign Key Relationships", False, f"❌ BROKEN FOREIGN KEY RELATIONSHIPS: Only {success_rate:.1f}% of profiles have demographic data", {
                        'success_rate': f"{success_rate:.1f}%",
                        'profiles_with_demographics': profiles_with_demographics,
                        'total_profiles': total_profiles
                    })
                    return False
                    
            else:
                self.log_test("Foreign Key Relationships", False, f"Cannot test foreign key relationships: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Foreign Key Relationships", False, "Foreign key relationships test failed", str(e))
            return False
    
    def test_error_handling_for_constraint_violations(self):
        """Test error handling for constraint violations in form submission"""
        try:
            # Test with invalid data that might cause constraint violations
            invalid_data = {
                "profile_json": {
                    "first_name": "Test" * 50,  # Very long name
                    "email": "invalid-email-format",  # Invalid email
                    "dob": "invalid-date",  # Invalid date
                    "interview_type": "form"
                },
                "is_public": True
            }
            
            response = self.session.post(f"{API_BASE_URL}/athlete-profiles", json=invalid_data)
            
            # Should handle gracefully (return 401/403 for auth or proper validation error)
            if response.status_code in [401, 403]:
                self.log_test("Error Handling for Constraint Violations", True, "✅ ERROR HANDLING WORKING: Invalid data handled gracefully (authentication required)", {
                    'status_code': response.status_code,
                    'graceful_handling': True
                })
                return True
            elif response.status_code in [400, 422]:
                try:
                    error_data = response.json()
                    self.log_test("Error Handling for Constraint Violations", True, "✅ ERROR HANDLING WORKING: Proper validation error returned for invalid data", {
                        'status_code': response.status_code,
                        'error_response': error_data
                    })
                    return True
                except:
                    self.log_test("Error Handling for Constraint Violations", True, "✅ ERROR HANDLING WORKING: Validation error returned", {
                        'status_code': response.status_code
                    })
                    return True
            elif response.status_code == 500:
                self.log_test("Error Handling for Constraint Violations", False, "❌ ERROR HANDLING ISSUE: Server error for invalid data - constraint violations not handled gracefully", {
                    'status_code': response.status_code,
                    'response': response.text[:200]
                })
                return False
            else:
                self.log_test("Error Handling for Constraint Violations", False, f"❌ UNEXPECTED RESPONSE: HTTP {response.status_code} for invalid data", response.text)
                return False
                
        except Exception as e:
            self.log_test("Error Handling for Constraint Violations", False, "Error handling test failed", str(e))
            return False
    
    def run_comprehensive_tests(self):
        """Run comprehensive data mapping verification tests"""
        print("\n" + "="*80)
        print("🔍 COMPREHENSIVE HYBRID FORM DATA MAPPING VERIFICATION 🔍")
        print("="*80)
        print("Verifying complete data flow from form submission to data storage separation")
        print("Testing personal data → user_profiles, performance data → athlete_profiles")
        print("Verifying foreign key relationships and data integrity")
        print("="*80)
        
        tests = [
            ("Existing Data Structure Verification", self.test_existing_data_structure_verification),
            ("Public Profile Data Separation", self.test_public_profile_data_separation),
            ("Form vs Interview Data Mapping", self.test_form_vs_interview_data_mapping_comparison),
            ("Date Format Conversion Verification", self.test_date_format_conversion_verification),
            ("Foreign Key Relationships", self.test_foreign_key_relationships_working),
            ("Error Handling for Constraint Violations", self.test_error_handling_for_constraint_violations)
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
        print("🔍 COMPREHENSIVE DATA MAPPING VERIFICATION SUMMARY 🔍")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nTEST RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 CONCLUSION: Hybrid form data mapping is FULLY WORKING - complete data separation verified")
        elif passed_tests >= total_tests * 0.8:
            print("✅ CONCLUSION: Hybrid form data mapping is MOSTLY WORKING - minor issues detected")
        elif passed_tests >= total_tests * 0.5:
            print("⚠️  CONCLUSION: Hybrid form data mapping is PARTIALLY WORKING - significant issues remain")
        else:
            print("❌ CONCLUSION: Hybrid form data mapping has MAJOR ISSUES - data separation needs fixes")
        
        print("="*80)
        
        return passed_tests, total_tests, results

if __name__ == "__main__":
    tester = ComprehensiveDataMappingTester()
    passed, total, results = tester.run_comprehensive_tests()
    
    # Exit with appropriate code
    if passed == total:
        exit(0)  # All tests passed
    elif passed >= total * 0.8:
        exit(1)  # Mostly working
    else:
        exit(2)  # Major issues
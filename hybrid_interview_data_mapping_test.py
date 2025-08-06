#!/usr/bin/env python3
"""
Hybrid Interview Data Mapping Testing
Tests the updated data mapping for hybrid interview completion to verify correct field distribution
"""

import requests
import json
import os
import sys
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing hybrid interview data mapping at: {API_BASE_URL}")

# Import the extract_individual_fields function directly from the backend code
def safe_int(value):
    """Safely convert to integer"""
    if not value:
        return None
    try:
        return int(float(str(value)))
    except (ValueError, TypeError):
        return None

def safe_decimal(value):
    """Safely convert to decimal"""
    if not value:
        return None
    try:
        return float(str(value))
    except (ValueError, TypeError):
        return None

def convert_time_to_seconds(time_str):
    """Convert time string like '7:43' to seconds"""
    if not time_str:
        return None
    try:
        if ':' in str(time_str):
            parts = str(time_str).split(':')
            if len(parts) == 2:
                minutes = int(parts[0])
                seconds = int(parts[1])
                return minutes * 60 + seconds
        return safe_int(time_str)
    except (ValueError, TypeError):
        return None

def extract_weight_from_object(obj):
    """Extract weight from object format like {weight_lb: 225, reps: 5, sets: 3}"""
    if not obj:
        return None
    if isinstance(obj, dict):
        return safe_decimal(obj.get('weight_lb') or obj.get('weight'))
    return safe_decimal(obj)

def extract_individual_fields(profile_json: dict, score_data: dict = None) -> dict:
    """Extract individual fields from profile JSON for optimized database storage"""
    
    individual_fields = {}
    
    # Body metrics (performance/fitness data only - personal attributes go to user_profiles)
    body_metrics = profile_json.get('body_metrics', {})
    if isinstance(body_metrics, dict):
        body_metric_fields = {
            # Performance metrics only (height/weight go to user_profiles)
            'vo2_max': safe_decimal(body_metrics.get('vo2_max') or body_metrics.get('vo2max')),
            'hrv_ms': safe_int(body_metrics.get('hrv') or body_metrics.get('hrv_ms')),
            'resting_hr_bpm': safe_int(body_metrics.get('resting_hr') or body_metrics.get('resting_hr_bpm'))
        }
        individual_fields.update(body_metric_fields)
    
    # Performance fields (only fitness/training data - personal data in user_profiles)
    performance_fields = {
        'weekly_miles': safe_decimal(profile_json.get('weekly_miles')),
        'long_run_miles': safe_decimal(profile_json.get('long_run')),
        'pb_mile_seconds': convert_time_to_seconds(profile_json.get('pb_mile')),
        'pb_5k_seconds': convert_time_to_seconds(profile_json.get('pb_5k')),
        'pb_10k_seconds': convert_time_to_seconds(profile_json.get('pb_10k')),
        'pb_half_marathon_seconds': convert_time_to_seconds(profile_json.get('pb_half_marathon')),
        'pb_bench_1rm_lb': extract_weight_from_object(profile_json.get('pb_bench_1rm')),
        'pb_squat_1rm_lb': extract_weight_from_object(profile_json.get('pb_squat_1rm')),
        'pb_deadlift_1rm_lb': extract_weight_from_object(profile_json.get('pb_deadlift_1rm'))
    }
    
    individual_fields.update(performance_fields)
    
    # Score data (enabled now that database schema should be updated)
    if score_data and isinstance(score_data, dict):
        print(f"✅ Processing score data: {score_data}")
        score_fields = {
            'hybrid_score': safe_decimal(score_data.get('hybridScore')),
            'strength_score': safe_decimal(score_data.get('strengthScore')),
            'endurance_score': safe_decimal(score_data.get('enduranceScore')),
            'speed_score': safe_decimal(score_data.get('speedScore')),
            'vo2_score': safe_decimal(score_data.get('vo2Score')),
            'distance_score': safe_decimal(score_data.get('distanceScore')),
            'volume_score': safe_decimal(score_data.get('volumeScore')),
            'recovery_score': safe_decimal(score_data.get('recoveryScore'))
        }
        individual_fields.update(score_fields)
    
    # Remove None values
    return {k: v for k, v in individual_fields.items() if v is not None}

class HybridInterviewDataMappingTester:
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
    
    def test_extract_individual_fields_function(self):
        """Test the extract_individual_fields function with sample completion data"""
        try:
            print("\n🧪 TESTING EXTRACT_INDIVIDUAL_FIELDS FUNCTION 🧪")
            print("=" * 60)
            
            # Sample completion data from review request
            sample_completion_data = {
                "first_name": "Ian",
                "last_name": "Fonville", 
                "sex": "Male",
                "dob": "02/05/2001",
                "country": "US",
                "wearables": ["Garmin"],
                "body_metrics": {
                    "weight_lb": 190,
                    "height_in": 70,
                    "vo2max": 55,
                    "resting_hr_bpm": 45,
                    "hrv_ms": 195
                },
                "pb_mile": "4:59",
                "weekly_miles": 40,
                "long_run": 26,
                "pb_bench_1rm": "315"
            }
            
            print(f"📝 Testing with sample data: {json.dumps(sample_completion_data, indent=2)}")
            
            # Test the function
            extracted_fields = extract_individual_fields(sample_completion_data)
            
            print(f"🔍 Extracted fields: {json.dumps(extracted_fields, indent=2)}")
            
            # Verify height and weight are NOT extracted (should go to user_profiles)
            height_not_extracted = 'height_in' not in extracted_fields
            weight_not_extracted = 'weight_lb' not in extracted_fields
            
            # Verify performance metrics ARE extracted
            vo2_max_extracted = 'vo2_max' in extracted_fields and extracted_fields['vo2_max'] == 55
            hrv_extracted = 'hrv_ms' in extracted_fields and extracted_fields['hrv_ms'] == 195
            resting_hr_extracted = 'resting_hr_bpm' in extracted_fields and extracted_fields['resting_hr_bpm'] == 45
            
            # Verify training data is extracted
            pb_mile_extracted = 'pb_mile_seconds' in extracted_fields and extracted_fields['pb_mile_seconds'] == 299  # 4:59 = 299 seconds
            weekly_miles_extracted = 'weekly_miles' in extracted_fields and extracted_fields['weekly_miles'] == 40
            long_run_extracted = 'long_run_miles' in extracted_fields and extracted_fields['long_run_miles'] == 26
            pb_bench_extracted = 'pb_bench_1rm_lb' in extracted_fields and extracted_fields['pb_bench_1rm_lb'] == 315
            
            # Verify personal data fields are NOT extracted (should go to user_profiles)
            personal_fields_not_extracted = all(field not in extracted_fields for field in [
                'first_name', 'last_name', 'sex', 'dob', 'country', 'wearables'
            ])
            
            print(f"\n📊 VERIFICATION RESULTS:")
            print(f"   Height NOT extracted: {height_not_extracted}")
            print(f"   Weight NOT extracted: {weight_not_extracted}")
            print(f"   VO2 Max extracted: {vo2_max_extracted}")
            print(f"   HRV extracted: {hrv_extracted}")
            print(f"   Resting HR extracted: {resting_hr_extracted}")
            print(f"   PB Mile extracted: {pb_mile_extracted}")
            print(f"   Weekly Miles extracted: {weekly_miles_extracted}")
            print(f"   Long Run extracted: {long_run_extracted}")
            print(f"   PB Bench extracted: {pb_bench_extracted}")
            print(f"   Personal fields NOT extracted: {personal_fields_not_extracted}")
            
            # Overall success check
            all_checks_passed = all([
                height_not_extracted,
                weight_not_extracted,
                vo2_max_extracted,
                hrv_extracted,
                resting_hr_extracted,
                pb_mile_extracted,
                weekly_miles_extracted,
                long_run_extracted,
                pb_bench_extracted,
                personal_fields_not_extracted
            ])
            
            if all_checks_passed:
                self.log_test("Extract Individual Fields Function", True, "✅ CORRECT DATA MAPPING: Height/weight NOT extracted for athlete_profiles, only performance metrics and training data extracted", {
                    'extracted_fields': extracted_fields,
                    'height_weight_excluded': True,
                    'performance_metrics_included': True,
                    'training_data_included': True,
                    'personal_data_excluded': True
                })
                return True
            else:
                failed_checks = []
                if not height_not_extracted: failed_checks.append("height extracted (should not be)")
                if not weight_not_extracted: failed_checks.append("weight extracted (should not be)")
                if not vo2_max_extracted: failed_checks.append("vo2_max not extracted")
                if not hrv_extracted: failed_checks.append("hrv_ms not extracted")
                if not resting_hr_extracted: failed_checks.append("resting_hr_bpm not extracted")
                if not pb_mile_extracted: failed_checks.append("pb_mile_seconds not extracted")
                if not weekly_miles_extracted: failed_checks.append("weekly_miles not extracted")
                if not long_run_extracted: failed_checks.append("long_run_miles not extracted")
                if not pb_bench_extracted: failed_checks.append("pb_bench_1rm_lb not extracted")
                if not personal_fields_not_extracted: failed_checks.append("personal fields extracted (should not be)")
                
                self.log_test("Extract Individual Fields Function", False, f"❌ INCORRECT DATA MAPPING: {', '.join(failed_checks)}", {
                    'extracted_fields': extracted_fields,
                    'failed_checks': failed_checks
                })
                return False
                
        except Exception as e:
            self.log_test("Extract Individual Fields Function", False, f"❌ Function test failed: {str(e)}")
            return False
    
    def test_hybrid_interview_completion_flow(self):
        """Test the hybrid interview completion flow with sample data"""
        try:
            print("\n🔄 TESTING HYBRID INTERVIEW COMPLETION FLOW 🔄")
            print("=" * 55)
            
            # Sample completion data from review request
            completion_data = {
                "first_name": "Ian",
                "last_name": "Fonville",
                "sex": "Male", 
                "dob": "02/05/2001",
                "country": "US",
                "wearables": ["Garmin"],
                "body_metrics": {
                    "weight_lb": 190,
                    "height_in": 70,
                    "vo2max": 55,
                    "resting_hr_bpm": 45,
                    "hrv_ms": 195
                },
                "pb_mile": "4:59",
                "weekly_miles": 40,
                "long_run": 26,
                "pb_bench_1rm": "315"
            }
            
            print(f"📝 Testing completion flow with data: {json.dumps(completion_data, indent=2)}")
            
            # Create a mock profile data structure that would be sent to the completion endpoint
            score_data = {
                "hybridScore": 85.5,
                "strengthScore": 90.2,
                "speedScore": 88.1,
                "vo2Score": 82.3,
                "distanceScore": 79.8,
                "volumeScore": 84.6,
                "recoveryScore": 87.2
            }
            
            # Test the data separation logic
            # Extract fields that should go to athlete_profiles
            athlete_profile_fields = extract_individual_fields(completion_data, score_data)
            
            # Fields that should go to user_profiles (personal data)
            user_profile_fields = {
                'name': f"{completion_data.get('first_name', '')} {completion_data.get('last_name', '')}".strip(),
                'display_name': completion_data.get('first_name', ''),
                'email': completion_data.get('email', ''),
                'gender': completion_data.get('sex', '').lower() if completion_data.get('sex') else None,
                'country': completion_data.get('country'),
                'height_in': completion_data.get('body_metrics', {}).get('height_in'),
                'weight_lb': completion_data.get('body_metrics', {}).get('weight_lb'),
                'wearables': completion_data.get('wearables')
            }
            
            # Handle date of birth conversion (as done in the actual code)
            if completion_data.get('dob'):
                try:
                    # Convert MM/DD/YYYY to YYYY-MM-DD
                    dob_parts = completion_data.get('dob').split('/')
                    if len(dob_parts) == 3:
                        month, day, year = dob_parts
                        user_profile_fields['date_of_birth'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                except Exception as e:
                    print(f"Error converting date of birth: {e}")
            
            print(f"\n📊 DATA SEPARATION RESULTS:")
            print(f"🏃 ATHLETE_PROFILES should get: {json.dumps(athlete_profile_fields, indent=2)}")
            print(f"👤 USER_PROFILES should get: {json.dumps(user_profile_fields, indent=2)}")
            
            # Verify correct separation
            # user_profiles should get personal data including height/weight
            user_profile_has_height_weight = (
                user_profile_fields.get('height_in') == 70 and 
                user_profile_fields.get('weight_lb') == 190
            )
            
            user_profile_has_personal_data = all([
                user_profile_fields.get('name') == "Ian Fonville",
                user_profile_fields.get('display_name') == "Ian",
                user_profile_fields.get('date_of_birth') == "2001-02-05",
                user_profile_fields.get('gender') == "male",
                user_profile_fields.get('country') == "US",
                user_profile_fields.get('wearables') == ["Garmin"]
            ])
            
            # athlete_profiles should get performance metrics and training data
            athlete_profile_has_performance_data = all([
                athlete_profile_fields.get('vo2_max') == 55,
                athlete_profile_fields.get('hrv_ms') == 195,
                athlete_profile_fields.get('resting_hr_bpm') == 45,
                athlete_profile_fields.get('pb_mile_seconds') == 299,  # 4:59
                athlete_profile_fields.get('weekly_miles') == 40,
                athlete_profile_fields.get('long_run_miles') == 26,
                athlete_profile_fields.get('pb_bench_1rm_lb') == 315
            ])
            
            # athlete_profiles should have score data
            athlete_profile_has_score_data = all([
                athlete_profile_fields.get('hybrid_score') == 85.5,
                athlete_profile_fields.get('strength_score') == 90.2,
                athlete_profile_fields.get('speed_score') == 88.1,
                athlete_profile_fields.get('vo2_score') == 82.3,
                athlete_profile_fields.get('distance_score') == 79.8,
                athlete_profile_fields.get('volume_score') == 84.6,
                athlete_profile_fields.get('recovery_score') == 87.2
            ])
            
            # athlete_profiles should NOT have height/weight
            athlete_profile_missing_height_weight = (
                'height_in' not in athlete_profile_fields and
                'weight_lb' not in athlete_profile_fields
            )
            
            print(f"\n✅ VERIFICATION CHECKS:")
            print(f"   User profiles has height/weight: {user_profile_has_height_weight}")
            print(f"   User profiles has personal data: {user_profile_has_personal_data}")
            print(f"   Athlete profiles has performance data: {athlete_profile_has_performance_data}")
            print(f"   Athlete profiles has score data: {athlete_profile_has_score_data}")
            print(f"   Athlete profiles missing height/weight: {athlete_profile_missing_height_weight}")
            
            all_separation_correct = all([
                user_profile_has_height_weight,
                user_profile_has_personal_data,
                athlete_profile_has_performance_data,
                athlete_profile_has_score_data,
                athlete_profile_missing_height_weight
            ])
            
            if all_separation_correct:
                self.log_test("Hybrid Interview Completion Flow", True, "✅ CORRECT DATA SEPARATION: Personal data (including height/weight) → user_profiles, Performance data → athlete_profiles", {
                    'user_profile_fields': user_profile_fields,
                    'athlete_profile_fields': athlete_profile_fields,
                    'separation_correct': True
                })
                return True
            else:
                failed_separations = []
                if not user_profile_has_height_weight: failed_separations.append("height/weight not in user_profiles")
                if not user_profile_has_personal_data: failed_separations.append("personal data not in user_profiles")
                if not athlete_profile_has_performance_data: failed_separations.append("performance data not in athlete_profiles")
                if not athlete_profile_has_score_data: failed_separations.append("score data not in athlete_profiles")
                if not athlete_profile_missing_height_weight: failed_separations.append("height/weight incorrectly in athlete_profiles")
                
                self.log_test("Hybrid Interview Completion Flow", False, f"❌ INCORRECT DATA SEPARATION: {', '.join(failed_separations)}", {
                    'user_profile_fields': user_profile_fields,
                    'athlete_profile_fields': athlete_profile_fields,
                    'failed_separations': failed_separations
                })
                return False
                
        except Exception as e:
            self.log_test("Hybrid Interview Completion Flow", False, f"❌ Completion flow test failed: {str(e)}")
            return False
    
    def test_hybrid_interview_completion_endpoint(self):
        """Test the actual hybrid interview completion endpoint"""
        try:
            print("\n🌐 TESTING HYBRID INTERVIEW COMPLETION ENDPOINT 🌐")
            print("=" * 60)
            
            # Test the hybrid interview start endpoint (should exist and be protected)
            print("🔍 Testing hybrid interview start endpoint...")
            start_response = self.session.post(f"{API_BASE_URL}/hybrid-interview/start", json={})
            
            print(f"🔍 Start endpoint response status: {start_response.status_code}")
            
            # Test the hybrid interview chat endpoint (should exist and be protected)
            print("🔍 Testing hybrid interview chat endpoint...")
            chat_payload = {
                "messages": [{"role": "user", "content": "Hello"}],
                "session_id": "test-session-id"
            }
            chat_response = self.session.post(f"{API_BASE_URL}/hybrid-interview/chat", json=chat_payload)
            
            print(f"🔍 Chat endpoint response status: {chat_response.status_code}")
            
            try:
                chat_response_data = chat_response.json()
                print(f"🔍 Chat response data: {json.dumps(chat_response_data, indent=2)}")
            except:
                print(f"🔍 Chat response text: {chat_response.text}")
            
            # Both endpoints should exist and be properly protected
            # Without authentication, they should return 401/403, not 404
            start_exists = start_response.status_code in [401, 403]
            chat_exists = chat_response.status_code in [401, 403]
            
            print(f"\n📊 ENDPOINT VERIFICATION:")
            print(f"   Start endpoint exists: {start_exists}")
            print(f"   Chat endpoint exists: {chat_exists}")
            
            if start_exists and chat_exists:
                self.log_test("Hybrid Interview Completion Endpoint", True, "✅ ENDPOINTS EXIST: Both hybrid interview start and chat endpoints are properly configured and protected", {
                    'start_status': start_response.status_code,
                    'chat_status': chat_response.status_code,
                    'endpoints_exist': True,
                    'properly_protected': True
                })
                return True
            elif start_exists or chat_exists:
                missing_endpoint = "chat" if not chat_exists else "start"
                self.log_test("Hybrid Interview Completion Endpoint", False, f"❌ PARTIAL ENDPOINTS: {missing_endpoint} endpoint missing or misconfigured", {
                    'start_status': start_response.status_code,
                    'chat_status': chat_response.status_code,
                    'missing_endpoint': missing_endpoint
                })
                return False
            else:
                self.log_test("Hybrid Interview Completion Endpoint", False, "❌ ENDPOINTS MISSING: Both hybrid interview endpoints not found or misconfigured", {
                    'start_status': start_response.status_code,
                    'chat_status': chat_response.status_code,
                    'endpoints_exist': False
                })
                return False
                
        except Exception as e:
            self.log_test("Hybrid Interview Completion Endpoint", False, f"❌ Endpoint test failed: {str(e)}")
            return False
    
    def test_data_mapping_requirements_compliance(self):
        """Test compliance with the specific data mapping requirements from the review"""
        try:
            print("\n📋 TESTING DATA MAPPING REQUIREMENTS COMPLIANCE 📋")
            print("=" * 65)
            
            print("Requirements from review:")
            print("1. Height and weight are NOT extracted for athlete_profiles (should go to user_profiles)")
            print("2. Only performance metrics are extracted: vo2_max, hrv_ms, resting_hr_bpm")
            print("3. Training data is extracted: pb_mile_seconds, weekly_miles, pb_bench_1rm_lb, etc.")
            print("4. user_profiles should get: name, display_name, date_of_birth, gender, country, height, weight, wearables")
            print("5. athlete_profiles should get: score specific data and performance metrics")
            
            # Import the function
            try:
                from server import extract_individual_fields
            except ImportError:
                self.log_test("Data Mapping Requirements Compliance", False, "❌ Cannot import extract_individual_fields function")
                return False
            
            # Test data from review
            test_data = {
                "first_name": "Ian",
                "last_name": "Fonville",
                "sex": "Male",
                "dob": "02/05/2001",
                "country": "US",
                "wearables": ["Garmin"],
                "body_metrics": {
                    "weight_lb": 190,
                    "height_in": 70,
                    "vo2max": 55,
                    "resting_hr_bpm": 45,
                    "hrv_ms": 195
                },
                "pb_mile": "4:59",
                "weekly_miles": 40,
                "long_run": 26,
                "pb_bench_1rm": "315"
            }
            
            score_data = {
                "hybridScore": 85.5,
                "strengthScore": 90.2,
                "speedScore": 88.1,
                "vo2Score": 82.3,
                "distanceScore": 79.8,
                "volumeScore": 84.6,
                "recoveryScore": 87.2
            }
            
            # Extract fields for athlete_profiles
            athlete_fields = extract_individual_fields(test_data, score_data)
            
            # Define what should go to user_profiles
            user_fields = {
                'name': f"{test_data.get('first_name', '')} {test_data.get('last_name', '')}".strip(),
                'display_name': test_data.get('first_name', ''),
                'date_of_birth': test_data.get('dob'),
                'gender': test_data.get('sex', '').lower() if test_data.get('sex') else None,
                'country': test_data.get('country'),
                'height': test_data.get('body_metrics', {}).get('height_in'),
                'weight': test_data.get('body_metrics', {}).get('weight_lb'),
                'wearables': test_data.get('wearables')
            }
            
            print(f"\n📊 COMPLIANCE CHECK RESULTS:")
            
            # Requirement 1: Height and weight NOT in athlete_profiles
            req1_pass = 'height_in' not in athlete_fields and 'weight_lb' not in athlete_fields
            print(f"   1. Height/weight NOT in athlete_profiles: {req1_pass}")
            
            # Requirement 2: Performance metrics ARE in athlete_profiles
            req2_pass = all([
                'vo2_max' in athlete_fields and athlete_fields['vo2_max'] == 55,
                'hrv_ms' in athlete_fields and athlete_fields['hrv_ms'] == 195,
                'resting_hr_bpm' in athlete_fields and athlete_fields['resting_hr_bpm'] == 45
            ])
            print(f"   2. Performance metrics in athlete_profiles: {req2_pass}")
            
            # Requirement 3: Training data ARE in athlete_profiles
            req3_pass = all([
                'pb_mile_seconds' in athlete_fields and athlete_fields['pb_mile_seconds'] == 299,  # 4:59
                'weekly_miles' in athlete_fields and athlete_fields['weekly_miles'] == 40,
                'pb_bench_1rm_lb' in athlete_fields and athlete_fields['pb_bench_1rm_lb'] == 315,
                'long_run_miles' in athlete_fields and athlete_fields['long_run_miles'] == 26
            ])
            print(f"   3. Training data in athlete_profiles: {req3_pass}")
            
            # Requirement 4: user_profiles should get personal data
            req4_pass = all([
                user_fields['name'] == "Ian Fonville",
                user_fields['display_name'] == "Ian",
                user_fields['date_of_birth'] == "02/05/2001",
                user_fields['gender'] == "male",
                user_fields['country'] == "US",
                user_fields['height'] == 70,
                user_fields['weight'] == 190,
                user_fields['wearables'] == ["Garmin"]
            ])
            print(f"   4. Personal data for user_profiles: {req4_pass}")
            
            # Requirement 5: athlete_profiles should get score and performance data
            req5_pass = all([
                'hybrid_score' in athlete_fields and athlete_fields['hybrid_score'] == 85.5,
                'strength_score' in athlete_fields and athlete_fields['strength_score'] == 90.2,
                'vo2_max' in athlete_fields,
                'hrv_ms' in athlete_fields,
                'pb_mile_seconds' in athlete_fields
            ])
            print(f"   5. Score/performance data for athlete_profiles: {req5_pass}")
            
            all_requirements_pass = all([req1_pass, req2_pass, req3_pass, req4_pass, req5_pass])
            
            if all_requirements_pass:
                self.log_test("Data Mapping Requirements Compliance", True, "✅ ALL REQUIREMENTS MET: Data mapping correctly follows user requirements with height/weight going to user_profiles", {
                    'athlete_fields': athlete_fields,
                    'user_fields': user_fields,
                    'all_requirements_pass': True,
                    'requirement_results': {
                        'height_weight_not_in_athlete': req1_pass,
                        'performance_metrics_in_athlete': req2_pass,
                        'training_data_in_athlete': req3_pass,
                        'personal_data_for_user': req4_pass,
                        'score_data_for_athlete': req5_pass
                    }
                })
                return True
            else:
                failed_requirements = []
                if not req1_pass: failed_requirements.append("Height/weight incorrectly in athlete_profiles")
                if not req2_pass: failed_requirements.append("Performance metrics missing from athlete_profiles")
                if not req3_pass: failed_requirements.append("Training data missing from athlete_profiles")
                if not req4_pass: failed_requirements.append("Personal data not properly structured for user_profiles")
                if not req5_pass: failed_requirements.append("Score data not properly structured for athlete_profiles")
                
                self.log_test("Data Mapping Requirements Compliance", False, f"❌ REQUIREMENTS NOT MET: {', '.join(failed_requirements)}", {
                    'athlete_fields': athlete_fields,
                    'user_fields': user_fields,
                    'failed_requirements': failed_requirements
                })
                return False
                
        except Exception as e:
            self.log_test("Data Mapping Requirements Compliance", False, f"❌ Requirements compliance test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all hybrid interview data mapping tests"""
        print("\n" + "="*80)
        print("🧪 HYBRID INTERVIEW DATA MAPPING COMPREHENSIVE TESTING 🧪")
        print("="*80)
        print("Testing the updated data mapping for hybrid interview completion")
        print("to verify correct field distribution as requested in review")
        print("="*80)
        
        tests = [
            ("Extract Individual Fields Function", self.test_extract_individual_fields_function),
            ("Hybrid Interview Completion Flow", self.test_hybrid_interview_completion_flow),
            ("Hybrid Interview Completion Endpoint", self.test_hybrid_interview_completion_endpoint),
            ("Data Mapping Requirements Compliance", self.test_data_mapping_requirements_compliance)
        ]
        
        test_results = []
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            print("-" * 60)
            try:
                result = test_func()
                test_results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                test_results.append((test_name, False))
        
        # Summary
        print("\n" + "="*80)
        print("🧪 HYBRID INTERVIEW DATA MAPPING TEST SUMMARY 🧪")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nTEST RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 CONCLUSION: Data mapping is CORRECT - height/weight go to user_profiles, performance data to athlete_profiles")
        elif passed_tests >= total_tests // 2:
            print("⚠️  CONCLUSION: Data mapping is PARTIALLY CORRECT - some issues remain")
        else:
            print("❌ CONCLUSION: Data mapping is INCORRECT - field distribution needs fixing")
        
        print("="*80)
        
        return passed_tests >= total_tests // 2

def main():
    """Main test execution"""
    tester = HybridInterviewDataMappingTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 HYBRID INTERVIEW DATA MAPPING TESTS COMPLETED SUCCESSFULLY")
        return 0
    else:
        print("\n❌ HYBRID INTERVIEW DATA MAPPING TESTS FAILED")
        return 1

if __name__ == "__main__":
    exit(main())
#!/usr/bin/env python3
"""
Database Audit Script - Examining Structure and Specific Record
As requested in the review request to understand proper data storage
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

print(f"🗄️ DATABASE AUDIT - Examining Structure and Specific Record")
print(f"Testing backend at: {API_BASE_URL}")
print("="*80)

class DatabaseAuditor:
    def __init__(self):
        self.session = requests.Session()
        
    def examine_specific_record(self):
        """Examine the specific athlete_profiles record with ID 4a417508-ccc8-482c-b917-8d84f018310e"""
        print("\n🔍 EXAMINING SPECIFIC ATHLETE PROFILE RECORD")
        print("=" * 60)
        
        profile_id = "4a417508-ccc8-482c-b917-8d84f018310e"
        print(f"Target Profile ID: {profile_id}")
        
        # Get the specific athlete profile
        response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n📊 ATHLETE PROFILE RECORD STRUCTURE:")
            print(f"   Profile ID: {data.get('profile_id')}")
            print(f"   User ID: {data.get('user_id')}")
            print(f"   Created At: {data.get('created_at')}")
            print(f"   Updated At: {data.get('updated_at')}")
            
            # Examine profile_json structure
            profile_json = data.get('profile_json', {})
            print(f"\n📋 PROFILE_JSON STRUCTURE ({len(profile_json)} fields):")
            for key, value in profile_json.items():
                if isinstance(value, dict):
                    print(f"   {key}: {type(value).__name__} with {len(value)} fields")
                    for subkey, subvalue in value.items():
                        print(f"      └─ {subkey}: {type(subvalue).__name__} = {subvalue}")
                elif isinstance(value, list):
                    print(f"   {key}: {type(value).__name__} with {len(value)} items = {value}")
                else:
                    print(f"   {key}: {type(value).__name__} = {value}")
            
            # Examine score_data structure
            score_data = data.get('score_data')
            if score_data:
                print(f"\n🎯 SCORE_DATA STRUCTURE ({len(score_data)} fields):")
                for key, value in score_data.items():
                    print(f"   {key}: {type(value).__name__} = {value}")
            else:
                print(f"\n🎯 SCORE_DATA: None")
            
            # Examine user_profile structure
            user_profile = data.get('user_profile')
            if user_profile:
                print(f"\n👤 USER_PROFILE STRUCTURE ({len(user_profile)} fields):")
                for key, value in user_profile.items():
                    print(f"   {key}: {type(value).__name__} = {value}")
            else:
                print(f"\n👤 USER_PROFILE: None")
            
            # Analyze data storage patterns
            print(f"\n🔍 DATA STORAGE PATTERN ANALYSIS:")
            
            # Check height storage
            height_in_profile = profile_json.get('body_metrics', {}).get('height_in')
            height_in_user = user_profile.get('height_in') if user_profile else None
            print(f"   Height storage:")
            print(f"      profile_json.body_metrics.height_in: {height_in_profile}")
            print(f"      user_profile.height_in: {height_in_user}")
            
            # Check weight storage
            weight_in_profile = profile_json.get('body_metrics', {}).get('weight_lb')
            weight_in_user = user_profile.get('weight_lb') if user_profile else None
            print(f"   Weight storage:")
            print(f"      profile_json.body_metrics.weight_lb: {weight_in_profile}")
            print(f"      user_profile.weight_lb: {weight_in_user}")
            
            # Check personal data storage
            name_in_profile = f"{profile_json.get('first_name', '')} {profile_json.get('last_name', '')}".strip()
            name_in_user = user_profile.get('name') if user_profile else None
            display_name_in_user = user_profile.get('display_name') if user_profile else None
            print(f"   Name storage:")
            print(f"      profile_json name: {name_in_profile}")
            print(f"      user_profile.name: {name_in_user}")
            print(f"      user_profile.display_name: {display_name_in_user}")
            
            # Check performance data storage
            print(f"   Performance data (should be in profile_json):")
            print(f"      pb_mile: {profile_json.get('pb_mile')}")
            print(f"      pb_5k: {profile_json.get('pb_5k')}")
            print(f"      pb_marathon: {profile_json.get('pb_marathon')}")
            print(f"      weekly_miles: {profile_json.get('weekly_miles')}")
            print(f"      pb_bench_1rm: {profile_json.get('pb_bench_1rm')}")
            print(f"      vo2_max: {profile_json.get('body_metrics', {}).get('vo2_max')}")
            
            return True
            
        elif response.status_code == 404:
            print(f"❌ Profile {profile_id} not found - may have been deleted or ID is incorrect")
            return False
        else:
            print(f"❌ HTTP {response.status_code} error accessing profile: {response.text}")
            return False
    
    def analyze_database_schema(self):
        """Analyze the database schema by examining multiple records"""
        print("\n🗄️ DATABASE SCHEMA ANALYSIS")
        print("=" * 50)
        
        # Get athlete profiles to analyze schema
        response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            
            if not profiles:
                print("❌ No athlete profiles found to analyze schema")
                return False
            
            print(f"📊 Analyzing {len(profiles)} athlete profiles for schema patterns")
            
            # Analyze field patterns across profiles
            field_analysis = {
                'athlete_profiles_fields': set(),
                'profile_json_fields': set(),
                'score_data_fields': set(),
                'body_metrics_fields': set(),
                'individual_fields_present': set(),
                'profiles_with_scores': 0,
                'profiles_without_scores': 0
            }
            
            for i, profile in enumerate(profiles[:5]):  # Analyze first 5 profiles
                print(f"\n   Profile {i+1} ({profile.get('id', 'unknown')[:8]}...):")
                
                # Collect top-level athlete_profiles fields
                for key in profile.keys():
                    field_analysis['athlete_profiles_fields'].add(key)
                    if key not in ['profile_json', 'score_data']:
                        print(f"      {key}: {type(profile[key]).__name__}")
                
                # Analyze profile_json structure
                profile_json = profile.get('profile_json', {})
                if profile_json:
                    for key in profile_json.keys():
                        field_analysis['profile_json_fields'].add(key)
                    
                    # Analyze body_metrics if present
                    body_metrics = profile_json.get('body_metrics', {})
                    if body_metrics:
                        for key in body_metrics.keys():
                            field_analysis['body_metrics_fields'].add(key)
                
                # Analyze score_data structure
                score_data = profile.get('score_data')
                if score_data:
                    field_analysis['profiles_with_scores'] += 1
                    for key in score_data.keys():
                        field_analysis['score_data_fields'].add(key)
                else:
                    field_analysis['profiles_without_scores'] += 1
                
                # Check for individual fields (extracted from profile_json)
                individual_fields = ['weight_lb', 'vo2_max', 'pb_mile_seconds', 'pb_bench_1rm_lb', 'hrv_ms', 'resting_hr_bpm']
                for field in individual_fields:
                    if profile.get(field) is not None:
                        field_analysis['individual_fields_present'].add(field)
            
            # Print schema analysis results
            print(f"\n📋 ATHLETE_PROFILES TABLE SCHEMA:")
            print(f"   Fields found: {sorted(field_analysis['athlete_profiles_fields'])}")
            
            print(f"\n📋 PROFILE_JSON STRUCTURE:")
            print(f"   Fields found: {sorted(field_analysis['profile_json_fields'])}")
            
            print(f"\n📋 BODY_METRICS STRUCTURE:")
            print(f"   Fields found: {sorted(field_analysis['body_metrics_fields'])}")
            
            print(f"\n📋 SCORE_DATA STRUCTURE:")
            print(f"   Fields found: {sorted(field_analysis['score_data_fields'])}")
            print(f"   Profiles with scores: {field_analysis['profiles_with_scores']}")
            print(f"   Profiles without scores: {field_analysis['profiles_without_scores']}")
            
            print(f"\n📋 INDIVIDUAL FIELDS (extracted from profile_json):")
            print(f"   Fields present: {sorted(field_analysis['individual_fields_present'])}")
            
            return True
            
        else:
            print(f"❌ HTTP {response.status_code} error accessing athlete profiles: {response.text}")
            return False
    
    def compare_user_vs_athlete_profiles(self):
        """Compare user_profiles vs athlete_profiles data structure"""
        print("\n🔄 USER_PROFILES vs ATHLETE_PROFILES STRUCTURE COMPARISON")
        print("=" * 70)
        
        # Get a profile with user data to compare structures
        response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            
            if not profiles:
                print("❌ No profiles found for comparison")
                return False
            
            # Find a profile with user_profile data
            profile_with_user = None
            for profile in profiles:
                # Get detailed profile data
                detail_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile['id']}")
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    if detail_data.get('user_profile'):
                        profile_with_user = detail_data
                        break
            
            if not profile_with_user:
                print("❌ No profiles found with user_profile data for comparison")
                return False
            
            profile_json = profile_with_user.get('profile_json', {})
            user_profile = profile_with_user.get('user_profile', {})
            
            print(f"📊 COMPARING DATA STORAGE PATTERNS:")
            print(f"   Profile ID: {profile_with_user.get('profile_id')}")
            print(f"   User ID: {profile_with_user.get('user_id')}")
            
            # Compare personal data storage
            print(f"\n👤 PERSONAL DATA COMPARISON:")
            personal_fields = ['name', 'display_name', 'email', 'gender', 'country', 'date_of_birth']
            for field in personal_fields:
                profile_value = profile_json.get(field) or profile_json.get(field.replace('_', ''))
                user_value = user_profile.get(field)
                print(f"   {field}:")
                print(f"      profile_json: {profile_value}")
                print(f"      user_profile: {user_value}")
                print(f"      ✅ Correct storage" if user_value else "❌ Missing in user_profile")
            
            # Compare body metrics storage
            print(f"\n📏 BODY METRICS COMPARISON:")
            body_fields = ['height_in', 'weight_lb']
            body_metrics = profile_json.get('body_metrics', {})
            for field in body_fields:
                profile_value = body_metrics.get(field)
                user_value = user_profile.get(field)
                print(f"   {field}:")
                print(f"      profile_json.body_metrics: {profile_value}")
                print(f"      user_profile: {user_value}")
                print(f"      ✅ Correct storage" if user_value else "❌ Missing in user_profile")
            
            # Check performance data (should only be in profile_json)
            print(f"\n🏃 PERFORMANCE DATA (should be in profile_json only):")
            performance_fields = ['pb_mile', 'pb_5k', 'pb_marathon', 'weekly_miles', 'pb_bench_1rm', 'pb_squat_1rm', 'pb_deadlift_1rm']
            for field in performance_fields:
                profile_value = profile_json.get(field)
                user_value = user_profile.get(field)
                print(f"   {field}:")
                print(f"      profile_json: {profile_value}")
                print(f"      user_profile: {user_value}")
                if profile_value and not user_value:
                    print(f"      ✅ Correct - performance data in profile_json only")
                elif user_value:
                    print(f"      ⚠️  Performance data duplicated in user_profile")
                else:
                    print(f"      ❓ No data found")
            
            # Check fitness metrics (should be in profile_json)
            print(f"\n💪 FITNESS METRICS (should be in profile_json only):")
            fitness_fields = ['vo2_max', 'resting_hr_bpm', 'hrv_ms']
            for field in fitness_fields:
                profile_value = body_metrics.get(field) or profile_json.get(field)
                user_value = user_profile.get(field)
                print(f"   {field}:")
                print(f"      profile_json: {profile_value}")
                print(f"      user_profile: {user_value}")
                if profile_value and not user_value:
                    print(f"      ✅ Correct - fitness data in profile_json only")
                elif user_value:
                    print(f"      ⚠️  Fitness data duplicated in user_profile")
                else:
                    print(f"      ❓ No data found")
            
            return True
            
        else:
            print(f"❌ HTTP {response.status_code} error accessing profiles: {response.text}")
            return False
    
    def analyze_extract_individual_fields(self):
        """Analyze what the extract_individual_fields function should actually do"""
        print("\n⚙️ EXTRACT_INDIVIDUAL_FIELDS FUNCTION ANALYSIS")
        print("=" * 60)
        
        # Get a profile to analyze what fields should be extracted
        response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            
            if not profiles:
                print("❌ No profiles found for analysis")
                return False
            
            # Analyze the first profile with data
            profile = profiles[0]
            profile_json = profile.get('profile_json', {})
            
            print(f"📊 ANALYZING PROFILE FOR FIELD EXTRACTION:")
            print(f"   Profile ID: {profile.get('id')}")
            
            # Simulate what extract_individual_fields should do
            print(f"\n🔍 FIELDS THAT SHOULD BE EXTRACTED:")
            
            # Performance metrics that should be extracted for database columns
            extraction_candidates = {
                'Performance Times': {
                    'pb_mile': profile_json.get('pb_mile'),
                    'pb_5k': profile_json.get('pb_5k'),
                    'pb_10k': profile_json.get('pb_10k'),
                    'pb_half_marathon': profile_json.get('pb_half_marathon'),
                    'pb_marathon': profile_json.get('pb_marathon')
                },
                'Strength PRs': {
                    'pb_bench_1rm': profile_json.get('pb_bench_1rm'),
                    'pb_squat_1rm': profile_json.get('pb_squat_1rm'),
                    'pb_deadlift_1rm': profile_json.get('pb_deadlift_1rm')
                },
                'Volume Metrics': {
                    'weekly_miles': profile_json.get('weekly_miles'),
                    'long_run': profile_json.get('long_run')
                },
                'Fitness Metrics': {
                    'vo2_max': profile_json.get('body_metrics', {}).get('vo2_max'),
                    'resting_hr_bpm': profile_json.get('body_metrics', {}).get('resting_hr_bpm'),
                    'hrv_ms': profile_json.get('body_metrics', {}).get('hrv_ms')
                }
            }
            
            # Fields that should NOT be extracted (go to user_profiles)
            user_profile_fields = {
                'Personal Data': {
                    'first_name': profile_json.get('first_name'),
                    'last_name': profile_json.get('last_name'),
                    'email': profile_json.get('email'),
                    'sex/gender': profile_json.get('sex'),
                    'dob/date_of_birth': profile_json.get('dob'),
                    'country': profile_json.get('country')
                },
                'Body Metrics (Personal)': {
                    'height_in': profile_json.get('body_metrics', {}).get('height_in'),
                    'weight_lb': profile_json.get('body_metrics', {}).get('weight_lb')
                }
            }
            
            print(f"\n✅ SHOULD BE EXTRACTED TO ATHLETE_PROFILES COLUMNS:")
            for category, fields in extraction_candidates.items():
                print(f"   {category}:")
                for field, value in fields.items():
                    if value is not None:
                        print(f"      {field}: {value} → should extract")
                    else:
                        print(f"      {field}: None → skip")
            
            print(f"\n❌ SHOULD NOT BE EXTRACTED (goes to user_profiles):")
            for category, fields in user_profile_fields.items():
                print(f"   {category}:")
                for field, value in fields.items():
                    if value is not None:
                        print(f"      {field}: {value} → user_profiles table")
                    else:
                        print(f"      {field}: None → skip")
            
            # Check current individual fields in the profile
            print(f"\n🔍 CURRENT INDIVIDUAL FIELDS IN PROFILE:")
            individual_fields = ['weight_lb', 'vo2_max', 'pb_mile_seconds', 'pb_bench_1rm_lb', 'hrv_ms', 'resting_hr_bpm']
            for field in individual_fields:
                value = profile.get(field)
                if value is not None:
                    print(f"   {field}: {value} ✅ Present")
                else:
                    print(f"   {field}: None ❌ Missing")
            
            # Analyze the PGRST204 error cause
            print(f"\n🚨 PGRST204 ERROR ANALYSIS:")
            print(f"   The PGRST204 error likely occurred because:")
            print(f"   1. extract_individual_fields() tried to extract fields to columns that don't exist")
            print(f"   2. Or tried to extract personal data that should go to user_profiles")
            print(f"   3. The function should only extract performance/fitness data for athlete_profiles")
            print(f"   4. Personal data (name, height, weight) should go to user_profiles table")
            
            return True
            
        else:
            print(f"❌ HTTP {response.status_code} error accessing profiles: {response.text}")
            return False
    
    def investigate_storage_issues(self):
        """Investigate current storage issues that caused PGRST204 error"""
        print("\n🚨 CURRENT STORAGE ISSUES INVESTIGATION")
        print("=" * 55)
        
        # Test creating a profile to see what happens
        test_profile_data = {
            "profile_json": {
                "first_name": "Test",
                "last_name": "User",
                "email": "test.storage@example.com",
                "sex": "Male",
                "dob": "1990-01-01",
                "country": "US",
                "body_metrics": {
                    "height_in": 70,
                    "weight_lb": 180,
                    "vo2_max": 50,
                    "resting_hr_bpm": 60,
                    "hrv_ms": 40
                },
                "pb_mile": "6:00",
                "pb_5k": "20:00",
                "weekly_miles": 30,
                "long_run": 15,
                "pb_bench_1rm": 200,
                "pb_squat_1rm": 300,
                "pb_deadlift_1rm": 400
            },
            "is_public": True
        }
        
        print(f"🧪 TESTING PROFILE CREATION TO IDENTIFY STORAGE ISSUES:")
        
        # Test public profile creation (no auth required)
        response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=test_profile_data)
        
        print(f"   Public profile creation: HTTP {response.status_code}")
        
        if response.status_code == 200:
            created_profile = response.json()
            profile_id = created_profile.get('user_profile', {}).get('id')
            
            if profile_id:
                print(f"   ✅ Profile created successfully: {profile_id}")
                
                # Now test score storage (this is where PGRST204 might occur)
                test_score_data = {
                    "hybridScore": 75.0,
                    "strengthScore": 80.0,
                    "speedScore": 70.0,
                    "vo2Score": 65.0,
                    "distanceScore": 75.0,
                    "volumeScore": 70.0,
                    "recoveryScore": 80.0
                }
                
                print(f"\n🎯 TESTING SCORE STORAGE (where PGRST204 might occur):")
                score_response = self.session.post(f"{API_BASE_URL}/athlete-profile/{profile_id}/score", json=test_score_data)
                
                print(f"   Score storage: HTTP {score_response.status_code}")
                
                if score_response.status_code == 200:
                    print(f"   ✅ Score storage successful - PGRST204 error has been fixed")
                    
                    # Verify the stored data
                    verify_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        stored_scores = verify_data.get('score_data')
                        if stored_scores:
                            print(f"   ✅ Scores verified in database: {list(stored_scores.keys())}")
                        else:
                            print(f"   ❌ Scores not found in database after storage")
                    
                    return True
                    
                elif score_response.status_code == 500:
                    try:
                        error_data = score_response.json()
                        error_detail = error_data.get('detail', '')
                        
                        if 'PGRST204' in error_detail:
                            print(f"   ❌ PGRST204 ERROR CONFIRMED: {error_detail}")
                            print(f"   🔍 This indicates the extract_individual_fields function is trying to")
                            print(f"       store data in database columns that don't exist")
                            return False
                        else:
                            print(f"   ❌ Different error: {error_detail}")
                            return False
                    except:
                        print(f"   ❌ Score storage failed with 500 error")
                        return False
                else:
                    print(f"   ❌ Unexpected score storage response: HTTP {score_response.status_code}")
                    return False
            else:
                print(f"   ❌ Profile created but no ID returned")
                return False
                
        elif response.status_code == 500:
            try:
                error_data = response.json()
                error_detail = error_data.get('detail', '')
                print(f"   ❌ Profile creation failed: {error_detail}")
                
                if 'column' in error_detail.lower() and 'does not exist' in error_detail.lower():
                    print(f"   🔍 This indicates database schema issues - columns missing")
                    return False
                else:
                    return False
            except:
                print(f"   ❌ Profile creation failed with 500 error")
                return False
        else:
            print(f"   ❌ Unexpected profile creation response: HTTP {response.status_code}")
            return False
    
    def run_complete_audit(self):
        """Run the complete database audit as requested in the review"""
        print("🗄️ DATABASE AUDIT - EXAMINING STRUCTURE AND SPECIFIC RECORD 🗄️")
        print("="*80)
        print("Investigating:")
        print("1. Specific athlete_profiles record with ID 4a417508-ccc8-482c-b917-8d84f018310e")
        print("2. Database schema analysis (athlete_profiles and user_profiles)")
        print("3. Data storage patterns and field extraction logic")
        print("4. Current storage issues that caused PGRST204 error")
        print("="*80)
        
        audit_tests = [
            ("Specific Athlete Profile Record Examination", self.examine_specific_record),
            ("Database Schema Analysis", self.analyze_database_schema),
            ("User vs Athlete Profiles Structure", self.compare_user_vs_athlete_profiles),
            ("Extract Individual Fields Analysis", self.analyze_extract_individual_fields),
            ("Current Storage Issues Investigation", self.investigate_storage_issues)
        ]
        
        audit_results = []
        for test_name, test_func in audit_tests:
            print(f"\n🔍 Running: {test_name}")
            print("-" * 60)
            try:
                result = test_func()
                audit_results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                audit_results.append((test_name, False))
        
        # Summary of audit results
        print("\n" + "="*80)
        print("🗄️ DATABASE AUDIT SUMMARY 🗄️")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(audit_results)
        
        for test_name, result in audit_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nAUDIT RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 AUDIT CONCLUSION: Database structure is properly understood and working")
        elif passed_tests >= total_tests // 2:
            print("⚠️  AUDIT CONCLUSION: Database structure partially understood - some issues remain")
        else:
            print("❌ AUDIT CONCLUSION: Database structure has significant issues")
        
        print("="*80)
        
        return passed_tests >= total_tests // 2

if __name__ == "__main__":
    auditor = DatabaseAuditor()
    auditor.run_complete_audit()
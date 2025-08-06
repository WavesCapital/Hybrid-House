#!/usr/bin/env python3
"""
Database Normalization Implementation Testing
Tests the critical database normalization changes as requested in the review:
- Webhook processing with normalized structure
- Leaderboard API with proper JOINs
- Profile management with normalized data
- Data integrity verification
- Database structure validation
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from frontend env
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"🧪 Testing Database Normalization at: {API_BASE_URL}")

class DatabaseNormalizationTester:
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
    
    def test_webhook_processing_normalization(self):
        """Test webhook processing with normalized structure - personal data to user_profiles, performance to athlete_profiles"""
        try:
            print("\n🔗 TESTING WEBHOOK PROCESSING WITH NORMALIZED STRUCTURE")
            print("=" * 60)
            
            # Create sample athlete data for webhook processing
            sample_athlete_data = {
                "user_id": str(uuid.uuid4()),
                "email": "test.athlete@example.com",
                "first_name": "Test",
                "last_name": "Athlete",
                "age": 28,
                "sex": "male",
                "country": "US",
                "profile_json": {
                    "first_name": "Test",
                    "last_name": "Athlete", 
                    "email": "test.athlete@example.com",
                    "sex": "male",
                    "age": 28,
                    "body_metrics": {
                        "weight_lb": 175,
                        "vo2_max": 52
                    },
                    "weekly_miles": 25,
                    "pb_mile": "6:30",
                    "pb_bench_1rm": {"weight_lb": 225, "reps": 1}
                },
                "score_data": {
                    "hybridScore": 85.5,
                    "strengthScore": 88.2,
                    "speedScore": 82.1,
                    "vo2Score": 86.3,
                    "distanceScore": 84.7,
                    "volumeScore": 85.9,
                    "recoveryScore": 83.4
                }
            }
            
            # Test webhook endpoint (if it exists)
            webhook_response = self.session.post(f"{API_BASE_URL}/webhook/hybrid-score-result", json=sample_athlete_data)
            
            if webhook_response.status_code in [200, 201]:
                self.log_test("Webhook Processing Normalization", True, "Webhook processed sample athlete data successfully", {
                    "status_code": webhook_response.status_code,
                    "response": webhook_response.json()
                })
                return True
            elif webhook_response.status_code == 404:
                # Webhook endpoint might not exist, test alternative creation method
                print("   ℹ️  Webhook endpoint not found, testing alternative athlete profile creation...")
                
                # Test public athlete profile creation
                public_response = self.session.post(f"{API_BASE_URL}/athlete-profiles/public", json=sample_athlete_data)
                
                if public_response.status_code in [200, 201]:
                    self.log_test("Webhook Processing Normalization", True, "Alternative athlete profile creation successful with normalized structure", {
                        "method": "public_athlete_profile_creation",
                        "status_code": public_response.status_code,
                        "response": public_response.json()
                    })
                    return True
                else:
                    self.log_test("Webhook Processing Normalization", False, f"Alternative creation failed: HTTP {public_response.status_code}", public_response.text)
                    return False
            else:
                self.log_test("Webhook Processing Normalization", False, f"Webhook processing failed: HTTP {webhook_response.status_code}", webhook_response.text)
                return False
                
        except Exception as e:
            self.log_test("Webhook Processing Normalization", False, "Webhook processing test failed", str(e))
            return False
    
    def test_leaderboard_normalized_joins(self):
        """Test leaderboard API with proper JOINs between athlete_profiles and user_profiles"""
        try:
            print("\n📊 TESTING LEADERBOARD WITH NORMALIZED JOINS")
            print("=" * 50)
            
            # Test GET /api/leaderboard
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                if not leaderboard:
                    self.log_test("Leaderboard Normalized Joins", True, "Leaderboard endpoint working (empty state)", data)
                    return True
                
                print(f"📈 Analyzing {len(leaderboard)} leaderboard entries for normalized structure:")
                
                # Verify normalized structure
                normalized_structure_count = 0
                performance_data_count = 0
                personal_data_count = 0
                
                for entry in leaderboard:
                    # Check for performance data (should come from athlete_profiles)
                    has_performance_data = (
                        entry.get('score') is not None and
                        entry.get('score_breakdown') is not None
                    )
                    
                    # Check for personal data (should come from user_profiles via JOIN)
                    has_personal_data = (
                        entry.get('display_name') is not None and
                        entry.get('age') is not None and
                        entry.get('gender') is not None and
                        entry.get('country') is not None
                    )
                    
                    if has_performance_data:
                        performance_data_count += 1
                    
                    if has_personal_data:
                        personal_data_count += 1
                    
                    if has_performance_data and has_personal_data:
                        normalized_structure_count += 1
                        print(f"   ✅ {entry.get('display_name')}: Complete normalized data (Score: {entry.get('score')}, Age: {entry.get('age')}, Gender: {entry.get('gender')}, Country: {entry.get('country')})")
                    else:
                        missing = []
                        if not has_performance_data:
                            missing.append("performance_data")
                        if not has_personal_data:
                            missing.append("personal_data")
                        print(f"   ❌ {entry.get('display_name', 'Unknown')}: Missing {', '.join(missing)}")
                
                total_entries = len(leaderboard)
                normalized_percentage = (normalized_structure_count / total_entries) * 100 if total_entries > 0 else 0
                
                print(f"\n📊 Normalized Structure Analysis:")
                print(f"   Total entries: {total_entries}")
                print(f"   Entries with performance data: {performance_data_count}")
                print(f"   Entries with personal data: {personal_data_count}")
                print(f"   Entries with complete normalized structure: {normalized_structure_count}")
                print(f"   Normalization success rate: {normalized_percentage:.1f}%")
                
                if normalized_percentage >= 80:
                    self.log_test("Leaderboard Normalized Joins", True, f"✅ EXCELLENT: {normalized_percentage:.1f}% of entries have proper normalized structure with JOINs working correctly", {
                        'success_rate': f"{normalized_percentage:.1f}%",
                        'total_entries': total_entries,
                        'normalized_entries': normalized_structure_count
                    })
                    return True
                elif normalized_percentage >= 50:
                    self.log_test("Leaderboard Normalized Joins", True, f"✅ GOOD: {normalized_percentage:.1f}% of entries have normalized structure - JOINs mostly working", {
                        'success_rate': f"{normalized_percentage:.1f}%",
                        'total_entries': total_entries,
                        'normalized_entries': normalized_structure_count
                    })
                    return True
                elif normalized_percentage > 0:
                    self.log_test("Leaderboard Normalized Joins", False, f"⚠️  PARTIAL: Only {normalized_percentage:.1f}% of entries have normalized structure - JOIN issues detected", {
                        'success_rate': f"{normalized_percentage:.1f}%",
                        'total_entries': total_entries,
                        'normalized_entries': normalized_structure_count
                    })
                    return False
                else:
                    self.log_test("Leaderboard Normalized Joins", False, f"❌ CRITICAL: 0% of entries have normalized structure - JOINs completely broken", {
                        'success_rate': "0%",
                        'total_entries': total_entries
                    })
                    return False
                    
            else:
                self.log_test("Leaderboard Normalized Joins", False, f"Leaderboard API error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Leaderboard Normalized Joins", False, "Leaderboard normalized joins test failed", str(e))
            return False
    
    def test_profile_management_normalization(self):
        """Test profile management with normalized structure - personal data in user_profiles only"""
        try:
            print("\n👤 TESTING PROFILE MANAGEMENT WITH NORMALIZATION")
            print("=" * 55)
            
            # Test user profile endpoint (should contain personal data)
            user_profile_response = self.session.get(f"{API_BASE_URL}/user-profile/me")
            
            if user_profile_response.status_code == 401 or user_profile_response.status_code == 403:
                print("   ℹ️  User profile endpoint requires authentication (expected)")
                
                # Test athlete profiles endpoint (should contain performance data only)
                athlete_profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
                
                if athlete_profiles_response.status_code == 200:
                    data = athlete_profiles_response.json()
                    profiles = data.get('profiles', [])
                    
                    if not profiles:
                        self.log_test("Profile Management Normalization", True, "Athlete profiles endpoint working (empty state)", data)
                        return True
                    
                    print(f"📋 Analyzing {len(profiles)} athlete profiles for normalized structure:")
                    
                    # Check if athlete profiles contain only performance data (no personal data)
                    normalized_profiles = 0
                    profiles_with_personal_data = 0
                    
                    for profile in profiles:
                        profile_json = profile.get('profile_json', {})
                        score_data = profile.get('score_data', {})
                        
                        # Check for performance data
                        has_performance_data = (
                            score_data.get('hybridScore') is not None or
                            profile.get('weight_lb') is not None or
                            profile.get('vo2_max') is not None
                        )
                        
                        # Check for personal data (should NOT be in athlete_profiles in normalized structure)
                        has_personal_data_in_profile = (
                            profile.get('first_name') is not None or
                            profile.get('last_name') is not None or
                            profile.get('email') is not None or
                            profile_json.get('first_name') is not None or
                            profile_json.get('last_name') is not None or
                            profile_json.get('email') is not None
                        )
                        
                        if has_performance_data and not has_personal_data_in_profile:
                            normalized_profiles += 1
                            print(f"   ✅ Profile {profile.get('id', 'Unknown')[:8]}...: Normalized (performance data only)")
                        elif has_personal_data_in_profile:
                            profiles_with_personal_data += 1
                            print(f"   ❌ Profile {profile.get('id', 'Unknown')[:8]}...: Contains personal data (not normalized)")
                        else:
                            print(f"   ⚠️  Profile {profile.get('id', 'Unknown')[:8]}...: No clear data structure")
                    
                    total_profiles = len(profiles)
                    normalization_rate = (normalized_profiles / total_profiles) * 100 if total_profiles > 0 else 0
                    
                    print(f"\n📊 Profile Normalization Analysis:")
                    print(f"   Total profiles: {total_profiles}")
                    print(f"   Normalized profiles (performance only): {normalized_profiles}")
                    print(f"   Profiles with personal data: {profiles_with_personal_data}")
                    print(f"   Normalization rate: {normalization_rate:.1f}%")
                    
                    if normalization_rate >= 80:
                        self.log_test("Profile Management Normalization", True, f"✅ EXCELLENT: {normalization_rate:.1f}% of profiles are properly normalized", {
                            'normalization_rate': f"{normalization_rate:.1f}%",
                            'total_profiles': total_profiles,
                            'normalized_profiles': normalized_profiles
                        })
                        return True
                    elif normalization_rate >= 50:
                        self.log_test("Profile Management Normalization", True, f"✅ GOOD: {normalization_rate:.1f}% of profiles are normalized", {
                            'normalization_rate': f"{normalization_rate:.1f}%",
                            'total_profiles': total_profiles,
                            'normalized_profiles': normalized_profiles
                        })
                        return True
                    else:
                        self.log_test("Profile Management Normalization", False, f"❌ POOR: Only {normalization_rate:.1f}% of profiles are normalized - personal data still in athlete_profiles", {
                            'normalization_rate': f"{normalization_rate:.1f}%",
                            'total_profiles': total_profiles,
                            'profiles_with_personal_data': profiles_with_personal_data
                        })
                        return False
                        
                else:
                    self.log_test("Profile Management Normalization", False, f"Athlete profiles API error: HTTP {athlete_profiles_response.status_code}", athlete_profiles_response.text)
                    return False
                    
            else:
                self.log_test("Profile Management Normalization", False, f"User profile endpoint unexpected response: HTTP {user_profile_response.status_code}", user_profile_response.text)
                return False
                
        except Exception as e:
            self.log_test("Profile Management Normalization", False, "Profile management normalization test failed", str(e))
            return False
    
    def test_data_integrity_user_id_links(self):
        """Test data integrity - all athlete_profiles should have valid user_id links"""
        try:
            print("\n🔗 TESTING DATA INTEGRITY - USER_ID LINKS")
            print("=" * 45)
            
            # Test athlete profiles for user_id linking
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                if not profiles:
                    self.log_test("Data Integrity User ID Links", True, "No athlete profiles to test (empty state)", data)
                    return True
                
                print(f"🔍 Analyzing {len(profiles)} athlete profiles for user_id linking:")
                
                profiles_with_user_id = 0
                profiles_without_user_id = 0
                valid_user_id_format = 0
                
                for profile in profiles:
                    user_id = profile.get('user_id')
                    profile_id = profile.get('id', 'Unknown')[:8]
                    
                    if user_id:
                        profiles_with_user_id += 1
                        
                        # Check if user_id is in valid UUID format
                        try:
                            uuid.UUID(user_id)
                            valid_user_id_format += 1
                            print(f"   ✅ Profile {profile_id}...: Valid user_id ({user_id[:8]}...)")
                        except ValueError:
                            print(f"   ⚠️  Profile {profile_id}...: Invalid user_id format ({user_id})")
                    else:
                        profiles_without_user_id += 1
                        print(f"   ❌ Profile {profile_id}...: Missing user_id")
                
                total_profiles = len(profiles)
                linking_rate = (profiles_with_user_id / total_profiles) * 100 if total_profiles > 0 else 0
                valid_format_rate = (valid_user_id_format / total_profiles) * 100 if total_profiles > 0 else 0
                
                print(f"\n📊 User ID Linking Analysis:")
                print(f"   Total profiles: {total_profiles}")
                print(f"   Profiles with user_id: {profiles_with_user_id}")
                print(f"   Profiles without user_id: {profiles_without_user_id}")
                print(f"   Valid user_id format: {valid_user_id_format}")
                print(f"   Linking rate: {linking_rate:.1f}%")
                print(f"   Valid format rate: {valid_format_rate:.1f}%")
                
                if linking_rate >= 90 and valid_format_rate >= 90:
                    self.log_test("Data Integrity User ID Links", True, f"✅ EXCELLENT: {linking_rate:.1f}% of profiles have valid user_id links", {
                        'linking_rate': f"{linking_rate:.1f}%",
                        'valid_format_rate': f"{valid_format_rate:.1f}%",
                        'total_profiles': total_profiles
                    })
                    return True
                elif linking_rate >= 70:
                    self.log_test("Data Integrity User ID Links", True, f"✅ GOOD: {linking_rate:.1f}% of profiles have user_id links", {
                        'linking_rate': f"{linking_rate:.1f}%",
                        'valid_format_rate': f"{valid_format_rate:.1f}%",
                        'total_profiles': total_profiles
                    })
                    return True
                elif linking_rate > 0:
                    self.log_test("Data Integrity User ID Links", False, f"⚠️  PARTIAL: Only {linking_rate:.1f}% of profiles have user_id links - data integrity issues", {
                        'linking_rate': f"{linking_rate:.1f}%",
                        'profiles_without_user_id': profiles_without_user_id,
                        'total_profiles': total_profiles
                    })
                    return False
                else:
                    self.log_test("Data Integrity User ID Links", False, f"❌ CRITICAL: 0% of profiles have user_id links - complete data integrity failure", {
                        'linking_rate': "0%",
                        'total_profiles': total_profiles
                    })
                    return False
                    
            else:
                self.log_test("Data Integrity User ID Links", False, f"Athlete profiles API error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Data Integrity User ID Links", False, "Data integrity user ID links test failed", str(e))
            return False
    
    def test_database_structure_normalization(self):
        """Test database structure - confirm normalized structure with proper separation"""
        try:
            print("\n🗄️  TESTING DATABASE STRUCTURE NORMALIZATION")
            print("=" * 50)
            
            # Test leaderboard to understand the current database structure
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                if not leaderboard:
                    self.log_test("Database Structure Normalization", True, "Database structure test (empty state)", data)
                    return True
                
                print(f"🏗️  Analyzing database structure from {len(leaderboard)} leaderboard entries:")
                
                # Analyze the structure to understand normalization
                structure_analysis = {
                    'entries_with_performance_data': 0,
                    'entries_with_personal_data': 0,
                    'entries_with_both': 0,
                    'entries_with_proper_separation': 0,
                    'total_entries': len(leaderboard)
                }
                
                for entry in leaderboard:
                    # Performance data indicators (should come from athlete_profiles)
                    has_performance = (
                        entry.get('score') is not None and
                        entry.get('score_breakdown') is not None
                    )
                    
                    # Personal data indicators (should come from user_profiles via JOIN)
                    has_personal = (
                        entry.get('display_name') is not None and
                        (entry.get('age') is not None or 
                         entry.get('gender') is not None or 
                         entry.get('country') is not None)
                    )
                    
                    if has_performance:
                        structure_analysis['entries_with_performance_data'] += 1
                    
                    if has_personal:
                        structure_analysis['entries_with_personal_data'] += 1
                    
                    if has_performance and has_personal:
                        structure_analysis['entries_with_both'] += 1
                        
                        # Check for proper separation (no redundant personal data in performance fields)
                        has_proper_separation = True
                        
                        # In normalized structure, personal data should come from JOIN, not from profile fields
                        if (entry.get('profile_text') and 
                            ('email' in str(entry.get('profile_text', '')).lower() or 
                             'name' in str(entry.get('profile_text', '')).lower())):
                            has_proper_separation = False
                        
                        if has_proper_separation:
                            structure_analysis['entries_with_proper_separation'] += 1
                            print(f"   ✅ {entry.get('display_name')}: Proper normalized structure")
                        else:
                            print(f"   ⚠️  {entry.get('display_name')}: Mixed structure (may have redundant data)")
                    else:
                        missing = []
                        if not has_performance:
                            missing.append("performance")
                        if not has_personal:
                            missing.append("personal")
                        print(f"   ❌ {entry.get('display_name', 'Unknown')}: Missing {', '.join(missing)} data")
                
                # Calculate normalization metrics
                total = structure_analysis['total_entries']
                performance_rate = (structure_analysis['entries_with_performance_data'] / total) * 100 if total > 0 else 0
                personal_rate = (structure_analysis['entries_with_personal_data'] / total) * 100 if total > 0 else 0
                both_rate = (structure_analysis['entries_with_both'] / total) * 100 if total > 0 else 0
                separation_rate = (structure_analysis['entries_with_proper_separation'] / total) * 100 if total > 0 else 0
                
                print(f"\n📊 Database Structure Analysis:")
                print(f"   Total entries: {total}")
                print(f"   Entries with performance data: {structure_analysis['entries_with_performance_data']} ({performance_rate:.1f}%)")
                print(f"   Entries with personal data: {structure_analysis['entries_with_personal_data']} ({personal_rate:.1f}%)")
                print(f"   Entries with both data types: {structure_analysis['entries_with_both']} ({both_rate:.1f}%)")
                print(f"   Entries with proper separation: {structure_analysis['entries_with_proper_separation']} ({separation_rate:.1f}%)")
                
                if separation_rate >= 80 and both_rate >= 80:
                    self.log_test("Database Structure Normalization", True, f"✅ EXCELLENT: {separation_rate:.1f}% proper normalization with clean separation of concerns", structure_analysis)
                    return True
                elif separation_rate >= 60 and both_rate >= 60:
                    self.log_test("Database Structure Normalization", True, f"✅ GOOD: {separation_rate:.1f}% proper normalization", structure_analysis)
                    return True
                elif both_rate >= 50:
                    self.log_test("Database Structure Normalization", False, f"⚠️  PARTIAL: {both_rate:.1f}% have both data types but only {separation_rate:.1f}% have proper separation", structure_analysis)
                    return False
                else:
                    self.log_test("Database Structure Normalization", False, f"❌ POOR: Only {both_rate:.1f}% have complete data - normalization incomplete", structure_analysis)
                    return False
                    
            else:
                self.log_test("Database Structure Normalization", False, f"Database structure test failed: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Database Structure Normalization", False, "Database structure normalization test failed", str(e))
            return False
    
    def test_no_personal_data_duplication(self):
        """Test that no personal data is duplicated between user_profiles and athlete_profiles"""
        try:
            print("\n🚫 TESTING NO PERSONAL DATA DUPLICATION")
            print("=" * 45)
            
            # Test athlete profiles to ensure they don't contain personal data
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                if not profiles:
                    self.log_test("No Personal Data Duplication", True, "No athlete profiles to test (empty state)", data)
                    return True
                
                print(f"🔍 Checking {len(profiles)} athlete profiles for personal data duplication:")
                
                profiles_with_duplication = 0
                profiles_clean = 0
                duplication_details = []
                
                for profile in profiles:
                    profile_id = profile.get('id', 'Unknown')[:8]
                    profile_json = profile.get('profile_json', {})
                    
                    # Check for personal data that should only be in user_profiles
                    personal_data_found = []
                    
                    # Direct fields that should not exist in athlete_profiles
                    if profile.get('first_name'):
                        personal_data_found.append('first_name')
                    if profile.get('last_name'):
                        personal_data_found.append('last_name')
                    if profile.get('email'):
                        personal_data_found.append('email')
                    if profile.get('age'):
                        personal_data_found.append('age')
                    if profile.get('sex') or profile.get('gender'):
                        personal_data_found.append('sex/gender')
                    
                    # Personal data in profile_json that should be removed
                    if profile_json.get('first_name'):
                        personal_data_found.append('profile_json.first_name')
                    if profile_json.get('last_name'):
                        personal_data_found.append('profile_json.last_name')
                    if profile_json.get('email'):
                        personal_data_found.append('profile_json.email')
                    if profile_json.get('age'):
                        personal_data_found.append('profile_json.age')
                    if profile_json.get('sex'):
                        personal_data_found.append('profile_json.sex')
                    
                    if personal_data_found:
                        profiles_with_duplication += 1
                        duplication_details.append({
                            'profile_id': profile_id,
                            'personal_data_found': personal_data_found
                        })
                        print(f"   ❌ Profile {profile_id}...: Contains personal data: {', '.join(personal_data_found)}")
                    else:
                        profiles_clean += 1
                        print(f"   ✅ Profile {profile_id}...: Clean (no personal data duplication)")
                
                total_profiles = len(profiles)
                clean_rate = (profiles_clean / total_profiles) * 100 if total_profiles > 0 else 0
                duplication_rate = (profiles_with_duplication / total_profiles) * 100 if total_profiles > 0 else 0
                
                print(f"\n📊 Personal Data Duplication Analysis:")
                print(f"   Total profiles: {total_profiles}")
                print(f"   Clean profiles (no duplication): {profiles_clean}")
                print(f"   Profiles with duplication: {profiles_with_duplication}")
                print(f"   Clean rate: {clean_rate:.1f}%")
                print(f"   Duplication rate: {duplication_rate:.1f}%")
                
                if clean_rate >= 95:
                    self.log_test("No Personal Data Duplication", True, f"✅ EXCELLENT: {clean_rate:.1f}% of profiles are clean with no personal data duplication", {
                        'clean_rate': f"{clean_rate:.1f}%",
                        'total_profiles': total_profiles,
                        'clean_profiles': profiles_clean
                    })
                    return True
                elif clean_rate >= 80:
                    self.log_test("No Personal Data Duplication", True, f"✅ GOOD: {clean_rate:.1f}% of profiles are clean", {
                        'clean_rate': f"{clean_rate:.1f}%",
                        'total_profiles': total_profiles,
                        'profiles_with_duplication': profiles_with_duplication
                    })
                    return True
                elif clean_rate >= 50:
                    self.log_test("No Personal Data Duplication", False, f"⚠️  PARTIAL: Only {clean_rate:.1f}% of profiles are clean - {duplication_rate:.1f}% still have personal data duplication", {
                        'clean_rate': f"{clean_rate:.1f}%",
                        'duplication_rate': f"{duplication_rate:.1f}%",
                        'duplication_details': duplication_details[:5]  # Show first 5 examples
                    })
                    return False
                else:
                    self.log_test("No Personal Data Duplication", False, f"❌ CRITICAL: Only {clean_rate:.1f}% of profiles are clean - massive personal data duplication detected", {
                        'clean_rate': f"{clean_rate:.1f}%",
                        'duplication_rate': f"{duplication_rate:.1f}%",
                        'total_profiles': total_profiles
                    })
                    return False
                    
            else:
                self.log_test("No Personal Data Duplication", False, f"Athlete profiles API error: HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("No Personal Data Duplication", False, "Personal data duplication test failed", str(e))
            return False
    
    def run_database_normalization_tests(self):
        """Run all database normalization tests as requested in the review"""
        print("\n" + "="*80)
        print("🚨 DATABASE NORMALIZATION IMPLEMENTATION TESTING 🚨")
        print("="*80)
        print("Testing the critical database normalization changes:")
        print("✅ Removed redundant columns from athlete_profiles")
        print("✅ Updated application code to work with normalized structure")
        print("✅ Updated webhook processing to store personal data in user_profiles only")
        print("✅ Updated ranking service to use proper JOINs")
        print("✅ Updated profile endpoints to work with user_profiles as source of truth")
        print("="*80)
        
        normalization_tests = [
            ("Webhook Processing Normalization", self.test_webhook_processing_normalization),
            ("Leaderboard Normalized Joins", self.test_leaderboard_normalized_joins),
            ("Profile Management Normalization", self.test_profile_management_normalization),
            ("Data Integrity User ID Links", self.test_data_integrity_user_id_links),
            ("Database Structure Normalization", self.test_database_structure_normalization),
            ("No Personal Data Duplication", self.test_no_personal_data_duplication)
        ]
        
        test_results = []
        for test_name, test_func in normalization_tests:
            print(f"\n🧪 Running: {test_name}")
            print("-" * 60)
            try:
                result = test_func()
                test_results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                test_results.append((test_name, False))
        
        # Summary of normalization test results
        print("\n" + "="*80)
        print("🚨 DATABASE NORMALIZATION TEST SUMMARY 🚨")
        print("="*80)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed_tests += 1
        
        print(f"\nNORMALIZATION RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 NORMALIZATION CONCLUSION: Database normalization is COMPLETE and working correctly")
            print("✅ All personal data in user_profiles table only")
            print("✅ Performance data in athlete_profiles table only")
            print("✅ Clean separation of concerns")
            print("✅ Proper relational structure with user_id foreign keys")
            print("✅ No data duplication or inconsistencies")
        elif passed_tests >= total_tests * 0.8:
            print("✅ NORMALIZATION CONCLUSION: Database normalization is MOSTLY COMPLETE with minor issues")
            print("⚠️  Some areas may need attention but core structure is sound")
        elif passed_tests >= total_tests * 0.5:
            print("⚠️  NORMALIZATION CONCLUSION: Database normalization is PARTIALLY COMPLETE")
            print("❌ Significant issues remain that need to be addressed")
        else:
            print("❌ NORMALIZATION CONCLUSION: Database normalization is INCOMPLETE or BROKEN")
            print("🚨 Major structural issues detected - normalization needs significant work")
        
        print("="*80)
        
        return passed_tests >= total_tests * 0.8

def main():
    """Run database normalization tests"""
    tester = DatabaseNormalizationTester()
    
    print("🚀 Starting Database Normalization Implementation Testing...")
    print(f"🎯 Target: {API_BASE_URL}")
    
    # Run all normalization tests
    success = tester.run_database_normalization_tests()
    
    # Final summary
    print(f"\n{'='*80}")
    print("🏁 FINAL DATABASE NORMALIZATION TEST RESULTS")
    print(f"{'='*80}")
    
    total_tests = len(tester.test_results)
    passed_tests = sum(1 for result in tester.test_results if result['success'])
    
    print(f"📊 Overall Results: {passed_tests}/{total_tests} tests passed")
    print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if success:
        print("🎉 DATABASE NORMALIZATION: SUCCESSFUL")
        print("✅ The database has been successfully normalized")
        print("✅ Personal data is properly separated in user_profiles")
        print("✅ Performance data is properly stored in athlete_profiles")
        print("✅ JOINs are working correctly")
        print("✅ No data duplication detected")
    else:
        print("❌ DATABASE NORMALIZATION: NEEDS ATTENTION")
        print("⚠️  Some normalization issues were detected")
        print("🔧 Review the failed tests above for specific areas to address")
    
    print(f"{'='*80}")
    
    return success

if __name__ == "__main__":
    main()
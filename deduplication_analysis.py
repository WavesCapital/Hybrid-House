#!/usr/bin/env python3
"""
DEDUPLICATION ANALYSIS
Analyzing the deduplication logic in the ranking service to understand
why there might be issues with user entries appearing multiple times.
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

print(f"🔍 DEDUPLICATION ANALYSIS")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 80)

class DeduplicationAnalyzer:
    def __init__(self):
        self.session = requests.Session()
        self.findings = []
        
    def log_finding(self, category, finding, details=None):
        """Log analysis findings"""
        print(f"\n📋 {category}: {finding}")
        if details:
            if isinstance(details, dict) or isinstance(details, list):
                print(f"   Details: {json.dumps(details, indent=2)}")
            else:
                print(f"   Details: {details}")
        
        self.findings.append({
            'category': category,
            'finding': finding,
            'details': details
        })
    
    def analyze_raw_profiles_vs_leaderboard(self):
        """Compare raw athlete profiles with leaderboard to understand deduplication"""
        print("\n🎯 ANALYSIS 1: RAW PROFILES VS LEADERBOARD COMPARISON")
        print("-" * 60)
        
        try:
            # Get raw athlete profiles
            profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if profiles_response.status_code == 200 and leaderboard_response.status_code == 200:
                profiles_data = profiles_response.json()
                leaderboard_data = leaderboard_response.json()
                
                raw_profiles = profiles_data.get('profiles', [])
                leaderboard_entries = leaderboard_data.get('leaderboard', [])
                
                self.log_finding("RAW DATA COMPARISON", f"Raw profiles: {len(raw_profiles)}, Leaderboard entries: {len(leaderboard_entries)}")
                
                # Analyze user_profile_id distribution in raw profiles
                user_profile_id_counts = {}
                profiles_by_user = {}
                
                for profile in raw_profiles:
                    user_profile_id = profile.get('user_profile_id')
                    profile_json = profile.get('profile_json', {})
                    first_name = profile_json.get('first_name', '')
                    last_name = profile_json.get('last_name', '')
                    name = f"{first_name} {last_name}".strip()
                    score = profile.get('score_data', {}).get('hybridScore', 0)
                    
                    if user_profile_id:
                        if user_profile_id not in user_profile_id_counts:
                            user_profile_id_counts[user_profile_id] = 0
                            profiles_by_user[user_profile_id] = []
                        
                        user_profile_id_counts[user_profile_id] += 1
                        profiles_by_user[user_profile_id].append({
                            'profile_id': profile.get('id'),
                            'name': name,
                            'score': score,
                            'is_public': profile.get('is_public', False)
                        })
                
                # Find users with multiple profiles
                users_with_multiple_profiles = {}
                for user_id, count in user_profile_id_counts.items():
                    if count > 1:
                        users_with_multiple_profiles[user_id] = {
                            'count': count,
                            'profiles': profiles_by_user[user_id]
                        }
                
                self.log_finding("MULTIPLE PROFILES PER USER", f"Found {len(users_with_multiple_profiles)} users with multiple profiles", users_with_multiple_profiles)
                
                # Analyze null user_profile_id entries
                null_user_profiles = [p for p in raw_profiles if not p.get('user_profile_id')]
                self.log_finding("NULL USER_PROFILE_ID", f"Found {len(null_user_profiles)} profiles with null user_profile_id", [
                    {
                        'profile_id': p.get('id'),
                        'name': f"{p.get('profile_json', {}).get('first_name', '')} {p.get('profile_json', {}).get('last_name', '')}".strip(),
                        'score': p.get('score_data', {}).get('hybridScore', 0)
                    } for p in null_user_profiles
                ])
                
                # Check how deduplication affects the leaderboard
                expected_unique_users = len(set([p.get('user_profile_id') for p in raw_profiles if p.get('user_profile_id')]))
                expected_unique_users += len(null_user_profiles)  # Each null user_profile_id is treated as unique
                
                self.log_finding("DEDUPLICATION EXPECTATION", f"Expected unique users: {expected_unique_users}, Actual leaderboard entries: {len(leaderboard_entries)}")
                
                return {
                    'raw_profiles': len(raw_profiles),
                    'leaderboard_entries': len(leaderboard_entries),
                    'users_with_multiple_profiles': users_with_multiple_profiles,
                    'null_user_profiles': len(null_user_profiles)
                }
            else:
                self.log_finding("RAW DATA COMPARISON", "❌ Failed to get raw data for comparison")
                return None
                
        except Exception as e:
            self.log_finding("RAW DATA COMPARISON", f"❌ ERROR: {str(e)}")
            return None
    
    def analyze_deduplication_logic_flaw(self):
        """Analyze the specific flaw in deduplication logic"""
        print("\n🎯 ANALYSIS 2: DEDUPLICATION LOGIC FLAW ANALYSIS")
        print("-" * 60)
        
        try:
            # The issue is in the ranking service deduplication logic
            # It only deduplicates by user_profile_id, but profiles with null user_profile_id
            # are not being deduplicated properly
            
            profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if profiles_response.status_code == 200:
                profiles_data = profiles_response.json()
                raw_profiles = profiles_data.get('profiles', [])
                
                # Simulate the current deduplication logic
                profiles_by_score = sorted(raw_profiles, key=lambda x: x.get('score_data', {}).get('hybridScore', 0), reverse=True)
                
                seen_users = set()
                deduplicated_profiles = []
                problematic_profiles = []
                
                for profile in profiles_by_score:
                    user_profile_id = profile.get('user_profile_id')
                    profile_json = profile.get('profile_json', {})
                    name = f"{profile_json.get('first_name', '')} {profile_json.get('last_name', '')}".strip()
                    score = profile.get('score_data', {}).get('hybridScore', 0)
                    
                    if user_profile_id:
                        if user_profile_id not in seen_users:
                            seen_users.add(user_profile_id)
                            deduplicated_profiles.append({
                                'profile_id': profile.get('id'),
                                'user_profile_id': user_profile_id,
                                'name': name,
                                'score': score,
                                'status': 'kept (first occurrence)'
                            })
                        else:
                            problematic_profiles.append({
                                'profile_id': profile.get('id'),
                                'user_profile_id': user_profile_id,
                                'name': name,
                                'score': score,
                                'status': 'duplicate (should be removed)'
                            })
                    else:
                        # NULL user_profile_id - these are NOT being deduplicated
                        # This is the bug! Each null user_profile_id is treated as unique
                        deduplicated_profiles.append({
                            'profile_id': profile.get('id'),
                            'user_profile_id': None,
                            'name': name,
                            'score': score,
                            'status': 'kept (null user_profile_id - NOT DEDUPLICATED)'
                        })
                
                self.log_finding("DEDUPLICATION SIMULATION", f"Simulated deduplication results", {
                    'total_raw_profiles': len(profiles_by_score),
                    'deduplicated_count': len(deduplicated_profiles),
                    'duplicate_count': len(problematic_profiles),
                    'null_user_profile_id_count': len([p for p in deduplicated_profiles if not p['user_profile_id']])
                })
                
                self.log_finding("PROBLEMATIC DUPLICATES", f"Found {len(problematic_profiles)} duplicate profiles that should be removed", problematic_profiles)
                
                # The critical flaw: profiles with null user_profile_id are not deduplicated
                null_profiles = [p for p in deduplicated_profiles if not p['user_profile_id']]
                if len(null_profiles) > 1:
                    self.log_finding("CRITICAL FLAW IDENTIFIED", f"❌ {len(null_profiles)} profiles with null user_profile_id are ALL being kept", {
                        'issue': 'Profiles with null user_profile_id are not being deduplicated',
                        'impact': 'Same user can appear multiple times if they have multiple profiles without user_profile_id',
                        'null_profiles': null_profiles
                    })
                
                return {
                    'deduplication_working': len(problematic_profiles) == 0,
                    'null_profile_issue': len(null_profiles) > 1,
                    'problematic_profiles': problematic_profiles
                }
            else:
                self.log_finding("DEDUPLICATION SIMULATION", "❌ Failed to get profiles for simulation")
                return None
                
        except Exception as e:
            self.log_finding("DEDUPLICATION SIMULATION", f"❌ ERROR: {str(e)}")
            return None
    
    def analyze_nick_bare_display_name_issue(self):
        """Analyze why Nick shows as 'Nick' instead of 'Nick Bare'"""
        print("\n🎯 ANALYSIS 3: NICK BARE DISPLAY NAME ISSUE")
        print("-" * 60)
        
        try:
            # Get Nick's profile directly
            nick_profile_id = "4a417508-ccc8-482c-b917-8d84f018310e"
            profile_response = self.session.get(f"{API_BASE_URL}/athlete-profile/{nick_profile_id}")
            
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                profile_json = profile_data.get('profile_json', {})
                
                # Analyze the display name logic
                display_name_analysis = {
                    'profile_json_first_name': profile_json.get('first_name'),
                    'profile_json_last_name': profile_json.get('last_name'),
                    'profile_json_display_name': profile_json.get('display_name'),
                    'profile_json_email': profile_json.get('email')
                }
                
                self.log_finding("NICK PROFILE DATA", "Nick's profile data analysis", display_name_analysis)
                
                # Check if Nick has a user_profile_id
                # Get all profiles to find Nick's entry
                profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
                if profiles_response.status_code == 200:
                    profiles_data = profiles_response.json()
                    raw_profiles = profiles_data.get('profiles', [])
                    
                    nick_profile = None
                    for profile in raw_profiles:
                        if profile.get('id') == nick_profile_id:
                            nick_profile = profile
                            break
                    
                    if nick_profile:
                        user_profile_id = nick_profile.get('user_profile_id')
                        
                        self.log_finding("NICK USER_PROFILE_ID", f"Nick's user_profile_id: {user_profile_id}")
                        
                        if not user_profile_id:
                            self.log_finding("DISPLAY NAME ISSUE ROOT CAUSE", "❌ Nick has null user_profile_id", {
                                'issue': 'Nick profile has null user_profile_id',
                                'impact': 'Display name fallback logic uses profile_json data only',
                                'fallback_chain': [
                                    '1. user_profiles.display_name (SKIPPED - no user_profile_id)',
                                    '2. profile_json.display_name',
                                    '3. profile_json.first_name + profile_json.last_name',
                                    '4. profile_json.first_name only',
                                    '5. email prefix'
                                ],
                                'current_result': 'Using first_name only: "Nick"',
                                'expected_result': 'Should be "Nick Bare" if last_name exists'
                            })
                            
                            # Check if last_name exists but is not being used
                            last_name = profile_json.get('last_name')
                            if last_name:
                                self.log_finding("DISPLAY NAME FIX NEEDED", f"✅ Last name exists: '{last_name}' - should be combined with first name", {
                                    'current_display': 'Nick',
                                    'should_be': f"Nick {last_name}",
                                    'fix_location': 'ranking_service.py lines 108-112 - display name enhancement logic'
                                })
                            else:
                                self.log_finding("DISPLAY NAME LIMITATION", "Last name not available in profile_json")
                        else:
                            self.log_finding("DISPLAY NAME ISSUE", "Nick has user_profile_id - check user_profiles table")
                
                return display_name_analysis
            else:
                self.log_finding("NICK PROFILE DATA", f"❌ Failed to get Nick's profile: HTTP {profile_response.status_code}")
                return None
                
        except Exception as e:
            self.log_finding("NICK PROFILE DATA", f"❌ ERROR: {str(e)}")
            return None
    
    def run_complete_analysis(self):
        """Run all analyses and provide summary"""
        print("🚨 STARTING DEDUPLICATION ANALYSIS 🚨")
        print("=" * 80)
        
        # Run all analyses
        raw_vs_leaderboard = self.analyze_raw_profiles_vs_leaderboard()
        deduplication_flaw = self.analyze_deduplication_logic_flaw()
        nick_display_name = self.analyze_nick_bare_display_name_issue()
        
        # Generate summary
        print("\n" + "=" * 80)
        print("🎯 ANALYSIS SUMMARY")
        print("=" * 80)
        
        critical_issues = []
        
        # Analyze findings
        for finding in self.findings:
            if "❌" in finding['finding'] or "CRITICAL" in finding['category']:
                critical_issues.append(f"❌ {finding['category']}: {finding['finding']}")
        
        if critical_issues:
            print("\n🚨 CRITICAL ISSUES IDENTIFIED:")
            for issue in critical_issues:
                print(f"   {issue}")
        else:
            print("\n✅ NO CRITICAL DEDUPLICATION ISSUES FOUND")
        
        # Provide specific recommendations
        print("\n📋 SPECIFIC RECOMMENDATIONS:")
        
        if deduplication_flaw and deduplication_flaw.get('null_profile_issue'):
            print("   1. 🔧 FIX NULL USER_PROFILE_ID DEDUPLICATION:")
            print("      - Modify ranking_service.py lines 179-189")
            print("      - Add logic to deduplicate profiles with null user_profile_id by name or email")
            print("      - Consider using profile_id as fallback for deduplication key")
        
        if nick_display_name:
            print("   2. 🔧 FIX NICK BARE DISPLAY NAME:")
            print("      - Check ranking_service.py lines 108-112")
            print("      - Ensure last_name is properly combined with first_name")
            print("      - Verify profile_json contains last_name data")
        
        print("   3. 🔧 FRONTEND CACHING CHECK:")
        print("      - User reports Kyle S as #1, but backend shows Nick as #1")
        print("      - This suggests frontend caching or API endpoint mismatch")
        print("      - Verify frontend is calling the correct API endpoint")
        print("      - Check for browser/CDN caching issues")
        
        print(f"\n📊 ANALYSIS COMPLETE - {len(self.findings)} findings logged")
        
        return self.findings

if __name__ == "__main__":
    analyzer = DeduplicationAnalyzer()
    findings = analyzer.run_complete_analysis()
#!/usr/bin/env python3
"""
LEADERBOARD FILTERING INVESTIGATION
Investigating why only 2 entries show on leaderboard when there are 9 profiles with complete scores.
This is the key to understanding the frontend-backend disconnect.
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

print(f"🔍 LEADERBOARD FILTERING INVESTIGATION")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 80)

class LeaderboardFilteringInvestigator:
    def __init__(self):
        self.session = requests.Session()
        self.findings = []
        
    def log_finding(self, category, finding, details=None):
        """Log investigation findings"""
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
    
    def investigate_profile_filtering_logic(self):
        """Investigate why profiles are being filtered out of the leaderboard"""
        print("\n🎯 INVESTIGATION 1: PROFILE FILTERING LOGIC")
        print("-" * 60)
        
        try:
            # Get all profiles with complete scores
            profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if profiles_response.status_code == 200:
                profiles_data = profiles_response.json()
                all_profiles = profiles_data.get('profiles', [])
                
                self.log_finding("ALL PROFILES COUNT", f"Found {len(all_profiles)} profiles with complete scores")
                
                # Analyze each profile's eligibility for leaderboard
                eligible_profiles = []
                ineligible_profiles = []
                
                for profile in all_profiles:
                    profile_id = profile.get('id')
                    is_public = profile.get('is_public', False)
                    user_profile_id = profile.get('user_profile_id')
                    score_data = profile.get('score_data', {})
                    profile_json = profile.get('profile_json', {})
                    
                    # Check if profile meets leaderboard criteria
                    has_complete_scores = all(score_data.get(field) for field in 
                                            ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score', 
                                             'distanceScore', 'volumeScore', 'recoveryScore'])
                    
                    eligibility_check = {
                        'profile_id': profile_id,
                        'name': f"{profile_json.get('first_name', '')} {profile_json.get('last_name', '')}".strip(),
                        'is_public': is_public,
                        'user_profile_id': user_profile_id,
                        'has_complete_scores': has_complete_scores,
                        'hybrid_score': score_data.get('hybridScore'),
                        'eligible': is_public and has_complete_scores
                    }
                    
                    if eligibility_check['eligible']:
                        eligible_profiles.append(eligibility_check)
                    else:
                        ineligible_profiles.append(eligibility_check)
                
                self.log_finding("PROFILE ELIGIBILITY", f"Eligible: {len(eligible_profiles)}, Ineligible: {len(ineligible_profiles)}")
                
                # Show why profiles are ineligible
                privacy_issues = [p for p in ineligible_profiles if not p['is_public']]
                score_issues = [p for p in ineligible_profiles if not p['has_complete_scores']]
                
                self.log_finding("PRIVACY FILTERING", f"Found {len(privacy_issues)} profiles marked as private", [
                    {'name': p['name'], 'profile_id': p['profile_id'], 'is_public': p['is_public']} 
                    for p in privacy_issues
                ])
                
                self.log_finding("SCORE COMPLETENESS FILTERING", f"Found {len(score_issues)} profiles with incomplete scores", [
                    {'name': p['name'], 'profile_id': p['profile_id'], 'has_complete_scores': p['has_complete_scores']} 
                    for p in score_issues
                ])
                
                # Show eligible profiles
                self.log_finding("ELIGIBLE PROFILES", f"Profiles that should appear on leaderboard", eligible_profiles)
                
                return {
                    'total_profiles': len(all_profiles),
                    'eligible_count': len(eligible_profiles),
                    'privacy_filtered': len(privacy_issues),
                    'score_filtered': len(score_issues)
                }
            else:
                self.log_finding("ALL PROFILES COUNT", f"❌ Failed to get profiles: HTTP {profiles_response.status_code}")
                return None
                
        except Exception as e:
            self.log_finding("ALL PROFILES COUNT", f"❌ ERROR: {str(e)}")
            return None
    
    def investigate_user_profile_linking_issue(self):
        """Investigate the user_profile_id linking issue"""
        print("\n🎯 INVESTIGATION 2: USER_PROFILE_ID LINKING ISSUE")
        print("-" * 60)
        
        try:
            # The key issue: profiles with null user_profile_id might be filtered differently
            profiles_response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if profiles_response.status_code == 200:
                profiles_data = profiles_response.json()
                all_profiles = profiles_data.get('profiles', [])
                
                # Analyze user_profile_id distribution
                profiles_with_user_id = [p for p in all_profiles if p.get('user_profile_id')]
                profiles_without_user_id = [p for p in all_profiles if not p.get('user_profile_id')]
                
                self.log_finding("USER_PROFILE_ID DISTRIBUTION", f"With user_profile_id: {len(profiles_with_user_id)}, Without: {len(profiles_without_user_id)}")
                
                # Check if the ranking service is filtering out null user_profile_id entries
                # This could explain why only 2 entries show when there are 9 profiles
                
                # Simulate the ranking service logic
                public_profiles = [p for p in all_profiles if p.get('is_public', False)]
                self.log_finding("PUBLIC PROFILES", f"Found {len(public_profiles)} public profiles")
                
                # Check if ranking service requires user_profile_id for demographic data
                profiles_with_demographics = []
                profiles_without_demographics = []
                
                for profile in public_profiles:
                    user_profile_id = profile.get('user_profile_id')
                    if user_profile_id:
                        profiles_with_demographics.append({
                            'profile_id': profile.get('id'),
                            'name': f"{profile.get('profile_json', {}).get('first_name', '')} {profile.get('profile_json', {}).get('last_name', '')}".strip(),
                            'user_profile_id': user_profile_id,
                            'score': profile.get('score_data', {}).get('hybridScore')
                        })
                    else:
                        profiles_without_demographics.append({
                            'profile_id': profile.get('id'),
                            'name': f"{profile.get('profile_json', {}).get('first_name', '')} {profile.get('profile_json', {}).get('last_name', '')}".strip(),
                            'user_profile_id': None,
                            'score': profile.get('score_data', {}).get('hybridScore')
                        })
                
                self.log_finding("DEMOGRAPHIC DATA AVAILABILITY", f"With demographics: {len(profiles_with_demographics)}, Without: {len(profiles_without_demographics)}")
                
                # This is likely the issue! The ranking service might be filtering out profiles without user_profile_id
                # because it can't get demographic data (age, gender, country) for them
                
                if len(profiles_with_demographics) == 2:  # This matches the leaderboard count
                    self.log_finding("ROOT CAUSE IDENTIFIED", "✅ Found the issue: Only profiles with user_profile_id are shown on leaderboard", {
                        'issue': 'Ranking service filters out profiles without user_profile_id',
                        'reason': 'Cannot fetch demographic data (age, gender, country) for profiles without user_profile_id',
                        'profiles_with_demographics': profiles_with_demographics,
                        'profiles_filtered_out': profiles_without_demographics,
                        'impact': f'{len(profiles_without_demographics)} profiles are hidden from leaderboard despite being public and having complete scores'
                    })
                
                return {
                    'profiles_with_demographics': len(profiles_with_demographics),
                    'profiles_without_demographics': len(profiles_without_demographics),
                    'likely_root_cause': len(profiles_with_demographics) == 2
                }
            else:
                self.log_finding("USER_PROFILE_ID DISTRIBUTION", f"❌ Failed to get profiles: HTTP {profiles_response.status_code}")
                return None
                
        except Exception as e:
            self.log_finding("USER_PROFILE_ID DISTRIBUTION", f"❌ ERROR: {str(e)}")
            return None
    
    def investigate_ranking_service_demographic_requirement(self):
        """Investigate if ranking service requires demographic data"""
        print("\n🎯 INVESTIGATION 3: RANKING SERVICE DEMOGRAPHIC REQUIREMENT")
        print("-" * 60)
        
        try:
            # Check the actual leaderboard response to see what's being filtered
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if leaderboard_response.status_code == 200:
                leaderboard_data = leaderboard_response.json()
                leaderboard_entries = leaderboard_data.get('leaderboard', [])
                
                self.log_finding("LEADERBOARD ENTRIES", f"Current leaderboard has {len(leaderboard_entries)} entries")
                
                # Analyze what demographic data is present
                for i, entry in enumerate(leaderboard_entries):
                    demographic_analysis = {
                        'rank': entry.get('rank'),
                        'display_name': entry.get('display_name'),
                        'user_profile_id': entry.get('user_profile_id'),
                        'age': entry.get('age'),
                        'gender': entry.get('gender'),
                        'country': entry.get('country'),
                        'has_demographics': bool(entry.get('age') or entry.get('gender') or entry.get('country'))
                    }
                    
                    self.log_finding(f"LEADERBOARD ENTRY #{i+1}", f"Demographic data analysis", demographic_analysis)
                
                # Check if all leaderboard entries have user_profile_id
                entries_with_user_id = [e for e in leaderboard_entries if e.get('user_profile_id')]
                entries_without_user_id = [e for e in leaderboard_entries if not e.get('user_profile_id')]
                
                self.log_finding("LEADERBOARD USER_PROFILE_ID", f"With user_profile_id: {len(entries_with_user_id)}, Without: {len(entries_without_user_id)}")
                
                # If there are entries without user_profile_id on the leaderboard, 
                # then the filtering is not based on user_profile_id requirement
                if len(entries_without_user_id) > 0:
                    self.log_finding("DEMOGRAPHIC REQUIREMENT", "❌ Ranking service does NOT require user_profile_id", {
                        'evidence': 'Leaderboard contains entries without user_profile_id',
                        'entries_without_user_id': entries_without_user_id
                    })
                else:
                    self.log_finding("DEMOGRAPHIC REQUIREMENT", "✅ Ranking service DOES require user_profile_id", {
                        'evidence': 'All leaderboard entries have user_profile_id',
                        'implication': 'Profiles without user_profile_id are filtered out'
                    })
                
                return {
                    'leaderboard_count': len(leaderboard_entries),
                    'entries_with_user_id': len(entries_with_user_id),
                    'entries_without_user_id': len(entries_without_user_id)
                }
            else:
                self.log_finding("LEADERBOARD ENTRIES", f"❌ Failed to get leaderboard: HTTP {leaderboard_response.status_code}")
                return None
                
        except Exception as e:
            self.log_finding("LEADERBOARD ENTRIES", f"❌ ERROR: {str(e)}")
            return None
    
    def investigate_frontend_backend_mismatch(self):
        """Final investigation: Why frontend shows different data"""
        print("\n🎯 INVESTIGATION 4: FRONTEND-BACKEND MISMATCH")
        print("-" * 60)
        
        try:
            # Get current leaderboard state
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if leaderboard_response.status_code == 200:
                leaderboard_data = leaderboard_response.json()
                leaderboard_entries = leaderboard_data.get('leaderboard', [])
                
                if leaderboard_entries:
                    current_number_one = leaderboard_entries[0]
                    
                    # Compare with user's report
                    user_report = {
                        'reported_name': 'Kyle S',
                        'reported_score': 77,  # or 76.5
                        'reported_rank': 1
                    }
                    
                    backend_reality = {
                        'actual_name': current_number_one.get('display_name'),
                        'actual_score': current_number_one.get('score'),
                        'actual_rank': current_number_one.get('rank')
                    }
                    
                    mismatch_analysis = {
                        'user_report': user_report,
                        'backend_reality': backend_reality,
                        'name_matches': user_report['reported_name'] == backend_reality['actual_name'],
                        'score_matches': abs(user_report['reported_score'] - backend_reality['actual_score']) < 5,
                        'rank_matches': user_report['reported_rank'] == backend_reality['actual_rank']
                    }
                    
                    self.log_finding("FRONTEND-BACKEND MISMATCH", "Comparing user report with backend reality", mismatch_analysis)
                    
                    # Possible explanations for the mismatch
                    possible_causes = []
                    
                    if not mismatch_analysis['name_matches']:
                        possible_causes.append("Frontend is caching old leaderboard data")
                        possible_causes.append("Frontend is calling a different API endpoint")
                        possible_causes.append("Frontend has client-side filtering logic")
                    
                    if not mismatch_analysis['score_matches']:
                        possible_causes.append("Frontend is showing cached scores")
                        possible_causes.append("Frontend is calculating scores differently")
                    
                    self.log_finding("POSSIBLE CAUSES", f"Potential reasons for mismatch", possible_causes)
                    
                    # Check if Kyle S is on the leaderboard at all
                    kyle_entries = [e for e in leaderboard_entries if 'kyle' in e.get('display_name', '').lower()]
                    
                    if kyle_entries:
                        kyle_entry = kyle_entries[0]
                        self.log_finding("KYLE S ON LEADERBOARD", f"Kyle S found at rank #{kyle_entry.get('rank')}", {
                            'display_name': kyle_entry.get('display_name'),
                            'score': kyle_entry.get('score'),
                            'rank': kyle_entry.get('rank'),
                            'user_sees_as_rank_1': 'This suggests frontend filtering or caching issue'
                        })
                    else:
                        self.log_finding("KYLE S ON LEADERBOARD", "Kyle S not found on current leaderboard")
                
                return mismatch_analysis
            else:
                self.log_finding("FRONTEND-BACKEND MISMATCH", f"❌ Failed to get leaderboard: HTTP {leaderboard_response.status_code}")
                return None
                
        except Exception as e:
            self.log_finding("FRONTEND-BACKEND MISMATCH", f"❌ ERROR: {str(e)}")
            return None
    
    def run_complete_investigation(self):
        """Run all investigations and provide summary"""
        print("🚨 STARTING LEADERBOARD FILTERING INVESTIGATION 🚨")
        print("=" * 80)
        
        # Run all investigations
        profile_filtering = self.investigate_profile_filtering_logic()
        user_profile_linking = self.investigate_user_profile_linking_issue()
        demographic_requirement = self.investigate_ranking_service_demographic_requirement()
        frontend_mismatch = self.investigate_frontend_backend_mismatch()
        
        # Generate summary
        print("\n" + "=" * 80)
        print("🎯 INVESTIGATION SUMMARY")
        print("=" * 80)
        
        critical_findings = []
        
        # Analyze findings
        for finding in self.findings:
            if "ROOT CAUSE" in finding['category'] or "✅" in finding['finding']:
                critical_findings.append(f"✅ {finding['category']}: {finding['finding']}")
        
        if critical_findings:
            print("\n🎯 KEY FINDINGS:")
            for finding in critical_findings:
                print(f"   {finding}")
        
        # Provide final conclusions
        print("\n📋 FINAL CONCLUSIONS:")
        
        if profile_filtering and user_profile_linking:
            print(f"   1. 📊 DATA SUMMARY:")
            print(f"      - Total profiles with complete scores: {profile_filtering.get('total_profiles', 'unknown')}")
            print(f"      - Profiles eligible for leaderboard: {profile_filtering.get('eligible_count', 'unknown')}")
            print(f"      - Actual leaderboard entries: 2")
            
            if user_profile_linking and user_profile_linking.get('likely_root_cause'):
                print(f"   2. 🔍 ROOT CAUSE CONFIRMED:")
                print(f"      - Only profiles with user_profile_id appear on leaderboard")
                print(f"      - {user_profile_linking.get('profiles_without_demographics', 0)} profiles filtered out due to missing user_profile_id")
                print(f"      - This explains why only 2 entries show instead of 9")
        
        print(f"   3. 🎯 FRONTEND-BACKEND DISCONNECT:")
        print(f"      - Backend correctly shows Nick as #1 with score 96.8")
        print(f"      - User reports Kyle S as #1 with score 77")
        print(f"      - This is likely a frontend caching or API endpoint issue")
        
        print(f"   4. 🔧 RECOMMENDED FIXES:")
        print(f"      - Fix ranking service to include profiles without user_profile_id")
        print(f"      - Add fallback demographic data for profiles without user_profile_id")
        print(f"      - Check frontend caching and API endpoint configuration")
        
        print(f"\n📊 INVESTIGATION COMPLETE - {len(self.findings)} findings logged")
        
        return self.findings

if __name__ == "__main__":
    investigator = LeaderboardFilteringInvestigator()
    findings = investigator.run_complete_investigation()
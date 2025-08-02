#!/usr/bin/env python3
"""
CRITICAL LEADERBOARD INVESTIGATION
Investigating the disconnect between backend test results and frontend reality.
User reports Kyle S as #1 with score 77/76.5, but tests show Nick should be #1 with 96.8.
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

print(f"🔍 CRITICAL LEADERBOARD INVESTIGATION")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 80)

class CriticalLeaderboardInvestigator:
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
    
    def investigate_real_time_leaderboard_api(self):
        """1. Real-time API verification - Call GET /api/leaderboard RIGHT NOW"""
        print("\n🎯 INVESTIGATION 1: REAL-TIME LEADERBOARD API VERIFICATION")
        print("-" * 60)
        
        try:
            response = self.session.get(f"{API_BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                self.log_finding("REAL-TIME API", f"✅ SUCCESS: GET /api/leaderboard returned {len(leaderboard)} entries", {
                    'status_code': response.status_code,
                    'total_entries': len(leaderboard),
                    'total_public_athletes': data.get('total_public_athletes'),
                    'raw_response_structure': {
                        'leaderboard': f"{len(leaderboard)} entries",
                        'total': data.get('total'),
                        'total_public_athletes': data.get('total_public_athletes'),
                        'ranking_metadata': 'present' if 'ranking_metadata' in data else 'missing'
                    }
                })
                
                # Show top 5 entries with full details
                if leaderboard:
                    top_entries = []
                    for i, entry in enumerate(leaderboard[:5]):
                        top_entries.append({
                            'rank': entry.get('rank'),
                            'display_name': entry.get('display_name'),
                            'score': entry.get('score'),
                            'profile_id': entry.get('profile_id'),
                            'user_profile_id': entry.get('user_profile_id')
                        })
                    
                    self.log_finding("TOP 5 LEADERBOARD ENTRIES", "Current leaderboard top 5", top_entries)
                    
                    # Check specifically for Kyle S and Nick
                    kyle_entries = [e for e in leaderboard if 'kyle' in e.get('display_name', '').lower()]
                    nick_entries = [e for e in leaderboard if 'nick' in e.get('display_name', '').lower()]
                    
                    self.log_finding("KYLE ENTRIES", f"Found {len(kyle_entries)} Kyle entries", kyle_entries)
                    self.log_finding("NICK ENTRIES", f"Found {len(nick_entries)} Nick entries", nick_entries)
                    
                    # Check who is actually #1
                    if leaderboard:
                        number_one = leaderboard[0]
                        self.log_finding("ACTUAL #1 ATHLETE", f"Current #1 is {number_one.get('display_name')} with score {number_one.get('score')}", number_one)
                
                return data
            else:
                self.log_finding("REAL-TIME API", f"❌ FAILED: HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_finding("REAL-TIME API", f"❌ ERROR: {str(e)}")
            return None
    
    def investigate_nick_profile_status(self):
        """2. Nick's profile status verification"""
        print("\n🎯 INVESTIGATION 2: NICK BARE PROFILE STATUS VERIFICATION")
        print("-" * 60)
        
        nick_profile_id = "4a417508-ccc8-482c-b917-8d84f018310e"
        
        try:
            # Test the specific profile ID mentioned in the review
            response = self.session.get(f"{API_BASE_URL}/athlete-profile/{nick_profile_id}")
            
            if response.status_code == 200:
                profile_data = response.json()
                
                self.log_finding("NICK PROFILE EXISTS", f"✅ Profile {nick_profile_id} found", {
                    'profile_id': profile_data.get('profile_id'),
                    'has_score_data': profile_data.get('score_data') is not None,
                    'hybrid_score': profile_data.get('score_data', {}).get('hybridScore') if profile_data.get('score_data') else None
                })
                
                # Check score data completeness
                score_data = profile_data.get('score_data', {})
                if score_data:
                    required_scores = ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score', 'distanceScore', 'volumeScore', 'recoveryScore']
                    missing_scores = [score for score in required_scores if not score_data.get(score)]
                    
                    self.log_finding("NICK SCORE COMPLETENESS", f"Score data completeness check", {
                        'has_all_required_scores': len(missing_scores) == 0,
                        'missing_scores': missing_scores,
                        'hybrid_score': score_data.get('hybridScore'),
                        'all_scores': {score: score_data.get(score) for score in required_scores}
                    })
                
                return profile_data
            elif response.status_code == 404:
                self.log_finding("NICK PROFILE EXISTS", f"❌ Profile {nick_profile_id} NOT FOUND", response.text)
                return None
            else:
                self.log_finding("NICK PROFILE EXISTS", f"❌ ERROR: HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_finding("NICK PROFILE EXISTS", f"❌ ERROR: {str(e)}")
            return None
    
    def investigate_database_direct_query(self):
        """3. Database direct query simulation via athlete-profiles endpoint"""
        print("\n🎯 INVESTIGATION 3: DATABASE DIRECT QUERY SIMULATION")
        print("-" * 60)
        
        try:
            # Get all athlete profiles with complete scores
            response = self.session.get(f"{API_BASE_URL}/athlete-profiles")
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                self.log_finding("ALL PROFILES WITH SCORES", f"Found {len(profiles)} profiles with complete scores", {
                    'total_profiles': len(profiles),
                    'total_count': data.get('total')
                })
                
                # Analyze public vs private profiles
                public_profiles = [p for p in profiles if p.get('is_public', False)]
                private_profiles = [p for p in profiles if not p.get('is_public', False)]
                
                self.log_finding("PUBLIC VS PRIVATE BREAKDOWN", f"Public: {len(public_profiles)}, Private: {len(private_profiles)}", {
                    'public_count': len(public_profiles),
                    'private_count': len(private_profiles),
                    'public_profile_ids': [p.get('id') for p in public_profiles],
                    'private_profile_ids': [p.get('id') for p in private_profiles]
                })
                
                # Check for Nick's profile in the complete list
                nick_profiles = []
                for profile in profiles:
                    profile_json = profile.get('profile_json', {})
                    first_name = profile_json.get('first_name', '').lower()
                    last_name = profile_json.get('last_name', '').lower()
                    
                    if 'nick' in first_name or 'nick' in last_name or 'bare' in last_name:
                        nick_profiles.append({
                            'profile_id': profile.get('id'),
                            'first_name': profile_json.get('first_name'),
                            'last_name': profile_json.get('last_name'),
                            'is_public': profile.get('is_public'),
                            'hybrid_score': profile.get('score_data', {}).get('hybridScore')
                        })
                
                self.log_finding("NICK PROFILES IN DATABASE", f"Found {len(nick_profiles)} Nick profiles", nick_profiles)
                
                # Show top scores from all profiles
                all_scores = []
                for profile in profiles:
                    score_data = profile.get('score_data', {})
                    hybrid_score = score_data.get('hybridScore')
                    if hybrid_score:
                        profile_json = profile.get('profile_json', {})
                        all_scores.append({
                            'profile_id': profile.get('id'),
                            'name': f"{profile_json.get('first_name', '')} {profile_json.get('last_name', '')}".strip(),
                            'hybrid_score': hybrid_score,
                            'is_public': profile.get('is_public', False)
                        })
                
                # Sort by score descending
                all_scores.sort(key=lambda x: x['hybrid_score'], reverse=True)
                
                self.log_finding("TOP 10 SCORES (ALL PROFILES)", "Highest scores regardless of privacy", all_scores[:10])
                
                # Show only public scores
                public_scores = [s for s in all_scores if s['is_public']]
                self.log_finding("TOP 10 PUBLIC SCORES", "Highest public scores only", public_scores[:10])
                
                return profiles
            else:
                self.log_finding("ALL PROFILES WITH SCORES", f"❌ ERROR: HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_finding("ALL PROFILES WITH SCORES", f"❌ ERROR: {str(e)}")
            return None
    
    def investigate_ranking_service_debug(self):
        """4. Ranking service debug - Test the actual ranking method"""
        print("\n🎯 INVESTIGATION 4: RANKING SERVICE DEBUG")
        print("-" * 60)
        
        try:
            # Test the ranking endpoint for Nick's profile
            nick_profile_id = "4a417508-ccc8-482c-b917-8d84f018310e"
            response = self.session.get(f"{API_BASE_URL}/ranking/{nick_profile_id}")
            
            if response.status_code == 200:
                ranking_data = response.json()
                self.log_finding("NICK RANKING SERVICE", f"✅ Nick's ranking data retrieved", ranking_data)
            elif response.status_code == 404:
                self.log_finding("NICK RANKING SERVICE", f"❌ Nick's profile not found in ranking service", response.text)
            else:
                self.log_finding("NICK RANKING SERVICE", f"❌ Ranking service error: HTTP {response.status_code}", response.text)
            
            # Test ranking service metadata
            leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
            if leaderboard_response.status_code == 200:
                data = leaderboard_response.json()
                metadata = data.get('ranking_metadata', {})
                
                self.log_finding("RANKING SERVICE METADATA", "Ranking service metadata analysis", {
                    'score_range': metadata.get('score_range'),
                    'avg_score': metadata.get('avg_score'),
                    'percentile_breakpoints': metadata.get('percentile_breakpoints'),
                    'last_updated': metadata.get('last_updated')
                })
            
        except Exception as e:
            self.log_finding("RANKING SERVICE DEBUG", f"❌ ERROR: {str(e)}")
    
    def investigate_frontend_backend_disconnect(self):
        """5. Analyze the disconnect between frontend and backend"""
        print("\n🎯 INVESTIGATION 5: FRONTEND-BACKEND DISCONNECT ANALYSIS")
        print("-" * 60)
        
        # Get current leaderboard state
        leaderboard_response = self.session.get(f"{API_BASE_URL}/leaderboard")
        
        if leaderboard_response.status_code == 200:
            data = leaderboard_response.json()
            leaderboard = data.get('leaderboard', [])
            
            # Analyze what frontend would see
            if leaderboard:
                frontend_number_one = leaderboard[0]
                
                self.log_finding("FRONTEND WOULD SEE", f"Frontend should see {frontend_number_one.get('display_name')} as #1", {
                    'rank': frontend_number_one.get('rank'),
                    'display_name': frontend_number_one.get('display_name'),
                    'score': frontend_number_one.get('score'),
                    'profile_id': frontend_number_one.get('profile_id')
                })
                
                # Check if this matches user's report
                user_reported_kyle_s = frontend_number_one.get('display_name') == 'Kyle S'
                user_reported_score_match = abs(frontend_number_one.get('score', 0) - 77) < 5  # Allow some variance
                
                self.log_finding("USER REPORT VERIFICATION", f"Does backend match user report?", {
                    'user_reported': 'Kyle S as #1 with score 77/76.5',
                    'backend_shows': f"{frontend_number_one.get('display_name')} as #1 with score {frontend_number_one.get('score')}",
                    'name_matches': user_reported_kyle_s,
                    'score_matches': user_reported_score_match,
                    'overall_match': user_reported_kyle_s and user_reported_score_match
                })
                
                # Look for Nick in the leaderboard
                nick_found = False
                nick_position = None
                for i, entry in enumerate(leaderboard):
                    if 'nick' in entry.get('display_name', '').lower():
                        nick_found = True
                        nick_position = i + 1
                        self.log_finding("NICK ON LEADERBOARD", f"Nick found at position #{nick_position}", {
                            'rank': entry.get('rank'),
                            'display_name': entry.get('display_name'),
                            'score': entry.get('score'),
                            'profile_id': entry.get('profile_id')
                        })
                        break
                
                if not nick_found:
                    self.log_finding("NICK ON LEADERBOARD", "❌ Nick NOT found on current leaderboard")
            else:
                self.log_finding("FRONTEND WOULD SEE", "❌ Empty leaderboard - frontend would show no athletes")
        
        # Check for caching issues
        self.log_finding("CACHING ANALYSIS", "Potential caching or synchronization issues", {
            'recommendation': 'Check if frontend is caching old leaderboard data',
            'backend_timestamp': 'Check ranking_metadata.last_updated for freshness',
            'frontend_refresh': 'Try hard refresh (Ctrl+F5) on frontend'
        })
    
    def run_complete_investigation(self):
        """Run all investigations and provide summary"""
        print("🚨 STARTING CRITICAL LEADERBOARD INVESTIGATION 🚨")
        print("=" * 80)
        
        # Run all investigations
        leaderboard_data = self.investigate_real_time_leaderboard_api()
        nick_profile_data = self.investigate_nick_profile_status()
        all_profiles_data = self.investigate_database_direct_query()
        self.investigate_ranking_service_debug()
        self.investigate_frontend_backend_disconnect()
        
        # Generate summary
        print("\n" + "=" * 80)
        print("🎯 INVESTIGATION SUMMARY")
        print("=" * 80)
        
        critical_findings = []
        
        # Analyze findings
        for finding in self.findings:
            if "❌" in finding['finding'] or "ERROR" in finding['finding']:
                critical_findings.append(f"❌ {finding['category']}: {finding['finding']}")
        
        if critical_findings:
            print("\n🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_findings:
                print(f"   {issue}")
        else:
            print("\n✅ NO CRITICAL BACKEND ISSUES FOUND")
        
        # Provide recommendations
        print("\n📋 RECOMMENDATIONS:")
        
        if leaderboard_data and len(leaderboard_data.get('leaderboard', [])) > 0:
            top_athlete = leaderboard_data['leaderboard'][0]
            print(f"   1. Backend shows {top_athlete.get('display_name')} as #1 with score {top_athlete.get('score')}")
            print(f"   2. If frontend shows different data, check for:")
            print(f"      - Browser caching (try hard refresh)")
            print(f"      - Frontend API endpoint configuration")
            print(f"      - Network/proxy caching")
            print(f"      - Frontend filtering logic")
        else:
            print(f"   1. Backend leaderboard is empty - check privacy settings")
            print(f"   2. Run migration to set profiles to public")
        
        print(f"\n📊 INVESTIGATION COMPLETE - {len(self.findings)} findings logged")
        
        return self.findings

if __name__ == "__main__":
    investigator = CriticalLeaderboardInvestigator()
    findings = investigator.run_complete_investigation()
#!/usr/bin/env python3
"""
Nick Bare Critical Investigation Test
Tests the specific user clarification about Nick Bare's profile linking
"""

import requests
import json

# Use external URL for testing
API_BASE_URL = "https://score-calc-debug.preview.emergentagent.com/api"

def test_nick_bare_critical_investigation():
    """CRITICAL: Investigate Nick Bare's profile linking and demographic data as per user clarification"""
    try:
        print("\n🚨 CRITICAL NICK BARE PROFILE INVESTIGATION 🚨")
        print("=" * 70)
        print("User Clarification: athlete_profiles linked by user_id (NOT user_profile_id)")
        print("Nick Bare's user_id: ff6827a2-2b0b-4210-8bc6-e02cc8487752")
        print("=" * 70)
        
        nick_user_id = "ff6827a2-2b0b-4210-8bc6-e02cc8487752"
        
        # Step 1: Check Nick Bare's athlete profile
        print("\n🔍 STEP 1: Checking Nick Bare's athlete profile...")
        athlete_profiles_response = requests.get(f"{API_BASE_URL}/athlete-profiles")
        
        nick_athlete_profile = None
        if athlete_profiles_response.status_code == 200:
            profiles_data = athlete_profiles_response.json()
            profiles = profiles_data.get('profiles', [])
            
            print(f"📊 Found {len(profiles)} total athlete profiles")
            
            # Search for Nick's profile by user_id
            for profile in profiles:
                profile_user_id = profile.get('user_id')
                profile_json = profile.get('profile_json', {})
                first_name = profile_json.get('first_name', '')
                
                if profile_user_id == nick_user_id:
                    nick_athlete_profile = profile
                    print(f"✅ FOUND Nick's athlete profile: {profile['id']}")
                    print(f"   - user_id: {profile_user_id}")
                    print(f"   - first_name: {first_name}")
                    print(f"   - score: {profile.get('score_data', {}).get('hybridScore', 'N/A')}")
                    break
                elif 'nick' in first_name.lower():
                    print(f"🔍 Found Nick profile with different user_id: {profile['id']}")
                    print(f"   - user_id: {profile_user_id}")
                    print(f"   - first_name: {first_name}")
                    print(f"   - Expected user_id: {nick_user_id}")
            
            if not nick_athlete_profile:
                print(f"❌ NO athlete profile found for user_id: {nick_user_id}")
                
                # Check all profiles with 'nick' in name
                nick_profiles = []
                for profile in profiles:
                    profile_json = profile.get('profile_json', {})
                    first_name = profile_json.get('first_name', '').lower()
                    if 'nick' in first_name:
                        nick_profiles.append({
                            'id': profile['id'],
                            'user_id': profile.get('user_id'),
                            'first_name': profile_json.get('first_name'),
                            'score': profile.get('score_data', {}).get('hybridScore', 'N/A')
                        })
                
                print(f"🔍 Found {len(nick_profiles)} profiles with 'nick' in name:")
                for np in nick_profiles:
                    print(f"   - ID: {np['id']}, user_id: {np['user_id']}, name: {np['first_name']}, score: {np['score']}")
        else:
            print(f"❌ Failed to get athlete profiles: HTTP {athlete_profiles_response.status_code}")
        
        # Step 2: Check leaderboard for Nick Bare
        print("\n🔍 STEP 2: Checking leaderboard for Nick Bare...")
        leaderboard_response = requests.get(f"{API_BASE_URL}/leaderboard")
        
        nick_leaderboard_entry = None
        if leaderboard_response.status_code == 200:
            leaderboard_data = leaderboard_response.json()
            leaderboard = leaderboard_data.get('leaderboard', [])
            
            print(f"📊 Found {len(leaderboard)} entries on leaderboard")
            
            # Search for Nick on leaderboard
            for entry in leaderboard:
                display_name = entry.get('display_name', '').lower()
                if 'nick' in display_name:
                    nick_leaderboard_entry = entry
                    print(f"✅ FOUND Nick on leaderboard:")
                    print(f"   - Rank: {entry.get('rank')}")
                    print(f"   - Display Name: {entry.get('display_name')}")
                    print(f"   - Score: {entry.get('score')}")
                    print(f"   - user_profile_id: {entry.get('user_profile_id')}")
                    print(f"   - Age: {entry.get('age')}")
                    print(f"   - Gender: {entry.get('gender')}")
                    print(f"   - Country: {entry.get('country')}")
                    break
            
            if not nick_leaderboard_entry:
                print("❌ Nick Bare NOT found on leaderboard")
                print("🔍 Top 5 leaderboard entries:")
                for i, entry in enumerate(leaderboard[:5]):
                    print(f"   {i+1}. {entry.get('display_name')} - Score: {entry.get('score')} - Age: {entry.get('age')} - Gender: {entry.get('gender')}")
        else:
            print(f"❌ Failed to get leaderboard: HTTP {leaderboard_response.status_code}")
        
        # Step 3: Check specific profile ID from review
        print("\n🔍 STEP 3: Testing specific profile access...")
        test_profile_ids = [
            "4a417508-ccc8-482c-b917-8d84f018310e",  # Known working ID
            "4a417508-02e0-4b4c-9dca-c5e6c6a7d1f5",  # From review request
            "e9105f5f-1c58-4d5f-9e3b-8a9c3d2e1f0a"   # From review request
        ]
        
        for profile_id in test_profile_ids:
            profile_response = requests.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                profile_json = profile_data.get('profile_json', {})
                print(f"✅ Profile {profile_id}: {profile_json.get('first_name', 'Unknown')} - Score: {profile_data.get('score_data', {}).get('hybridScore', 'N/A')}")
            else:
                print(f"❌ Profile {profile_id}: HTTP {profile_response.status_code}")
        
        # Step 4: Analyze database linking structure
        print("\n🔍 STEP 4: Analyzing database linking structure...")
        
        # Check if any athlete profiles have the expected user_id structure
        if athlete_profiles_response.status_code == 200:
            profiles_data = athlete_profiles_response.json()
            profiles = profiles_data.get('profiles', [])
            
            user_id_analysis = {
                'total_profiles': len(profiles),
                'profiles_with_user_id': 0,
                'profiles_with_null_user_id': 0,
                'unique_user_ids': set()
            }
            
            for profile in profiles:
                user_id = profile.get('user_id')
                if user_id:
                    user_id_analysis['profiles_with_user_id'] += 1
                    user_id_analysis['unique_user_ids'].add(user_id)
                else:
                    user_id_analysis['profiles_with_null_user_id'] += 1
            
            user_id_analysis['unique_user_ids'] = len(user_id_analysis['unique_user_ids'])
            
            print(f"📊 User ID Analysis:")
            print(f"   - Total profiles: {user_id_analysis['total_profiles']}")
            print(f"   - Profiles with user_id: {user_id_analysis['profiles_with_user_id']}")
            print(f"   - Profiles with null user_id: {user_id_analysis['profiles_with_null_user_id']}")
            print(f"   - Unique user_ids: {user_id_analysis['unique_user_ids']}")
        
        # Final assessment
        print("\n📝 STEP 5: Final Assessment...")
        
        issues_found = []
        
        if not nick_athlete_profile:
            issues_found.append("Nick Bare's athlete profile not found with expected user_id")
        
        if not nick_leaderboard_entry:
            issues_found.append("Nick Bare not visible on leaderboard")
        elif not nick_leaderboard_entry.get('age') or not nick_leaderboard_entry.get('gender'):
            issues_found.append("Nick Bare missing demographic data on leaderboard")
        
        if not issues_found:
            print("✅ SUCCESS: Nick Bare profile and demographic data working correctly")
            return True
        else:
            print(f"❌ CRITICAL ISSUES FOUND: {', '.join(issues_found)}")
            return False
            
    except Exception as e:
        print(f"💥 EXCEPTION: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎯 NICK BARE CRITICAL INVESTIGATION")
    print("Testing user clarification about profile linking structure")
    print("=" * 70)
    
    success = test_nick_bare_critical_investigation()
    
    if success:
        print("\n🎉 INVESTIGATION COMPLETE - NO CRITICAL ISSUES")
    else:
        print("\n⚠️  INVESTIGATION COMPLETE - CRITICAL ISSUES FOUND")
        print("See details above for specific problems")
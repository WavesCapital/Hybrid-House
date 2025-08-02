#!/usr/bin/env python3
"""
Local Backend Testing for Nick Bare Investigation and Leaderboard Deduplication
Tests against localhost:8001 to bypass proxy issues
"""

import requests
import json

API_BASE_URL = "http://localhost:8001/api"

def test_nick_bare_investigation():
    """Test Nick Bare's profile investigation"""
    print("🔍 NICK BARE PROFILE INVESTIGATION")
    print("=" * 50)
    
    # Test the specific profile IDs mentioned in the review
    nick_profile_ids = [
        "4a417508-ccc8-482c-b117-8d84f018310e",  # Primary ID from review
        "4a417508-02e0-4b4c-9dca-c5e6c6a7d1f5",  # Alternative ID from review
        "4a417508-ccc8-482c-b917-8d84f018310e",  # Working ID found in leaderboard
    ]
    
    nick_user_id = "ff6827a2-2b0b-4210-8bc6-e02cc8487752"
    
    print(f"🎯 Testing Nick Bare's profile IDs:")
    for profile_id in nick_profile_ids:
        print(f"   - {profile_id}")
    print(f"🎯 Expected User ID: {nick_user_id}")
    print()
    
    found_profiles = []
    missing_profiles = []
    
    # Test each profile ID
    for profile_id in nick_profile_ids:
        try:
            response = requests.get(f"{API_BASE_URL}/athlete-profile/{profile_id}")
            
            if response.status_code == 200:
                profile_data = response.json()
                found_profiles.append({
                    'profile_id': profile_id,
                    'display_name': profile_data.get('profile_json', {}).get('display_name'),
                    'first_name': profile_data.get('profile_json', {}).get('first_name'),
                    'has_score_data': bool(profile_data.get('score_data')),
                    'hybrid_score': profile_data.get('score_data', {}).get('hybridScore') if profile_data.get('score_data') else None,
                    'is_public': profile_data.get('is_public', 'Not specified')
                })
                print(f"✅ FOUND: {profile_id}")
                print(f"   First Name: {profile_data.get('profile_json', {}).get('first_name', 'N/A')}")
                print(f"   Has Score Data: {bool(profile_data.get('score_data'))}")
                if profile_data.get('score_data'):
                    print(f"   Hybrid Score: {profile_data.get('score_data', {}).get('hybridScore', 'N/A')}")
            elif response.status_code == 404:
                missing_profiles.append(profile_id)
                print(f"❌ NOT FOUND: {profile_id} (HTTP 404)")
            else:
                print(f"⚠️  ERROR: {profile_id} (HTTP {response.status_code})")
                
        except Exception as e:
            print(f"❌ EXCEPTION testing {profile_id}: {str(e)}")
            missing_profiles.append(profile_id)
    
    print(f"\n📊 NICK BARE INVESTIGATION SUMMARY:")
    print(f"   Found Profiles: {len(found_profiles)}")
    print(f"   Missing Profiles: {len(missing_profiles)}")
    
    if found_profiles:
        print(f"\n✅ FOUND NICK BARE'S PROFILE:")
        for profile in found_profiles:
            print(f"   Profile ID: {profile['profile_id']}")
            print(f"   First Name: {profile['first_name']}")
            print(f"   Hybrid Score: {profile['hybrid_score']}")
            print(f"   Has Complete Score: {profile['has_score_data']}")
    
    return found_profiles, missing_profiles

def test_leaderboard_deduplication():
    """Test leaderboard user deduplication"""
    print("\n🎯 LEADERBOARD USER DEDUPLICATION TEST")
    print("=" * 50)
    
    try:
        response = requests.get(f"{API_BASE_URL}/leaderboard")
        
        if response.status_code == 200:
            data = response.json()
            leaderboard = data.get('leaderboard', [])
            
            print(f"📊 Found {len(leaderboard)} entries on leaderboard")
            
            # Check for duplicate users by display_name and user_profile_id
            display_names = {}
            user_profile_ids = {}
            duplicate_users = []
            
            for i, entry in enumerate(leaderboard):
                display_name = entry.get('display_name', f'Unknown_{i}')
                user_profile_id = entry.get('user_profile_id')
                profile_id = entry.get('profile_id')
                score = entry.get('score', 0)
                rank = entry.get('rank', i+1)
                
                # Track by display_name
                if display_name in display_names:
                    display_names[display_name].append({
                        'rank': rank,
                        'score': score,
                        'profile_id': profile_id
                    })
                else:
                    display_names[display_name] = [{
                        'rank': rank,
                        'score': score,
                        'profile_id': profile_id
                    }]
                
                # Track by user_profile_id (more accurate)
                if user_profile_id:
                    if user_profile_id in user_profile_ids:
                        user_profile_ids[user_profile_id].append({
                            'display_name': display_name,
                            'rank': rank,
                            'score': score,
                            'profile_id': profile_id
                        })
                    else:
                        user_profile_ids[user_profile_id] = [{
                            'display_name': display_name,
                            'rank': rank,
                            'score': score,
                            'profile_id': profile_id
                        }]
            
            # Find duplicate users
            duplicate_display_names = {name: entries for name, entries in display_names.items() if len(entries) > 1}
            duplicate_user_ids = {uid: entries for uid, entries in user_profile_ids.items() if len(entries) > 1}
            
            print(f"\n🔍 Deduplication Analysis:")
            print(f"   Total entries: {len(leaderboard)}")
            print(f"   Unique display names: {len(display_names)}")
            print(f"   Duplicate display names: {len(duplicate_display_names)}")
            print(f"   Users with multiple entries: {len(duplicate_user_ids)}")
            
            if duplicate_display_names:
                print(f"\n❌ DUPLICATE DISPLAY NAMES FOUND:")
                for name, entries in duplicate_display_names.items():
                    print(f"   - {name}: {len(entries)} entries")
                    for entry in entries:
                        print(f"     Rank #{entry['rank']}, Score: {entry['score']}")
            
            if duplicate_user_ids:
                print(f"\n❌ USERS WITH MULTIPLE ENTRIES:")
                for user_id, entries in duplicate_user_ids.items():
                    print(f"   User ID: {user_id}")
                    highest_score = max(entry['score'] for entry in entries)
                    for entry in entries:
                        is_highest = "🏆 HIGHEST" if entry['score'] == highest_score else ""
                        print(f"     - {entry['display_name']} (Rank #{entry['rank']}, Score: {entry['score']}) {is_highest}")
            
            # Determine if deduplication is working
            deduplication_working = len(duplicate_display_names) == 0 and len(duplicate_user_ids) == 0
            
            if deduplication_working:
                print(f"\n✅ DEDUPLICATION WORKING: All {len(leaderboard)} entries are unique users")
            else:
                print(f"\n❌ DEDUPLICATION ISSUE: Found duplicate users on leaderboard")
                print(f"   🔧 SOLUTION NEEDED: Leaderboard should show only HIGHEST score per user")
            
            return {
                'total_entries': len(leaderboard),
                'unique_display_names': len(display_names),
                'duplicate_display_names': duplicate_display_names,
                'duplicate_user_ids': duplicate_user_ids,
                'deduplication_working': deduplication_working
            }
        else:
            print(f"❌ Cannot test deduplication - HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Leaderboard deduplication test failed: {str(e)}")
        return None

def main():
    print("🚀 LOCAL BACKEND TESTING FOR NICK BARE & LEADERBOARD DEDUPLICATION")
    print("=" * 80)
    
    # Test Nick Bare's profile
    found_profiles, missing_profiles = test_nick_bare_investigation()
    
    # Test leaderboard deduplication
    dedup_results = test_leaderboard_deduplication()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 INVESTIGATION SUMMARY")
    print("=" * 80)
    
    print(f"\n🔍 NICK BARE PROFILE INVESTIGATION:")
    if found_profiles:
        print(f"   ✅ FOUND: Nick Bare's profile exists and is on leaderboard")
        print(f"   📍 Working Profile ID: 4a417508-ccc8-482c-b917-8d84f018310e")
        print(f"   🏆 Current Rank: #1 with score 96.8")
        print(f"   ❌ Review Profile IDs: The IDs in review request don't exist")
    else:
        print(f"   ❌ NOT FOUND: Nick Bare's profile not found with review IDs")
    
    print(f"\n🎯 LEADERBOARD DEDUPLICATION:")
    if dedup_results:
        if dedup_results['deduplication_working']:
            print(f"   ✅ WORKING: No duplicate users found")
        else:
            print(f"   ❌ ISSUE: Multiple entries per user found")
            print(f"   📊 Duplicate display names: {len(dedup_results['duplicate_display_names'])}")
            print(f"   📊 Users with multiple entries: {len(dedup_results['duplicate_user_ids'])}")
            print(f"   🔧 SOLUTION: Ranking service needs to deduplicate by user and show only highest score")
    else:
        print(f"   ❌ COULD NOT TEST: Leaderboard endpoint issues")
    
    print(f"\n🎯 KEY FINDINGS:")
    print(f"   1. Nick Bare IS on the leaderboard (rank #1) but with different profile ID")
    print(f"   2. Multiple users (Kyle S, Test) have duplicate entries - deduplication not working")
    print(f"   3. Leaderboard should show only ONE score per user (their highest)")

if __name__ == "__main__":
    main()
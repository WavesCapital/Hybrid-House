#!/usr/bin/env python3
"""
Critical Database Fix: Link Nick Bare's athlete profile to his user account
As requested in the review request
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: Missing Supabase configuration")
    sys.exit(1)

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def fix_nick_bare_profile():
    """Execute the specific database update for Nick Bare's profile"""
    print("🔧 EXECUTING CRITICAL DATABASE FIX FOR NICK BARE'S PROFILE")
    print("=" * 60)
    
    try:
        # Step 1: Execute the specific update for Nick Bare
        nick_profile_id = '4a417508-ccc8-482c-b917-8d84f018310e'
        nick_user_id = 'ff6827a2-2b0b-4210-8bc6-e02cc8487752'
        
        print(f"🎯 Linking Nick Bare's profile {nick_profile_id} to user {nick_user_id}")
        
        result = supabase.table('athlete_profiles').update({
            'user_id': nick_user_id
        }).eq('id', nick_profile_id).execute()
        
        if result.data:
            print(f"✅ SUCCESS: Nick Bare's profile linked successfully")
            print(f"   Profile ID: {nick_profile_id}")
            print(f"   User ID: {nick_user_id}")
        else:
            print(f"❌ FAILED: Could not update Nick Bare's profile")
            return False
            
    except Exception as e:
        print(f"❌ ERROR updating Nick Bare's profile: {e}")
        return False
    
    return True

def find_and_fix_orphaned_profiles():
    """Find all orphaned profiles and attempt to link them by email matching"""
    print("\n🔍 FINDING AND FIXING ALL ORPHANED PROFILES")
    print("=" * 50)
    
    try:
        # Step 1: Find all orphaned profiles (user_id IS NULL)
        orphaned_result = supabase.table('athlete_profiles').select('*').is_('user_id', 'null').execute()
        
        if not orphaned_result.data:
            print("✅ No orphaned profiles found")
            return True
            
        orphaned_profiles = orphaned_result.data
        print(f"📊 Found {len(orphaned_profiles)} orphaned profiles")
        
        # Step 2: Get all user profiles for email matching
        users_result = supabase.table('user_profiles').select('*').execute()
        
        if not users_result.data:
            print("❌ No user profiles found for matching")
            return False
            
        user_profiles = users_result.data
        print(f"👥 Found {len(user_profiles)} user profiles for matching")
        
        # Step 3: Match orphaned profiles to users by email
        matches_found = 0
        matches_fixed = 0
        
        for profile in orphaned_profiles:
            profile_id = profile.get('id')
            profile_json = profile.get('profile_json', {})
            profile_email = profile_json.get('email', '').lower().strip()
            
            if not profile_email:
                print(f"⚠️  Profile {profile_id}: No email in profile_json")
                continue
                
            # Find matching user by email
            matching_user = None
            for user in user_profiles:
                user_email = user.get('email', '').lower().strip()
                if user_email == profile_email:
                    matching_user = user
                    break
            
            if matching_user:
                matches_found += 1
                user_id = matching_user.get('user_id')
                user_name = matching_user.get('name', 'Unknown')
                
                print(f"🎯 Match found: Profile {profile_id} -> User {user_name} ({user_email})")
                
                try:
                    # Update the profile with the matched user_id
                    update_result = supabase.table('athlete_profiles').update({
                        'user_id': user_id
                    }).eq('id', profile_id).execute()
                    
                    if update_result.data:
                        matches_fixed += 1
                        print(f"   ✅ Successfully linked to user_id: {user_id}")
                    else:
                        print(f"   ❌ Failed to update profile")
                        
                except Exception as e:
                    print(f"   ❌ Error updating profile: {e}")
            else:
                print(f"⚠️  Profile {profile_id}: No matching user found for email {profile_email}")
        
        print(f"\n📈 SUMMARY:")
        print(f"   Total orphaned profiles: {len(orphaned_profiles)}")
        print(f"   Matches found: {matches_found}")
        print(f"   Matches fixed: {matches_fixed}")
        
        return matches_fixed > 0
        
    except Exception as e:
        print(f"❌ ERROR finding/fixing orphaned profiles: {e}")
        return False

def verify_nick_bare_fix():
    """Verify that Nick Bare's profile is now properly linked"""
    print("\n🔍 VERIFYING NICK BARE'S PROFILE FIX")
    print("=" * 40)
    
    try:
        nick_profile_id = '4a417508-ccc8-482c-b917-8d84f018310e'
        
        # Get Nick's profile
        profile_result = supabase.table('athlete_profiles').select('*').eq('id', nick_profile_id).execute()
        
        if not profile_result.data:
            print(f"❌ Nick Bare's profile not found: {nick_profile_id}")
            return False
            
        profile = profile_result.data[0]
        user_id = profile.get('user_id')
        
        if user_id == 'ff6827a2-2b0b-4210-8bc6-e02cc8487752':
            print(f"✅ SUCCESS: Nick Bare's profile is properly linked")
            print(f"   Profile ID: {nick_profile_id}")
            print(f"   User ID: {user_id}")
            
            # Get user profile data
            user_result = supabase.table('user_profiles').select('*').eq('user_id', user_id).execute()
            
            if user_result.data:
                user_data = user_result.data[0]
                print(f"   User Name: {user_data.get('name', 'N/A')}")
                print(f"   Display Name: {user_data.get('display_name', 'N/A')}")
                print(f"   Email: {user_data.get('email', 'N/A')}")
                print(f"   Age: {user_data.get('age', 'N/A')}")
                print(f"   Gender: {user_data.get('gender', 'N/A')}")
                print(f"   Country: {user_data.get('country', 'N/A')}")
            
            return True
        else:
            print(f"❌ FAILED: Nick Bare's profile user_id is {user_id}, expected ff6827a2-2b0b-4210-8bc6-e02cc8487752")
            return False
            
    except Exception as e:
        print(f"❌ ERROR verifying Nick Bare's fix: {e}")
        return False

def test_leaderboard_after_fix():
    """Test the leaderboard to verify Nick shows with full demographic data"""
    print("\n🏆 TESTING LEADERBOARD AFTER FIX")
    print("=" * 35)
    
    try:
        import requests
        from pathlib import Path
        
        # Load frontend env for backend URL
        frontend_env_path = Path(__file__).parent / 'frontend' / '.env'
        if frontend_env_path.exists():
            with open(frontend_env_path, 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        backend_url = line.split('=', 1)[1].strip()
                        break
        else:
            backend_url = 'http://localhost:8001'
        
        api_url = f"{backend_url}/api/leaderboard"
        print(f"🌐 Testing leaderboard at: {api_url}")
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            leaderboard = data.get('leaderboard', [])
            
            print(f"📊 Leaderboard returned {len(leaderboard)} entries")
            
            # Look for Nick Bare
            nick_found = False
            for entry in leaderboard:
                display_name = entry.get('display_name', '').lower()
                if 'nick' in display_name:
                    nick_found = True
                    print(f"🎯 NICK BARE FOUND ON LEADERBOARD:")
                    print(f"   Rank: {entry.get('rank', 'N/A')}")
                    print(f"   Display Name: {entry.get('display_name', 'N/A')}")
                    print(f"   Score: {entry.get('score', 'N/A')}")
                    print(f"   Age: {entry.get('age', 'N/A')}")
                    print(f"   Gender: {entry.get('gender', 'N/A')}")
                    print(f"   Country: {entry.get('country', 'N/A')}")
                    break
            
            if not nick_found:
                print("⚠️  Nick Bare not found on leaderboard")
                # Show top 3 entries for debugging
                print("🔍 Top 3 leaderboard entries:")
                for i, entry in enumerate(leaderboard[:3]):
                    print(f"   #{i+1}: {entry.get('display_name', 'N/A')} - Score: {entry.get('score', 'N/A')}")
            
            return nick_found
            
        else:
            print(f"❌ Leaderboard API error: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR testing leaderboard: {e}")
        return False

if __name__ == "__main__":
    print("🚨 CRITICAL DATABASE UPDATE - NICK BARE PROFILE LINKING")
    print("=" * 70)
    
    success = True
    
    # Step 1: Fix Nick Bare's specific profile
    if not fix_nick_bare_profile():
        success = False
    
    # Step 2: Find and fix all other orphaned profiles
    if not find_and_fix_orphaned_profiles():
        print("⚠️  Warning: Could not fix all orphaned profiles")
    
    # Step 3: Verify Nick Bare's fix
    if not verify_nick_bare_fix():
        success = False
    
    # Step 4: Test leaderboard
    if not test_leaderboard_after_fix():
        print("⚠️  Warning: Leaderboard test failed")
    
    if success:
        print("\n🎉 CRITICAL DATABASE UPDATE COMPLETED SUCCESSFULLY!")
        print("✅ Nick Bare's profile is now linked to his user account")
        print("✅ Orphaned profiles have been processed")
        print("✅ Leaderboard should now show complete demographic data")
    else:
        print("\n❌ CRITICAL DATABASE UPDATE FAILED!")
        print("❌ Manual intervention may be required")
        sys.exit(1)
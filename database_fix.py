#!/usr/bin/env python3
"""
URGENT DATABASE FIX: Fix all athlete profiles that have user_id = NULL by linking them to their corresponding users.
This script executes the critical database migration needed to restore user profile linking.
"""

import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_orphaned_profiles():
    """Check all orphaned athlete profiles (user_id IS NULL)"""
    print("🔍 CHECKING ORPHANED ATHLETE PROFILES...")
    print("=" * 60)
    
    try:
        # Get all orphaned athlete profiles
        result = supabase.table('athlete_profiles').select(
            'id, profile_json, user_id'
        ).is_('user_id', 'null').execute()
        
        if result.data:
            print(f"📊 Found {len(result.data)} orphaned athlete profiles:")
            for profile in result.data:
                profile_json = profile.get('profile_json', {})
                first_name = profile_json.get('first_name', 'Unknown')
                email = profile_json.get('email', 'No email')
                print(f"  - ID: {profile['id']}")
                print(f"    Name: {first_name}")
                print(f"    Email: {email}")
                print(f"    Current user_id: {profile['user_id']}")
                print()
            
            return result.data
        else:
            print("✅ No orphaned profiles found - all profiles are properly linked!")
            return []
            
    except Exception as e:
        print(f"❌ Error checking orphaned profiles: {e}")
        return None

def get_user_profiles():
    """Get all user profiles for email matching"""
    print("👥 GETTING USER PROFILES FOR EMAIL MATCHING...")
    print("=" * 50)
    
    try:
        result = supabase.table('user_profiles').select('user_id, email').execute()
        
        if result.data:
            print(f"📊 Found {len(result.data)} user profiles:")
            for user in result.data:
                print(f"  - User ID: {user['user_id']}")
                print(f"    Email: {user['email']}")
            print()
            return result.data
        else:
            print("❌ No user profiles found!")
            return []
            
    except Exception as e:
        print(f"❌ Error getting user profiles: {e}")
        return None

def fix_nick_bare_profile():
    """Special fix for Nick Bare with his specific user_id"""
    print("🎯 SPECIAL FIX FOR NICK BARE...")
    print("=" * 40)
    
    nick_user_id = 'ff6827a2-2b0b-4210-8bc6-e02cc8487752'
    
    try:
        # Find Nick Bare's profile
        result = supabase.table('athlete_profiles').select(
            'id, profile_json, user_id'
        ).execute()
        
        nick_profiles = []
        for profile in result.data:
            profile_json = profile.get('profile_json', {})
            first_name = profile_json.get('first_name', '').lower()
            last_name = profile_json.get('last_name', '').lower()
            
            if 'nick' in first_name and 'bare' in last_name:
                nick_profiles.append(profile)
        
        if nick_profiles:
            print(f"📊 Found {len(nick_profiles)} potential Nick Bare profiles:")
            for profile in nick_profiles:
                profile_json = profile.get('profile_json', {})
                print(f"  - ID: {profile['id']}")
                print(f"    Name: {profile_json.get('first_name')} {profile_json.get('last_name')}")
                print(f"    Email: {profile_json.get('email')}")
                print(f"    Current user_id: {profile['user_id']}")
                
                # Update Nick's profile with correct user_id
                if profile['user_id'] is None:
                    print(f"🔧 Updating Nick Bare's profile {profile['id']} with user_id {nick_user_id}")
                    
                    update_result = supabase.table('athlete_profiles').update({
                        'user_id': nick_user_id
                    }).eq('id', profile['id']).execute()
                    
                    if update_result.data:
                        print(f"✅ Successfully updated Nick Bare's profile!")
                        return True
                    else:
                        print(f"❌ Failed to update Nick Bare's profile")
                        return False
                else:
                    print(f"ℹ️  Nick Bare's profile already has user_id: {profile['user_id']}")
                    return True
        else:
            print("❌ Nick Bare's profile not found!")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing Nick Bare's profile: {e}")
        return False

def fix_orphaned_profiles_by_email():
    """Fix orphaned profiles by matching emails"""
    print("📧 FIXING ORPHANED PROFILES BY EMAIL MATCHING...")
    print("=" * 55)
    
    # Get orphaned profiles
    orphaned_profiles = check_orphaned_profiles()
    if not orphaned_profiles:
        return True
    
    # Get user profiles
    user_profiles = get_user_profiles()
    if not user_profiles:
        return False
    
    # Create email to user_id mapping
    email_to_user_id = {}
    for user in user_profiles:
        if user['email']:
            email_to_user_id[user['email'].lower()] = user['user_id']
    
    print(f"📊 Email mapping created for {len(email_to_user_id)} users")
    
    # Fix orphaned profiles
    fixed_count = 0
    for profile in orphaned_profiles:
        profile_json = profile.get('profile_json', {})
        profile_email = profile_json.get('email', '').lower()
        
        if profile_email and profile_email in email_to_user_id:
            user_id = email_to_user_id[profile_email]
            
            print(f"🔧 Fixing profile {profile['id']} (email: {profile_email}) -> user_id: {user_id}")
            
            try:
                update_result = supabase.table('athlete_profiles').update({
                    'user_id': user_id
                }).eq('id', profile['id']).execute()
                
                if update_result.data:
                    print(f"✅ Successfully linked profile {profile['id']} to user {user_id}")
                    fixed_count += 1
                else:
                    print(f"❌ Failed to update profile {profile['id']}")
                    
            except Exception as e:
                print(f"❌ Error updating profile {profile['id']}: {e}")
        else:
            print(f"⚠️  No matching user found for profile {profile['id']} (email: {profile_email})")
    
    print(f"\n🎉 FIXED {fixed_count} out of {len(orphaned_profiles)} orphaned profiles!")
    return fixed_count > 0

def verify_fixes():
    """Verify that the fixes worked"""
    print("\n🔍 VERIFYING FIXES...")
    print("=" * 30)
    
    try:
        # Check for remaining orphaned profiles
        result = supabase.table('athlete_profiles').select(
            'id, profile_json, user_id'
        ).is_('user_id', 'null').execute()
        
        if result.data:
            print(f"⚠️  Still {len(result.data)} orphaned profiles remaining:")
            for profile in result.data:
                profile_json = profile.get('profile_json', {})
                first_name = profile_json.get('first_name', 'Unknown')
                email = profile_json.get('email', 'No email')
                print(f"  - {first_name} ({email})")
        else:
            print("✅ All profiles are now properly linked!")
        
        # Check Nick Bare specifically
        nick_result = supabase.table('athlete_profiles').select(
            'id, profile_json, user_id'
        ).execute()
        
        nick_found = False
        for profile in nick_result.data:
            profile_json = profile.get('profile_json', {})
            first_name = profile_json.get('first_name', '').lower()
            last_name = profile_json.get('last_name', '').lower()
            
            if 'nick' in first_name and 'bare' in last_name:
                nick_found = True
                print(f"🎯 Nick Bare status:")
                print(f"  - Profile ID: {profile['id']}")
                print(f"  - User ID: {profile['user_id']}")
                print(f"  - Expected: ff6827a2-2b0b-4210-8bc6-e02cc8487752")
                if profile['user_id'] == 'ff6827a2-2b0b-4210-8bc6-e02cc8487752':
                    print("  ✅ Nick Bare is properly linked!")
                else:
                    print("  ❌ Nick Bare is not properly linked!")
                break
        
        if not nick_found:
            print("❌ Nick Bare profile not found!")
        
        return len(result.data) == 0
        
    except Exception as e:
        print(f"❌ Error verifying fixes: {e}")
        return False

def main():
    """Main function to execute the database fix"""
    print("🚨 URGENT DATABASE FIX - ATHLETE PROFILE USER LINKING")
    print("=" * 70)
    print("This script will fix all athlete profiles that have user_id = NULL")
    print("by linking them to their corresponding users via email matching.")
    print()
    
    # Step 1: Check current state
    print("STEP 1: Check current state")
    orphaned_profiles = check_orphaned_profiles()
    if orphaned_profiles is None:
        print("❌ Failed to check orphaned profiles. Exiting.")
        return False
    
    if not orphaned_profiles:
        print("✅ No orphaned profiles found. Database is already in good state!")
        return True
    
    # Step 2: Fix Nick Bare specifically
    print("STEP 2: Fix Nick Bare specifically")
    nick_fixed = fix_nick_bare_profile()
    
    # Step 3: Fix other orphaned profiles by email matching
    print("STEP 3: Fix orphaned profiles by email matching")
    email_fixes = fix_orphaned_profiles_by_email()
    
    # Step 4: Verify fixes
    print("STEP 4: Verify fixes")
    verification_success = verify_fixes()
    
    if verification_success:
        print("\n🎉 DATABASE FIX COMPLETED SUCCESSFULLY!")
        print("✅ All athlete profiles are now properly linked to user accounts")
        print("✅ Nick Bare should now show with full display name and demographic data")
        print("✅ Leaderboard should display complete user information")
        return True
    else:
        print("\n⚠️  DATABASE FIX PARTIALLY COMPLETED")
        print("Some profiles may still need manual intervention")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
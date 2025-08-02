#!/usr/bin/env python3
"""
Fix User Profile Linking - Connect orphaned athlete profiles to user accounts
This script will find matching users based on email addresses and fix the broken relationships
"""

import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client, Client
import json

# Supabase credentials
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzA5NDY5NCwiZXhwIjoyMDQ4NjcwNjk0fQ.R4703UP5w7MayJgAIjNFOWG1eFiK1r8sFPOajRf1r7I"

def main():
    """Fix orphaned athlete profiles by linking them to user accounts"""
    
    print("🔗 FIXING USER PROFILE LINKING...")
    print("=" * 60)
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Step 1: Get all orphaned athlete profiles (user_profile_id is NULL)
        print("📋 Step 1: Finding orphaned athlete profiles...")
        
        orphaned_response = supabase.table('athlete_profiles')\
            .select('id, profile_json, user_profile_id')\
            .is_('user_profile_id', 'null')\
            .execute()
        
        orphaned_profiles = orphaned_response.data
        print(f"Found {len(orphaned_profiles)} orphaned athlete profiles")
        
        if not orphaned_profiles:
            print("✅ No orphaned profiles found - all profiles are properly linked!")
            return True
        
        # Step 2: Get all user profiles for matching
        print("\n👥 Step 2: Loading user profiles for matching...")
        
        users_response = supabase.table('user_profiles')\
            .select('id, user_id, email, display_name')\
            .execute()
        
        user_profiles = users_response.data
        print(f"Found {len(user_profiles)} user profiles")
        
        # Step 3: Create email-based matching
        print("\n🔍 Step 3: Matching profiles by email address...")
        
        # Create lookup dictionary by email
        email_to_user = {}
        for user in user_profiles:
            email = user.get('email', '').lower().strip()
            if email:
                email_to_user[email] = user
        
        matches_found = 0
        successful_links = 0
        
        # Try to match each orphaned profile
        for profile in orphaned_profiles:
            profile_id = profile['id']
            profile_json = profile.get('profile_json', {})
            profile_email = profile_json.get('email', '').lower().strip()
            
            print(f"\n🔍 Processing profile {profile_id}:")
            print(f"   Email: {profile_email}")
            print(f"   Name: {profile_json.get('first_name', '')} {profile_json.get('last_name', '')}")
            
            if profile_email and profile_email in email_to_user:
                matching_user = email_to_user[profile_email]
                matches_found += 1
                
                print(f"   ✅ MATCH FOUND with user_profile_id: {matching_user['id']}")
                print(f"   User display_name: {matching_user.get('display_name', 'N/A')}")
                
                # Update the athlete profile to link it
                try:
                    update_result = supabase.table('athlete_profiles')\
                        .update({
                            'user_profile_id': matching_user['id'],
                            'user_id': matching_user['user_id']  # Also fix the user_id field
                        })\
                        .eq('id', profile_id)\
                        .execute()
                    
                    if update_result.data:
                        successful_links += 1
                        print(f"   ✅ Successfully linked profile")
                    else:
                        print(f"   ❌ Failed to update profile - no data returned")
                        
                except Exception as e:
                    print(f"   ❌ Error updating profile: {str(e)}")
            else:
                print(f"   ❌ No matching user found for email: {profile_email}")
        
        # Step 4: Results summary
        print(f"\n📊 LINKING RESULTS:")
        print(f"   Total orphaned profiles: {len(orphaned_profiles)}")
        print(f"   Matches found: {matches_found}")
        print(f"   Successfully linked: {successful_links}")
        print(f"   Still orphaned: {len(orphaned_profiles) - successful_links}")
        
        # Step 5: Specific check for Nick Bare
        print(f"\n🎯 NICK BARE SPECIFIC CHECK:")
        
        # Look for Nick Bare specifically
        nick_profiles = []
        for profile in orphaned_profiles:
            profile_json = profile.get('profile_json', {})
            first_name = profile_json.get('first_name', '').lower()
            last_name = profile_json.get('last_name', '').lower()
            email = profile_json.get('email', '').lower()
            
            if ('nick' in first_name and 'bare' in last_name) or 'nickbare' in email:
                nick_profiles.append(profile)
        
        print(f"Found {len(nick_profiles)} profiles that might be Nick Bare:")
        for profile in nick_profiles:
            profile_json = profile.get('profile_json', {})
            print(f"  - ID: {profile['id']}")
            print(f"    Name: {profile_json.get('first_name', '')} {profile_json.get('last_name', '')}")
            print(f"    Email: {profile_json.get('email', '')}")
        
        # Try to create a user profile for Nick Bare if needed
        target_user_id = "c0a0de33-a2f8-40cd-b8db-d89f7a42d140"
        if nick_profiles and target_user_id not in [u.get('user_id') for u in user_profiles]:
            print(f"\n💡 Creating user profile for Nick Bare...")
            
            nick_profile = nick_profiles[0]  # Use the first one found
            profile_json = nick_profile.get('profile_json', {})
            
            # Create user profile entry
            new_user_profile = {
                "user_id": target_user_id,
                "email": profile_json.get('email', ''),
                "display_name": "Nick Bare",
                "name": f"{profile_json.get('first_name', '')} {profile_json.get('last_name', '')}".strip()
            }
            
            try:
                user_create_result = supabase.table('user_profiles').insert(new_user_profile).execute()
                
                if user_create_result.data:
                    new_user_profile_id = user_create_result.data[0]['id']
                    print(f"✅ Created user profile with ID: {new_user_profile_id}")
                    
                    # Link the athlete profile
                    link_result = supabase.table('athlete_profiles')\
                        .update({
                            'user_profile_id': new_user_profile_id,
                            'user_id': target_user_id
                        })\
                        .eq('id', nick_profile['id'])\
                        .execute()
                    
                    if link_result.data:
                        print(f"✅ Successfully linked Nick Bare's athlete profile!")
                        successful_links += 1
                    else:
                        print(f"❌ Failed to link Nick Bare's athlete profile")
                else:
                    print(f"❌ Failed to create user profile for Nick Bare")
                    
            except Exception as e:
                print(f"❌ Error creating user profile for Nick Bare: {str(e)}")
        
        if successful_links > 0:
            print(f"\n🎉 SUCCESS! Fixed {successful_links} user profile links!")
            print("The leaderboard should now show proper display names and demographic data.")
            return True
        else:
            print(f"\n⚠️  No profiles were successfully linked.")
            return False
            
    except Exception as e:
        print(f"❌ Error during user profile linking: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
#!/usr/bin/env python3
"""
Script to check current Supabase database schema and fix user profile linking
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables from backend/.env
load_dotenv('/app/backend/.env')

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_user_profiles():
    """Check user_profiles table"""
    try:
        result = supabase.table('user_profiles').select('*').execute()
        
        if result.data:
            print(f"📊 user_profiles table has {len(result.data)} records:")
            for profile in result.data:
                print(f"  - {profile['email']} (user_id: {profile['user_id'][:8]}..., name: {profile.get('first_name', 'N/A')})")
        else:
            print("❌ user_profiles table is empty")
            
    except Exception as e:
        print(f"❌ Error checking user_profiles: {e}")

def check_athlete_profiles():
    """Check athlete_profiles table"""
    try:
        result = supabase.table('athlete_profiles').select('*').limit(5).execute()
        
        if result.data:
            print(f"\n🏃 athlete_profiles table has records:")
            for profile in result.data:
                print(f"  - ID: {profile['id'][:8]}... (user_id: {profile.get('user_id', 'N/A')[:8] if profile.get('user_id') else 'N/A'}...)")
        else:
            print("\n❌ athlete_profiles table is empty")
            
    except Exception as e:
        print(f"❌ Error checking athlete_profiles: {e}")

def create_kyle_user_profile():
    """Create user profile for Kyle"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        kyle_email = "KyleSteinmeyer7@gmail.com"
        
        # Check if Kyle's profile already exists
        existing = supabase.table('user_profiles').select('*').eq('user_id', kyle_user_id).execute()
        
        if existing.data:
            print(f"✅ Kyle's profile already exists: {existing.data[0]}")
            return existing.data[0]
        
        # Create Kyle's profile
        kyle_profile = {
            "user_id": kyle_user_id,
            "email": kyle_email,
            "first_name": "Kyle",
            "last_name": "Steinmeyer",
            "display_name": "Kyle Steinmeyer",
            "created_at": "2024-01-15T10:00:00Z",
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        result = supabase.table('user_profiles').insert(kyle_profile).execute()
        
        if result.data:
            print(f"✅ Created Kyle's user profile: {result.data[0]}")
            return result.data[0]
        else:
            print("❌ Failed to create Kyle's profile")
            
    except Exception as e:
        print(f"❌ Error creating Kyle's profile: {e}")

def link_athlete_profiles_to_kyle():
    """Link existing athlete profiles to Kyle if they don't have user links"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        
        # Get Kyle's user profile
        kyle_profile = supabase.table('user_profiles').select('*').eq('user_id', kyle_user_id).execute()
        
        if not kyle_profile.data:
            print("❌ Kyle's user profile not found")
            return
        
        kyle_profile_id = kyle_profile.data[0]['id']
        
        # Find athlete profiles without user links
        unlinked_profiles = supabase.table('athlete_profiles').select('*').is_('user_id', None).execute()
        
        if unlinked_profiles.data:
            print(f"🔗 Found {len(unlinked_profiles.data)} unlinked athlete profiles, linking to Kyle...")
            
            for profile in unlinked_profiles.data:
                # Link to Kyle
                result = supabase.table('athlete_profiles').update({
                    'user_id': kyle_user_id,
                    'user_profile_id': kyle_profile_id
                }).eq('id', profile['id']).execute()
                
                if result.data:
                    print(f"  ✅ Linked profile {profile['id'][:8]}... to Kyle")
                else:
                    print(f"  ❌ Failed to link profile {profile['id'][:8]}...")
        else:
            print("✅ No unlinked athlete profiles found")
            
    except Exception as e:
        print(f"❌ Error linking athlete profiles: {e}")

def setup_auth_triggers():
    """Setup database triggers for automatic user profile creation"""
    try:
        # This would normally be done via SQL, but let's check if we can simulate it
        print("🔧 Note: Auto user profile creation should be handled by auth triggers")
        print("   For now, we'll handle it manually in the backend code")
        
    except Exception as e:
        print(f"❌ Error setting up triggers: {e}")

if __name__ == "__main__":
    print("🔍 Checking Supabase Database and Fixing User Profile Links...")
    check_user_profiles()
    check_athlete_profiles()
    
    print("\n🛠️  Creating Kyle's user profile...")
    create_kyle_user_profile()
    
    print("\n🔗 Linking athlete profiles to Kyle...")
    link_athlete_profiles_to_kyle()
    
    print("\n✅ Database analysis and fixes complete!")
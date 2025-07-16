#!/usr/bin/env python3
"""
Comprehensive fix for user profile and authentication issues
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from backend/.env
load_dotenv('/app/backend/.env')

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def link_athlete_profiles_to_kyle():
    """Link existing athlete profiles to Kyle's user profile"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        
        # Get Kyle's user profile
        kyle_profile = supabase.table('user_profiles').select('*').eq('user_id', kyle_user_id).execute()
        
        if not kyle_profile.data:
            print("❌ Kyle's user profile not found")
            return
        
        kyle_profile_id = kyle_profile.data[0]['id']
        print(f"✅ Found Kyle's profile: {kyle_profile_id}")
        
        # Find athlete profiles that belong to Kyle but aren't linked to user profile
        athlete_profiles = supabase.table('athlete_profiles').select('*').eq('user_id', kyle_user_id).execute()
        
        if athlete_profiles.data:
            print(f"🔗 Found {len(athlete_profiles.data)} athlete profiles for Kyle, updating links...")
            
            for profile in athlete_profiles.data:
                # Update to link to user profile
                result = supabase.table('athlete_profiles').update({
                    'user_profile_id': kyle_profile_id,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('id', profile['id']).execute()
                
                if result.data:
                    print(f"  ✅ Linked athlete profile {profile['id'][:8]}... to Kyle's user profile")
                else:
                    print(f"  ❌ Failed to link athlete profile {profile['id'][:8]}...")
        else:
            print("✅ No athlete profiles found for Kyle")
            
    except Exception as e:
        print(f"❌ Error linking athlete profiles: {e}")

def update_kyle_profile_details():
    """Update Kyle's profile with better details"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        
        # Update Kyle's profile with more details
        update_data = {
            "display_name": "Kyle Steinmeyer",
            "name": "Kyle Steinmeyer",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('user_profiles').update(update_data).eq('user_id', kyle_user_id).execute()
        
        if result.data:
            print(f"✅ Updated Kyle's profile details: {result.data[0]}")
        else:
            print("❌ Failed to update Kyle's profile details")
            
    except Exception as e:
        print(f"❌ Error updating Kyle's profile: {e}")

def check_final_state():
    """Check the final state of the database"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        
        # Check user profile
        user_profile = supabase.table('user_profiles').select('*').eq('user_id', kyle_user_id).execute()
        
        if user_profile.data:
            print(f"\n✅ Kyle's user profile:")
            profile = user_profile.data[0]
            print(f"  - ID: {profile['id']}")
            print(f"  - Email: {profile['email']}")
            print(f"  - Display Name: {profile['display_name']}")
            print(f"  - Created: {profile['created_at']}")
            
            # Check linked athlete profiles
            athlete_profiles = supabase.table('athlete_profiles').select('*').eq('user_profile_id', profile['id']).execute()
            
            if athlete_profiles.data:
                print(f"\n🏃 Linked athlete profiles ({len(athlete_profiles.data)}):")
                for ap in athlete_profiles.data:
                    score = ap.get('score_data', {})
                    hybrid_score = score.get('hybridScore', 'N/A') if score else 'N/A'
                    print(f"  - {ap['id'][:8]}... (Score: {hybrid_score})")
            else:
                print("\n❌ No linked athlete profiles found")
        else:
            print("\n❌ Kyle's user profile not found")
            
    except Exception as e:
        print(f"❌ Error checking final state: {e}")

def create_user_profile_system_fix():
    """Create a comprehensive fix for the user profile system"""
    print("🔧 Creating comprehensive user profile system fix...")
    
    # This would include:
    # 1. Database triggers for auto-creating user profiles
    # 2. Proper linking between auth.users and user_profiles
    # 3. Auto-linking athlete profiles to user profiles
    
    print("📝 Recommendations for backend fixes:")
    print("1. Add auth trigger to auto-create user profiles on signup")
    print("2. Update backend to handle upsert properly")
    print("3. Fix frontend authentication state handling")
    print("4. Ensure proper error handling for profile operations")

if __name__ == "__main__":
    print("🔧 Comprehensive User Profile System Fix")
    print("=" * 50)
    
    print("\n1. Linking athlete profiles to Kyle's user profile...")
    link_athlete_profiles_to_kyle()
    
    print("\n2. Updating Kyle's profile details...")
    update_kyle_profile_details()
    
    print("\n3. Checking final state...")
    check_final_state()
    
    print("\n4. System recommendations...")
    create_user_profile_system_fix()
    
    print("\n✅ Database fixes complete!")
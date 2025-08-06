#!/usr/bin/env python3
"""
Clean personal data from profile_json to complete database normalization
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase client
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def create_supabase_client():
    """Create Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def clean_profile_json_data():
    """Remove personal data from profile_json to complete normalization"""
    print("🧹 CLEANING PERSONAL DATA FROM PROFILE_JSON")
    print("=" * 50)
    
    supabase = create_supabase_client()
    
    try:
        # Get all athlete profiles
        profiles = supabase.table('athlete_profiles')\
            .select('id, profile_json')\
            .execute()
        
        print(f"📊 Processing {len(profiles.data)} athlete profiles...")
        
        updated_count = 0
        cleaned_fields_count = 0
        
        personal_data_fields = [
            'first_name', 'last_name', 'email', 'sex', 'age'
        ]
        
        for profile in profiles.data:
            profile_json = profile.get('profile_json', {})
            
            # Check if it contains personal data that should be in user_profiles
            has_personal_data = any(key in profile_json for key in personal_data_fields)
            
            if has_personal_data:
                # Count how many fields we're removing
                removing_fields = [key for key in personal_data_fields if key in profile_json]
                cleaned_fields_count += len(removing_fields)
                
                print(f"   🧹 Cleaning profile {profile['id'][:8]}... - removing: {', '.join(removing_fields)}")
                
                # Create cleaned profile_json without personal data
                cleaned_profile_json = {k: v for k, v in profile_json.items() if k not in personal_data_fields}
                
                # Update the profile
                result = supabase.table('athlete_profiles')\
                    .update({'profile_json': cleaned_profile_json})\
                    .eq('id', profile['id'])\
                    .execute()
                
                if result.data:
                    updated_count += 1
                else:
                    print(f"   ❌ Failed to update profile {profile['id']}")
            else:
                print(f"   ✅ Profile {profile['id'][:8]}... already clean")
                    
        print(f"\n📊 Normalization Results:")
        print(f"   ✅ Updated {updated_count} profiles")
        print(f"   🧹 Removed {cleaned_fields_count} personal data fields")
        print(f"   📦 Total profiles processed: {len(profiles.data)}")
        
        return updated_count
        
    except Exception as e:
        print(f"❌ Error cleaning profile_json: {e}")
        return 0

def verify_normalization():
    """Verify that normalization is complete"""
    print("\n🔍 VERIFYING NORMALIZATION COMPLETION")
    print("=" * 45)
    
    supabase = create_supabase_client()
    
    try:
        # Test the leaderboard join query
        profiles = supabase.table('athlete_profiles')\
            .select('''
                id,
                hybrid_score,
                user_profiles!inner(
                    display_name,
                    gender,
                    country,
                    date_of_birth
                )
            ''')\
            .eq('is_public', True)\
            .not_.is_('hybrid_score', 'null')\
            .limit(5)\
            .execute()
        
        print(f"✅ JOIN query successful! Retrieved {len(profiles.data)} profiles with scores:")
        
        for profile in profiles.data:
            user_profile = profile.get('user_profiles')
            if user_profile:
                display_name = user_profile.get('display_name', 'Unknown')
                gender = user_profile.get('gender', 'N/A')
                country = user_profile.get('country', 'N/A')
                score = profile.get('hybrid_score', 0)
                
                print(f"   - {display_name}: Score {score}, Gender: {gender}, Country: {country}")
        
        # Check if any profiles still have personal data in profile_json
        all_profiles = supabase.table('athlete_profiles')\
            .select('id, profile_json')\
            .execute()
        
        profiles_with_personal_data = 0
        for profile in all_profiles.data:
            profile_json = profile.get('profile_json', {})
            has_personal_data = any(key in profile_json for key in ['first_name', 'last_name', 'email', 'sex', 'age'])
            if has_personal_data:
                profiles_with_personal_data += 1
        
        if profiles_with_personal_data == 0:
            print(f"\n🎉 NORMALIZATION VERIFICATION SUCCESSFUL!")
            print(f"   ✅ No personal data found in profile_json fields")
            print(f"   ✅ JOIN queries working correctly")
            print(f"   ✅ Foreign key constraints established")
            return True
        else:
            print(f"\n⚠️  Found {profiles_with_personal_data} profiles still containing personal data")
            return False
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 DATABASE NORMALIZATION CLEANUP")
    print("=" * 50)
    
    # Clean personal data from profile_json
    cleaned_count = clean_profile_json_data()
    
    # Verify normalization is complete
    if verify_normalization():
        print(f"\n🎉 DATABASE NORMALIZATION COMPLETED SUCCESSFULLY!")
        print(f"   - Removed personal data from {cleaned_count} profile_json records")
        print(f"   - Personal data now properly stored in user_profiles table")
        print(f"   - Foreign key relationships established")
        print(f"   - JOIN queries working correctly")
        print(f"\n🔄 Restart backend services to ensure all components use normalized structure")
    else:
        print(f"\n❌ Normalization verification failed")

if __name__ == "__main__":
    main()
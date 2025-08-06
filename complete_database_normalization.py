#!/usr/bin/env python3
"""
Database Normalization Completion Script
Fix orphaned athlete profiles and establish proper foreign key relationships.
"""

import os
import requests
import json
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
SUPABASE_PROJECT_ID = "uevqwbdumouoghymcqtc"
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def create_supabase_client():
    """Create Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def execute_sql_via_api(sql_query):
    """Execute SQL query via Supabase Management API"""
    url = f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query"
    headers = {
        "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": sql_query
    }
    
    print(f"🔄 Executing SQL: {sql_query}")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ SQL Error: {response.text}")
        return None

def analyze_orphaned_profiles():
    """Analyze which athlete profiles are orphaned"""
    print("\n🔍 ANALYZING ORPHANED ATHLETE PROFILES")
    print("=" * 50)
    
    supabase = create_supabase_client()
    
    try:
        # Get all athlete profiles
        athlete_profiles = supabase.table('athlete_profiles')\
            .select('id, user_id, profile_json, created_at, hybrid_score')\
            .execute()
        
        # Get all user profile user_ids
        user_profiles = supabase.table('user_profiles')\
            .select('user_id, email, display_name')\
            .execute()
        
        valid_user_ids = set(up['user_id'] for up in user_profiles.data)
        
        orphaned_profiles = []
        valid_profiles = []
        
        for ap in athlete_profiles.data:
            user_id = ap.get('user_id')
            if user_id not in valid_user_ids:
                orphaned_profiles.append(ap)
            else:
                valid_profiles.append(ap)
        
        print(f"📊 Analysis Results:")
        print(f"   ✅ Valid profiles (have matching user_profiles): {len(valid_profiles)}")
        print(f"   ❌ Orphaned profiles (user_id not found): {len(orphaned_profiles)}")
        
        if orphaned_profiles:
            print(f"\n🔍 Orphaned profiles details:")
            for profile in orphaned_profiles[:10]:  # Show first 10
                profile_json = profile.get('profile_json', {})
                name = profile_json.get('first_name', 'Unknown')
                email = profile_json.get('email', 'No email')
                score = profile.get('hybrid_score', 'No score')
                print(f"   - {name} ({email}) | User ID: {profile['user_id'][:8]}... | Score: {score}")
            
            if len(orphaned_profiles) > 10:
                print(f"   ... and {len(orphaned_profiles) - 10} more")
        
        return orphaned_profiles, valid_profiles
    
    except Exception as e:
        print(f"❌ Error analyzing profiles: {e}")
        return [], []

def create_missing_user_profiles(orphaned_profiles):
    """Create user_profiles entries for orphaned athlete profiles"""
    print("\n🔧 CREATING MISSING USER PROFILES")
    print("=" * 40)
    
    supabase = create_supabase_client()
    created_count = 0
    
    for profile in orphaned_profiles:
        try:
            user_id = profile['user_id']
            profile_json = profile.get('profile_json', {})
            
            # Extract data from profile_json to create user_profile
            email = profile_json.get('email', f'user_{user_id[:8]}@unknown.com')
            first_name = profile_json.get('first_name', 'Unknown')
            last_name = profile_json.get('last_name', '')
            name = f"{first_name} {last_name}".strip() or first_name
            age = profile_json.get('age')
            sex = profile_json.get('sex', '').lower()
            
            # Calculate date_of_birth from age if available
            date_of_birth = None
            if age and isinstance(age, (int, str)):
                try:
                    current_year = datetime.now().year
                    birth_year = current_year - int(age)
                    date_of_birth = f"{birth_year}-01-01"
                except (ValueError, TypeError):
                    pass
            
            # Map sex to gender
            gender = None
            if sex in ['male', 'm']:
                gender = 'male'
            elif sex in ['female', 'f']:
                gender = 'female'
            
            # Create display name
            display_name = name
            if not display_name or display_name == 'Unknown':
                display_name = email.split('@')[0]
            
            user_profile_data = {
                'user_id': user_id,
                'email': email,
                'name': name,
                'display_name': display_name,
                'date_of_birth': date_of_birth,
                'gender': gender,
                'units_preference': 'imperial',
                'privacy_level': 'public',
                'is_active': True,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Remove None values
            user_profile_data = {k: v for k, v in user_profile_data.items() if v is not None}
            
            # Insert user profile
            result = supabase.table('user_profiles').insert(user_profile_data).execute()
            
            if result.data:
                created_count += 1
                print(f"   ✅ Created user_profile for {name} ({email})")
            else:
                print(f"   ❌ Failed to create user_profile for {name}")
                
        except Exception as e:
            print(f"   ❌ Error creating user_profile for {profile.get('id')}: {e}")
    
    print(f"\n📊 Created {created_count} user_profiles successfully")
    return created_count

def create_foreign_key_constraint():
    """Create the foreign key constraint"""
    print("\n🔧 CREATING FOREIGN KEY CONSTRAINT")
    print("=" * 40)
    
    fk_constraint_sql = """
    ALTER TABLE athlete_profiles 
    ADD CONSTRAINT fk_athlete_user_profiles 
    FOREIGN KEY (user_id) 
    REFERENCES user_profiles(user_id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
    """
    
    result = execute_sql_via_api(fk_constraint_sql)
    if result:
        print("✅ Foreign key constraint created successfully!")
        return True
    else:
        print("❌ Failed to create foreign key constraint")
        return False

def test_normalized_leaderboard():
    """Test the leaderboard functionality with normalized structure"""
    print("\n🧪 TESTING NORMALIZED LEADERBOARD FUNCTIONALITY")
    print("=" * 50)
    
    supabase = create_supabase_client()
    
    try:
        # Test the problematic join query from ranking_service.py
        profiles = supabase.table('athlete_profiles')\
            .select('''
                *,
                user_profiles!inner(
                    user_id,
                    name,
                    display_name,
                    email,
                    date_of_birth,
                    gender,
                    country
                )
            ''')\
            .eq('is_public', True)\
            .not_.is_('hybrid_score', 'null')\
            .order('hybrid_score', desc=True)\
            .limit(5)\
            .execute()
        
        print(f"✅ Join query successful! Retrieved {len(profiles.data)} profiles:")
        
        for profile in profiles.data:
            user_profile = profile.get('user_profiles')
            if user_profile:
                display_name = user_profile.get('display_name', 'Unknown')
                gender = user_profile.get('gender', 'Unknown')
                country = user_profile.get('country', 'Unknown')
                score = profile.get('hybrid_score', 0)
                
                print(f"   - {display_name}: Score {score}, Gender: {gender}, Country: {country}")
            else:
                print(f"   - Profile {profile['id']}: No linked user profile")
        
        return True
        
    except Exception as e:
        print(f"❌ Leaderboard test failed: {e}")
        return False

def remove_personal_data_from_profile_json():
    """Remove personal data from profile_json to complete normalization"""
    print("\n🧹 REMOVING PERSONAL DATA FROM PROFILE_JSON")
    print("=" * 50)
    
    supabase = create_supabase_client()
    
    try:
        # Get all athlete profiles
        profiles = supabase.table('athlete_profiles')\
            .select('id, profile_json')\
            .execute()
        
        updated_count = 0
        
        for profile in profiles.data:
            profile_json = profile.get('profile_json', {})
            
            # Check if it contains personal data that should be in user_profiles
            has_personal_data = any(key in profile_json for key in [
                'first_name', 'last_name', 'email', 'sex', 'age'
            ])
            
            if has_personal_data:
                # Create cleaned profile_json without personal data
                cleaned_profile_json = {k: v for k, v in profile_json.items() if k not in [
                    'first_name', 'last_name', 'email', 'sex', 'age'
                ]}
                
                # Update the profile
                result = supabase.table('athlete_profiles')\
                    .update({'profile_json': cleaned_profile_json})\
                    .eq('id', profile['id'])\
                    .execute()
                
                if result.data:
                    updated_count += 1
                    
        print(f"✅ Cleaned personal data from {updated_count} profile_json records")
        return updated_count
        
    except Exception as e:
        print(f"❌ Error cleaning profile_json: {e}")
        return 0

def main():
    """Main function to complete database normalization"""
    print("🚀 DATABASE NORMALIZATION COMPLETION")
    print("=" * 60)
    print("This script will complete the database normalization by:")
    print("1. Analyzing orphaned athlete profiles")
    print("2. Creating missing user_profiles entries") 
    print("3. Establishing foreign key relationships")
    print("4. Testing the normalized structure")
    print("5. Cleaning remaining personal data from profile_json")
    print("=" * 60)
    
    # Step 1: Analyze orphaned profiles
    orphaned_profiles, valid_profiles = analyze_orphaned_profiles()
    
    if not orphaned_profiles:
        print("✅ No orphaned profiles found! Proceeding with foreign key constraint...")
    else:
        print(f"\n🔧 Found {len(orphaned_profiles)} orphaned profiles that need user_profile records")
        
        # Step 2: Create missing user profiles
        created_count = create_missing_user_profiles(orphaned_profiles)
        
        if created_count != len(orphaned_profiles):
            print(f"⚠️  Warning: Only created {created_count} out of {len(orphaned_profiles)} needed user_profiles")
    
    # Step 3: Create foreign key constraint
    if create_foreign_key_constraint():
        # Step 4: Test normalized functionality
        if test_normalized_leaderboard():
            print("\n✅ Database normalization structure working correctly!")
            
            # Step 5: Clean personal data from profile_json
            cleaned_count = remove_personal_data_from_profile_json()
            
            print(f"\n🎉 DATABASE NORMALIZATION COMPLETED SUCCESSFULLY!")
            print(f"   - Created user_profiles entries for orphaned athlete profiles")
            print(f"   - Established foreign key constraint athlete_profiles.user_id → user_profiles.user_id")
            print(f"   - Verified leaderboard functionality with JOINs working")
            print(f"   - Cleaned personal data from {cleaned_count} profile_json records")
            print("\n🔄 Next: Restart backend services to ensure ranking_service uses new structure")
            
        else:
            print("❌ Leaderboard testing failed after constraint creation")
    else:
        print("❌ Foreign key constraint creation failed")

if __name__ == "__main__":
    main()
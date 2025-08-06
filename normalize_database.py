#!/usr/bin/env python3
"""
DATABASE NORMALIZATION PLAN: Remove Redundant Personal Data from athlete_profiles
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def execute_normalization():
    """Execute the database normalization plan"""
    
    # Use Management API credentials
    SUPABASE_ACCESS_TOKEN = 'sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0'
    SUPABASE_PROJECT_ID = 'uevqwbdumouoghymcqtc'
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    print("🔧 DATABASE NORMALIZATION PLAN")
    print("=" * 50)
    
    # PHASE 1: Data Migration - Move personal data from athlete_profiles to user_profiles
    print("\n📋 PHASE 1: DATA MIGRATION ANALYSIS")
    print("-" * 40)
    
    migration_sql_analysis = """
    -- Analysis query to see data that needs migration
    SELECT 
        ap.id as athlete_profile_id,
        ap.user_id,
        ap.first_name,
        ap.last_name, 
        ap.email,
        ap.sex,
        ap.age,
        up.name as user_profiles_name,
        up.email as user_profiles_email,
        up.gender as user_profiles_gender,
        CASE 
            WHEN up.user_id IS NULL THEN 'MISSING_USER_PROFILE'
            WHEN ap.first_name IS NOT NULL AND up.name IS NULL THEN 'NEEDS_NAME_MIGRATION' 
            WHEN ap.email IS NOT NULL AND up.email IS NULL THEN 'NEEDS_EMAIL_MIGRATION'
            WHEN ap.sex IS NOT NULL AND up.gender IS NULL THEN 'NEEDS_GENDER_MIGRATION'
            ELSE 'OK'
        END as migration_status
    FROM athlete_profiles ap
    LEFT JOIN user_profiles up ON ap.user_id = up.user_id
    WHERE ap.first_name IS NOT NULL 
        OR ap.last_name IS NOT NULL 
        OR ap.email IS NOT NULL 
        OR ap.sex IS NOT NULL
    ORDER BY ap.created_at DESC
    LIMIT 10;
    """
    
    print("Analysis query:")
    print(migration_sql_analysis)
    
    # PHASE 2: Column Removal
    print("\n📋 PHASE 2: COLUMN REMOVAL PLAN")  
    print("-" * 35)
    
    removal_sql = """
    -- Remove redundant personal data columns from athlete_profiles
    ALTER TABLE athlete_profiles 
    DROP COLUMN IF EXISTS profile_text,
    DROP COLUMN IF EXISTS first_name,
    DROP COLUMN IF EXISTS last_name,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS sex,
    DROP COLUMN IF EXISTS age,
    DROP COLUMN IF EXISTS user_profile_id;
    
    -- Clean up profile_json to remove personal data (would need custom function)
    -- UPDATE athlete_profiles 
    -- SET profile_json = profile_json - 'first_name' - 'last_name' - 'email' - 'sex' - 'dob'
    -- WHERE profile_json ? 'first_name' OR profile_json ? 'last_name' OR profile_json ? 'email';
    """
    
    print("Column removal SQL:")
    print(removal_sql)
    
    # PHASE 3: Application Code Updates
    print("\n📋 PHASE 3: APPLICATION CODE UPDATE PLAN")
    print("-" * 45)
    
    code_updates = [
        "1. Update webhook processing to populate user_profiles instead of athlete_profiles personal fields",
        "2. Update all queries to JOIN athlete_profiles with user_profiles on user_id",
        "3. Update leaderboard service to get personal data from user_profiles",
        "4. Update profile endpoints to only reference user_profiles for personal data",
        "5. Clean up profile_json extraction logic to focus on performance data only"
    ]
    
    for update in code_updates:
        print(f"   {update}")
    
    # PHASE 4: Validation
    print("\n📋 PHASE 4: VALIDATION PLAN")
    print("-" * 25)
    
    validation_sql = """
    -- Validate normalization 
    SELECT 
        COUNT(*) as total_athlete_profiles,
        COUNT(DISTINCT ap.user_id) as unique_users,
        COUNT(up.user_id) as linked_user_profiles,
        COUNT(CASE WHEN up.user_id IS NULL THEN 1 END) as orphaned_profiles
    FROM athlete_profiles ap
    LEFT JOIN user_profiles up ON ap.user_id = up.user_id;
    
    -- Check for any remaining personal data in athlete_profiles
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'athlete_profiles'
    AND column_name IN ('first_name', 'last_name', 'email', 'sex', 'age', 'user_profile_id', 'profile_text');
    """
    
    print("Validation queries:")
    print(validation_sql)
    
    return True

def preview_migration():
    """Preview the migration plan without executing"""
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    headers = {
        'apikey': supabase_service_key,
        'Authorization': f'Bearer {supabase_service_key}',
        'Content-Type': 'application/json'
    }
    
    print("\n🔍 MIGRATION PREVIEW")
    print("=" * 20)
    
    try:
        # Get count of athlete profiles with personal data
        athlete_url = f"{supabase_url}/rest/v1/athlete_profiles?select=id,user_id,first_name,last_name,email,sex"
        response = requests.get(athlete_url, headers=headers)
        
        if response.status_code == 200:
            profiles = response.json()
            profiles_with_personal_data = [p for p in profiles if any([
                p.get('first_name'), p.get('last_name'), p.get('email'), p.get('sex')
            ])]
            
            print(f"📊 Found {len(profiles_with_personal_data)} athlete profiles with personal data that needs migration")
            
            if profiles_with_personal_data:
                print("\nSample profiles with personal data:")
                for i, profile in enumerate(profiles_with_personal_data[:3]):
                    print(f"   {i+1}. ID: {profile.get('id')}")
                    print(f"      User ID: {profile.get('user_id')}")
                    print(f"      Name: {profile.get('first_name')} {profile.get('last_name')}")
                    print(f"      Email: {profile.get('email')}")
                    print(f"      Sex: {profile.get('sex')}")
                    print()
        
        # Check user_profiles completeness
        user_url = f"{supabase_url}/rest/v1/user_profiles?select=user_id,name,email,gender"
        user_response = requests.get(user_url, headers=headers)
        
        if user_response.status_code == 200:
            user_profiles = user_response.json()
            print(f"📊 Found {len(user_profiles)} user profiles")
            
            complete_profiles = [u for u in user_profiles if all([u.get('name'), u.get('email')])]
            print(f"📊 {len(complete_profiles)} user profiles have complete basic data")
    
    except Exception as e:
        print(f"Error in preview: {e}")

if __name__ == "__main__":
    print("DATABASE NORMALIZATION PLAN FOR HYBRID HOUSE")
    print("=" * 50)
    print("This script plans the removal of redundant personal data from athlete_profiles")
    print("and ensures proper relational structure with user_profiles as the source of truth")
    print("\n" + "="*50)
    
    # Preview first
    preview_migration()
    
    # Show the plan
    execute_normalization()
    
    print("\n✅ NORMALIZATION PLAN COMPLETE")
    print("Next steps:")
    print("1. Review the plan above")
    print("2. Execute data migration (move personal data to user_profiles)")  
    print("3. Execute column removal")
    print("4. Update application code")
    print("5. Run validation tests")
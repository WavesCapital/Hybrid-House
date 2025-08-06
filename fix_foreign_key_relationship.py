#!/usr/bin/env python3
"""
Script to establish proper foreign key relationship between athlete_profiles and user_profiles tables
for database normalization completion.
"""

import os
import requests
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
SUPABASE_PROJECT_ID = "uevqwbdumouoghymcqtc"
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

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
    
    print(f"🔄 Executing SQL query: {sql_query}")
    response = requests.post(url, headers=headers, json=payload)
    
    print(f"📊 Response status: {response.status_code}")
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error: {response.text}")
        return None

def check_current_schema():
    """Check the current database schema for both tables"""
    print("\n🔍 CHECKING CURRENT DATABASE SCHEMA")
    print("=" * 50)
    
    # Check athlete_profiles columns
    athlete_profiles_query = """
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'athlete_profiles' AND table_schema = 'public'
    ORDER BY ordinal_position;
    """
    
    result = execute_sql_via_api(athlete_profiles_query)
    if result:
        print("\n📋 athlete_profiles table schema:")
        for row in result.get('result', []):
            column_name = row.get('column_name')
            data_type = row.get('data_type')
            nullable = row.get('is_nullable')
            print(f"   - {column_name}: {data_type} ({'NULL' if nullable == 'YES' else 'NOT NULL'})")
    
    # Check user_profiles columns  
    user_profiles_query = """
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND table_schema = 'public'
    ORDER BY ordinal_position;
    """
    
    result = execute_sql_via_api(user_profiles_query)
    if result:
        print("\n📋 user_profiles table schema:")
        for row in result.get('result', []):
            column_name = row.get('column_name')
            data_type = row.get('data_type')
            nullable = row.get('is_nullable')
            print(f"   - {column_name}: {data_type} ({'NULL' if nullable == 'YES' else 'NOT NULL'})")

def check_foreign_key_constraints():
    """Check existing foreign key constraints"""
    print("\n🔗 CHECKING EXISTING FOREIGN KEY CONSTRAINTS")
    print("=" * 50)
    
    fk_query = """
    SELECT 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.column_name AS referenced_column_name,
        tc.constraint_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND (tc.table_name = 'athlete_profiles' OR tc.table_name = 'user_profiles');
    """
    
    result = execute_sql_via_api(fk_query)
    if result:
        constraints = result.get('result', [])
        if constraints:
            print("\n🔗 Existing foreign key constraints:")
            for constraint in constraints:
                table = constraint.get('table_name')
                column = constraint.get('column_name')
                ref_table = constraint.get('referenced_table_name')
                ref_column = constraint.get('referenced_column_name')
                name = constraint.get('constraint_name')
                print(f"   - {table}.{column} → {ref_table}.{ref_column} ({name})")
        else:
            print("   ⚠️  No foreign key constraints found")

def analyze_user_id_matching():
    """Analyze how many athlete_profiles have matching user_profiles"""
    print("\n🔍 ANALYZING USER_ID MATCHING")
    print("=" * 40)
    
    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Get all athlete_profiles with user_id
        athlete_profiles = supabase.table('athlete_profiles').select('id, user_id').execute()
        print(f"📊 Total athlete_profiles: {len(athlete_profiles.data)}")
        
        # Get all user_profiles 
        user_profiles = supabase.table('user_profiles').select('user_id').execute()
        print(f"📊 Total user_profiles: {len(user_profiles.data)}")
        
        # Analyze matching
        user_profile_ids = set(up['user_id'] for up in user_profiles.data)
        
        matching_count = 0
        orphaned_count = 0
        null_user_id_count = 0
        
        for ap in athlete_profiles.data:
            user_id = ap.get('user_id')
            if user_id is None:
                null_user_id_count += 1
            elif user_id in user_profile_ids:
                matching_count += 1
            else:
                orphaned_count += 1
                
        print(f"\n📈 User ID Matching Analysis:")
        print(f"   ✅ Athlete profiles with matching user_profiles: {matching_count}")
        print(f"   ❌ Athlete profiles with null user_id: {null_user_id_count}")
        print(f"   ⚠️  Athlete profiles orphaned (user_id not found): {orphaned_count}")
        print(f"   📊 Total athlete profiles: {len(athlete_profiles.data)}")
        
        return {
            'matching': matching_count,
            'null_user_id': null_user_id_count,
            'orphaned': orphaned_count,
            'total': len(athlete_profiles.data)
        }
        
    except Exception as e:
        print(f"❌ Error analyzing user_id matching: {e}")
        return None

def create_foreign_key_constraint():
    """Create the foreign key constraint between athlete_profiles and user_profiles"""
    print("\n🔧 CREATING FOREIGN KEY CONSTRAINT")
    print("=" * 40)
    
    # Create foreign key constraint
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

def test_join_after_constraint():
    """Test if the join works after creating the constraint"""
    print("\n🧪 TESTING JOIN AFTER CONSTRAINT CREATION")
    print("=" * 45)
    
    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Test the join query that was failing before
        profiles = supabase.table('athlete_profiles')\
            .select('id, user_id, user_profiles(user_id, display_name, name)')\
            .limit(3)\
            .execute()
            
        print(f"✅ Join query successful! Retrieved {len(profiles.data)} records:")
        for profile in profiles.data:
            user_profile = profile.get('user_profiles')
            if user_profile:
                print(f"   - Athlete ID: {profile['id']}, User: {user_profile.get('display_name', 'N/A')}")
            else:
                print(f"   - Athlete ID: {profile['id']}, User: No linked user profile")
                
        return True
        
    except Exception as e:
        print(f"❌ Join query still failing: {e}")
        return False

def main():
    """Main function to execute the foreign key relationship fix"""
    print("🚀 SUPABASE FOREIGN KEY RELATIONSHIP FIX")
    print("=" * 60)
    print("This script will establish proper foreign key relationship between")
    print("athlete_profiles.user_id and user_profiles.user_id for database normalization.")
    print("=" * 60)
    
    # Step 1: Check current schema
    check_current_schema()
    
    # Step 2: Check existing foreign key constraints
    check_foreign_key_constraints()
    
    # Step 3: Analyze user_id matching
    analysis = analyze_user_id_matching()
    
    if not analysis:
        print("❌ Cannot proceed without user_id analysis")
        return
    
    # Step 4: Check if we can safely create the constraint
    if analysis['null_user_id'] > 0 or analysis['orphaned'] > 0:
        print(f"\n⚠️  WARNING: Found {analysis['null_user_id']} profiles with null user_id")
        print(f"⚠️  WARNING: Found {analysis['orphaned']} profiles with orphaned user_id")
        print("🔧 These issues need to be resolved before creating foreign key constraint")
        
        if analysis['null_user_id'] > 0:
            print("\n🔧 FIXING NULL USER_ID VALUES...")
            # For now, we'll skip creating constraint if there are null values
            print("❌ Cannot create foreign key constraint with null user_id values present")
            return
    
    # Step 5: Create the foreign key constraint
    if analysis['matching'] > 0:
        print(f"\n✅ Found {analysis['matching']} valid relationships. Creating foreign key constraint...")
        if create_foreign_key_constraint():
            # Step 6: Test the join
            test_join_after_constraint()
        else:
            print("❌ Foreign key constraint creation failed")
    else:
        print("❌ No valid relationships found. Cannot create foreign key constraint.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Execute database schema update using the Supabase Python client
This script will add the essential individual columns to the athlete_profiles table
"""

import os
import json
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

def update_database_schema():
    """Update database schema to add individual columns"""
    
    # Create Supabase client
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
        return False
    
    supabase = create_client(supabase_url, supabase_key)
    
    print('🚀 Updating database schema to add individual columns...')
    
    # Read the SQL file
    with open('add_essential_columns.sql', 'r') as f:
        sql_content = f.read()
    
    # Execute the schema update
    try:
        # Since we can't execute raw SQL directly, let's test the current structure
        # and provide instructions for manual execution
        
        # Test current table structure
        result = supabase.table('athlete_profiles').select('*').limit(1).execute()
        
        if result.data:
            current_columns = list(result.data[0].keys())
            print(f"✅ Current table columns ({len(current_columns)}): {current_columns}")
            
            # Check which columns are missing
            required_columns = [
                'first_name', 'last_name', 'email', 'sex', 'age',
                'weight_lb', 'vo2_max', 'hrv_ms', 'resting_hr_bpm',
                'pb_mile_seconds', 'weekly_miles', 'long_run_miles',
                'pb_bench_1rm_lb', 'pb_squat_1rm_lb', 'pb_deadlift_1rm_lb',
                'schema_version', 'meta_session_id', 'interview_type'
            ]
            
            missing_columns = [col for col in required_columns if col not in current_columns]
            
            if missing_columns:
                print(f"⚠️  Missing columns: {missing_columns}")
                print(f"📝 Please execute this SQL in Supabase SQL Editor:")
                print("="*60)
                print(sql_content)
                print("="*60)
                return False
            else:
                print("✅ All required columns are already present!")
                return True
        else:
            print("❌ No data found in athlete_profiles table")
            return False
            
    except Exception as e:
        print(f"❌ Error checking table structure: {e}")
        print(f"📝 Please execute this SQL in Supabase SQL Editor:")
        print("="*60)
        print(sql_content)
        print("="*60)
        return False

if __name__ == "__main__":
    success = update_database_schema()
    if success:
        print("✅ Database schema is ready for optimized athlete profiles!")
    else:
        print("⚠️  Database schema update required - please execute the SQL manually in Supabase")
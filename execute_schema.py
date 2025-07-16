#!/usr/bin/env python3
"""
Execute database schema update using Supabase client
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

def execute_schema_update():
    """Execute schema update using Supabase client"""
    
    # Create Supabase client
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
        return False
    
    supabase = create_client(supabase_url, supabase_key)
    
    print('🚀 Executing database schema update...')
    
    # Individual SQL statements
    sql_statements = [
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS sex VARCHAR(20)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS age INTEGER",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS vo2_max DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS hrv_ms INTEGER",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS resting_hr_bpm INTEGER",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS pb_mile_seconds INTEGER",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weekly_miles DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS long_run_miles DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS pb_bench_1rm_lb DECIMAL(6,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS pb_squat_1rm_lb DECIMAL(6,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS pb_deadlift_1rm_lb DECIMAL(6,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS schema_version VARCHAR(10)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS meta_session_id UUID",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS interview_type VARCHAR(20)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS hybrid_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS strength_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS endurance_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS speed_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS vo2_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS distance_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS volume_score DECIMAL(5,2)",
        "ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS recovery_score DECIMAL(5,2)"
    ]
    
    success_count = 0
    
    for i, sql in enumerate(sql_statements):
        try:
            print(f"📝 Executing: {sql}")
            
            # Try to execute using the SQL function if available
            try:
                # Check if we have a sql function available
                result = supabase.rpc('sql', {'query': sql}).execute()
                print(f"✅ Statement {i+1} executed successfully")
                success_count += 1
            except Exception as e:
                if "function sql" in str(e).lower():
                    print(f"⚠️  Statement {i+1}: SQL function not available - {sql[:50]}...")
                else:
                    print(f"❌ Statement {i+1} failed: {e}")
        except Exception as e:
            print(f"❌ Statement {i+1} failed: {e}")
    
    print(f"\n📊 Summary: {success_count}/{len(sql_statements)} statements executed")
    
    if success_count == 0:
        print("⚠️  No statements executed successfully")
        print("📋 Please execute the SQL manually in Supabase SQL Editor:")
        print("="*60)
        with open('/app/supabase_schema_update.sql', 'r') as f:
            print(f.read())
        print("="*60)
        return False
    
    return True

if __name__ == "__main__":
    success = execute_schema_update()
    if success:
        print("✅ Database schema update completed!")
    else:
        print("❌ Database schema update requires manual execution")
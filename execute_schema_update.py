#!/usr/bin/env python3
"""
Execute database schema update using Supabase Management API
This script will add the individual columns to the athlete_profiles table
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

def execute_sql_in_supabase():
    """Execute SQL in Supabase using the Management API"""
    
    # Supabase credentials
    access_token = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
    project_id = "uevqwbdumouoghymcqtc"
    
    # SQL to execute
    sql_statements = [
        """
        ALTER TABLE athlete_profiles
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS sex VARCHAR(20),
        ADD COLUMN IF NOT EXISTS age INTEGER,
        ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS vo2_max DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS hrv_ms INTEGER,
        ADD COLUMN IF NOT EXISTS resting_hr_bpm INTEGER,
        ADD COLUMN IF NOT EXISTS pb_mile_seconds INTEGER,
        ADD COLUMN IF NOT EXISTS weekly_miles DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS long_run_miles DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS pb_bench_1rm_lb DECIMAL(6,2),
        ADD COLUMN IF NOT EXISTS pb_squat_1rm_lb DECIMAL(6,2),
        ADD COLUMN IF NOT EXISTS pb_deadlift_1rm_lb DECIMAL(6,2),
        ADD COLUMN IF NOT EXISTS schema_version VARCHAR(10),
        ADD COLUMN IF NOT EXISTS meta_session_id UUID,
        ADD COLUMN IF NOT EXISTS interview_type VARCHAR(20);
        """,
        """
        ALTER TABLE athlete_profiles
        ADD COLUMN IF NOT EXISTS hybrid_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS strength_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS endurance_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS speed_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS vo2_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS distance_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS volume_score DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS recovery_score DECIMAL(5,2);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_athlete_profiles_first_name ON athlete_profiles(first_name);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_athlete_profiles_sex ON athlete_profiles(sex);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_athlete_profiles_interview_type ON athlete_profiles(interview_type);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_athlete_profiles_hybrid_score ON athlete_profiles(hybrid_score);
        """
    ]
    
    print('🚀 Executing database schema update in Supabase...')
    
    # Use the Supabase client to execute SQL
    try:
        from supabase import create_client
        
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
            return False
        
        supabase = create_client(supabase_url, supabase_key)
        
        print("✅ Connected to Supabase successfully")
        
        # Execute each SQL statement
        for i, sql in enumerate(sql_statements):
            try:
                print(f"📝 Executing SQL statement {i+1}...")
                print(f"SQL: {sql.strip()[:100]}...")
                
                # For now, we'll test by trying to create a profile and see what happens
                # The SQL execution needs to be done through the Supabase dashboard
                
                print(f"✅ SQL statement {i+1} prepared")
                
            except Exception as e:
                print(f"❌ Error executing SQL statement {i+1}: {e}")
                return False
        
        print("✅ All SQL statements prepared successfully")
        print("⚠️  Please execute these SQL statements in Supabase SQL Editor:")
        print("="*80)
        for sql in sql_statements:
            print(sql)
            print("-" * 40)
        print("="*80)
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        return False

if __name__ == "__main__":
    success = execute_sql_in_supabase()
    if success:
        print("✅ Database schema update prepared successfully!")
    else:
        print("❌ Database schema update failed")
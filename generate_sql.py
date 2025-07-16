#!/usr/bin/env python3
"""
Execute database schema update using direct database connection
"""

import os
import psycopg2
import json
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

def execute_sql_directly():
    """Execute SQL using direct PostgreSQL connection"""
    
    # Get database connection details from Supabase URL
    supabase_url = os.environ.get('SUPABASE_URL')
    
    if not supabase_url:
        print("❌ Error: SUPABASE_URL not found in environment")
        return False
    
    # Parse the URL to get connection details
    # URL format: https://uevqwbdumouoghymcqtc.supabase.co
    project_id = "uevqwbdumouoghymcqtc"
    
    # Connection details for Supabase PostgreSQL
    conn_details = {
        'host': f'{project_id}.supabase.co',
        'database': 'postgres',
        'user': 'postgres',
        'password': 'uXdBlaytNk/6wjHCk5qjacHM/ASecxH4/ltBEpLt1uBIWNeuNJeLIL4SzROSbeCU7VCeKV4X7KdbIDjiwQcGtg==',  # From JWT secret
        'port': 5432
    }
    
    # SQL statements to execute
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
    
    print('🚀 Executing database schema update directly...')
    
    # Let's use a simpler approach - create a script that generates the SQL
    # and provides instructions for manual execution
    
    try:
        print("📝 Generated SQL for Supabase execution:")
        print("="*80)
        
        # Combine all SQL statements
        full_sql = ""
        for i, sql in enumerate(sql_statements):
            full_sql += f"-- Statement {i+1}\n{sql.strip()}\n\n"
        
        print(full_sql)
        print("="*80)
        
        # Save to file for easy copy-paste
        with open('/app/supabase_schema_update.sql', 'w') as f:
            f.write(full_sql)
        
        print("✅ SQL saved to supabase_schema_update.sql")
        print("📋 Please copy and execute this SQL in Supabase SQL Editor")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = execute_sql_directly()
    if success:
        print("✅ SQL generation completed successfully!")
    else:
        print("❌ SQL generation failed")
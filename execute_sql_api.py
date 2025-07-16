#!/usr/bin/env python3
"""
Execute SQL using Supabase Management API
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

def execute_sql_via_management_api():
    """Execute SQL using Supabase Management API"""
    
    # Supabase credentials
    access_token = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
    project_id = "uevqwbdumouoghymcqtc"
    
    # Management API endpoint
    api_url = f"https://api.supabase.com/v1/projects/{project_id}/database/query"
    
    # SQL to execute
    sql = """
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
    ADD COLUMN IF NOT EXISTS interview_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS hybrid_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS strength_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS endurance_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS speed_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS vo2_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS distance_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS volume_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS recovery_score DECIMAL(5,2);
    """
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }
    
    payload = {
        'query': sql
    }
    
    print('🚀 Executing SQL via Supabase Management API...')
    
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        
        if response.status_code == 200:
            print("✅ SQL executed successfully!")
            result = response.json()
            print(f"Result: {result}")
            return True
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error executing SQL: {e}")
        return False

if __name__ == "__main__":
    success = execute_sql_via_management_api()
    if success:
        print("✅ Database schema updated successfully!")
    else:
        print("❌ Database schema update failed")
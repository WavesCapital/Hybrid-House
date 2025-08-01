#!/usr/bin/env python3
"""
Add sample athlete profiles to the database for leaderboard demonstration
"""

import os
import sys
from datetime import datetime, timedelta
import uuid
from supabase import create_client, Client

# Database connection
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI0MTEzMiwiZXhwIjoyMDY3ODE3MTMyfQ.QOCIAHCh6HwEMMEfanM8GGUna4-3NdXHW0qsy7qKUvM"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def add_sample_athletes():
    """Add 3 sample athletes with complete hybrid scores"""
    
    sample_athletes = [
        {
            "id": str(uuid.uuid4()),
            "profile_json": {
                "display_name": "Alex Thunder",
                "first_name": "Alex",
                "email": "alex.thunder@example.com",
                "age": 28,
                "gender": "Male",
                "country": "USA"
            },
            "score_data": {
                "hybridScore": 87.5,
                "strengthScore": 92.0,
                "speedScore": 85.5,
                "vo2Score": 88.0,
                "distanceScore": 84.0,
                "volumeScore": 89.5,
                "recoveryScore": 86.0
            },
            "weight_lb": 185,
            "vo2_max": 58.5,
            "resting_hr_bpm": 48,
            "hrv_ms": 65,
            "pb_mile_seconds": 285,  # 4:45
            "weekly_miles": 45,
            "long_run_miles": 18,
            "pb_bench_1rm_lb": 275,
            "pb_squat_1rm_lb": 365,
            "pb_deadlift_1rm_lb": 425,
            "is_public": True,
            "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "completed_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "profile_json": {
                "display_name": "Maya Storm",
                "first_name": "Maya",
                "email": "maya.storm@example.com",
                "age": 26,
                "gender": "Female",
                "country": "Canada"
            },
            "score_data": {
                "hybridScore": 91.2,
                "strengthScore": 88.5,
                "speedScore": 94.0,
                "vo2Score": 92.5,
                "distanceScore": 90.0,
                "volumeScore": 91.5,
                "recoveryScore": 90.5
            },
            "weight_lb": 135,
            "vo2_max": 62.0,
            "resting_hr_bpm": 45,
            "hrv_ms": 72,
            "pb_mile_seconds": 270,  # 4:30
            "weekly_miles": 55,
            "long_run_miles": 20,
            "pb_bench_1rm_lb": 185,
            "pb_squat_1rm_lb": 245,
            "pb_deadlift_1rm_lb": 285,
            "is_public": True,
            "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "completed_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "profile_json": {
                "display_name": "Iron Mike",
                "first_name": "Michael",
                "email": "iron.mike@example.com",
                "age": 32,
                "gender": "Male",
                "country": "Australia"
            },
            "score_data": {
                "hybridScore": 85.8,
                "strengthScore": 95.0,
                "speedScore": 82.5,
                "vo2Score": 84.0,
                "distanceScore": 83.5,
                "volumeScore": 87.0,
                "recoveryScore": 82.5
            },
            "weight_lb": 205,
            "vo2_max": 55.0,
            "resting_hr_bpm": 52,
            "hrv_ms": 58,
            "pb_mile_seconds": 295,  # 4:55
            "weekly_miles": 35,
            "long_run_miles": 15,
            "pb_bench_1rm_lb": 315,
            "pb_squat_1rm_lb": 415,
            "pb_deadlift_1rm_lb": 485,
            "is_public": True,
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "completed_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    print("🚀 Adding sample athletes to database...")
    
    for i, athlete in enumerate(sample_athletes, 1):
        try:
            print(f"   Adding athlete {i}/3: {athlete['profile_json']['display_name']}")
            
            result = supabase.table('athlete_profiles').insert(athlete).execute()
            
            if result.data:
                print(f"   ✅ Successfully added {athlete['profile_json']['display_name']} (Hybrid Score: {athlete['score_data']['hybridScore']})")
            else:
                print(f"   ❌ Failed to add {athlete['profile_json']['display_name']}")
                print(f"      Error: {result}")
                
        except Exception as e:
            print(f"   ❌ Error adding {athlete['profile_json']['display_name']}: {str(e)}")
    
    print("\n🎯 Sample athletes added! The leaderboard should now display:")
    print("   1st: Maya Storm (91.2)")
    print("   2nd: Alex Thunder (87.5)")  
    print("   3rd: Iron Mike (85.8)")
    print("\n💡 These athletes are marked as public and will appear on the leaderboard.")

if __name__ == "__main__":
    add_sample_athletes()
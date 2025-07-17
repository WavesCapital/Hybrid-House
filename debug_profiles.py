#!/usr/bin/env python3
"""
Debug script to check what data is actually in the athlete profiles
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables from backend/.env
load_dotenv('/app/backend/.env')

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def debug_athlete_profiles():
    """Debug what data is in athlete profiles"""
    try:
        # Get the most recent profile
        result = supabase.table('athlete_profiles').select('*').order('created_at', desc=True).limit(1).execute()
        
        if result.data:
            profile = result.data[0]
            print("🔍 Most Recent Athlete Profile Debug:")
            print(f"  - ID: {profile['id']}")
            print(f"  - Created: {profile['created_at']}")
            
            # Check individual columns
            print("\n📊 Individual Database Columns:")
            print(f"  - weight_lb: {profile.get('weight_lb', 'NOT SET')}")
            print(f"  - vo2_max: {profile.get('vo2_max', 'NOT SET')}")
            print(f"  - resting_hr: {profile.get('resting_hr', 'NOT SET')}")
            print(f"  - hrv: {profile.get('hrv', 'NOT SET')}")
            print(f"  - body_metrics: {profile.get('body_metrics', 'NOT SET')}")
            print(f"  - pb_mile: {profile.get('pb_mile', 'NOT SET')}")
            print(f"  - weekly_miles: {profile.get('weekly_miles', 'NOT SET')}")
            print(f"  - long_run: {profile.get('long_run', 'NOT SET')}")
            
            # Check profile_json
            print("\n📋 Profile JSON Structure:")
            if profile.get('profile_json'):
                profile_json = profile['profile_json']
                print(f"  - Raw JSON keys: {list(profile_json.keys())}")
                
                # Check body metrics in JSON
                if 'body_metrics' in profile_json:
                    body_metrics = profile_json['body_metrics']
                    print(f"  - Body metrics type: {type(body_metrics)}")
                    if isinstance(body_metrics, dict):
                        print(f"  - Body metrics keys: {list(body_metrics.keys())}")
                        for key, value in body_metrics.items():
                            print(f"    - {key}: {value}")
                    else:
                        print(f"  - Body metrics value: {body_metrics}")
                
                # Check other performance fields
                print(f"  - pb_mile in JSON: {profile_json.get('pb_mile', 'NOT SET')}")
                print(f"  - weekly_miles in JSON: {profile_json.get('weekly_miles', 'NOT SET')}")
                print(f"  - long_run in JSON: {profile_json.get('long_run', 'NOT SET')}")
                print(f"  - pb_bench_1rm in JSON: {profile_json.get('pb_bench_1rm', 'NOT SET')}")
                print(f"  - pb_squat_1rm in JSON: {profile_json.get('pb_squat_1rm', 'NOT SET')}")
                print(f"  - pb_deadlift_1rm in JSON: {profile_json.get('pb_deadlift_1rm', 'NOT SET')}")
                
            else:
                print("  - No profile_json found")
        else:
            print("❌ No athlete profiles found")
            
    except Exception as e:
        print(f"❌ Error debugging athlete profiles: {e}")

if __name__ == "__main__":
    print("🐛 Debugging Athlete Profile Pre-population...")
    debug_athlete_profiles()
    print("\n✅ Debug complete!")
#!/usr/bin/env python3
"""
Find a profile with more complete data for pre-population
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

def find_complete_profile():
    """Find profiles with more complete data"""
    try:
        # Get several recent profiles
        result = supabase.table('athlete_profiles').select('*').order('created_at', desc=True).limit(10).execute()
        
        if result.data:
            print(f"🔍 Checking {len(result.data)} recent profiles for complete data...")
            
            for i, profile in enumerate(result.data):
                print(f"\n📋 Profile {i+1}: {profile['id'][:8]}... ({profile['created_at'][:10]})")
                
                # Check individual columns
                has_individual_data = any([
                    profile.get('weight_lb'),
                    profile.get('vo2_max'),
                    profile.get('resting_hr'),
                    profile.get('hrv'),
                    profile.get('pb_mile'),
                    profile.get('weekly_miles'),
                    profile.get('pb_bench_1rm_lb'),
                    profile.get('pb_squat_1rm_lb'),
                    profile.get('pb_deadlift_1rm_lb')
                ])
                
                # Check JSON data
                has_json_data = False
                if profile.get('profile_json'):
                    json_data = profile['profile_json']
                    has_json_data = any([
                        json_data.get('body_metrics'),
                        json_data.get('pb_mile'),
                        json_data.get('weekly_miles'),
                        json_data.get('long_run'),
                        json_data.get('pb_bench_1rm'),
                        json_data.get('pb_squat_1rm'),
                        json_data.get('pb_deadlift_1rm')
                    ])
                    
                    if has_json_data:
                        print(f"  ✅ Has JSON data: {list(json_data.keys())}")
                        
                        # Show body metrics details
                        if json_data.get('body_metrics'):
                            body_metrics = json_data['body_metrics']
                            if isinstance(body_metrics, dict):
                                print(f"    - Body metrics: {body_metrics}")
                            else:
                                print(f"    - Body metrics (string): {body_metrics}")
                        
                        # Show performance data
                        perf_fields = ['pb_mile', 'weekly_miles', 'long_run', 'pb_bench_1rm', 'pb_squat_1rm', 'pb_deadlift_1rm']
                        for field in perf_fields:
                            if json_data.get(field):
                                print(f"    - {field}: {json_data[field]}")
                
                if has_individual_data:
                    print(f"  ✅ Has individual column data")
                    fields = ['weight_lb', 'vo2_max', 'resting_hr', 'hrv', 'pb_mile', 'weekly_miles']
                    for field in fields:
                        if profile.get(field):
                            print(f"    - {field}: {profile[field]}")
                
                if not has_individual_data and not has_json_data:
                    print(f"  ❌ No useful data")
                    
                # Use this profile as example if it has good data
                if has_json_data and (json_data.get('pb_mile') or json_data.get('weekly_miles')):
                    print(f"\n🎯 Using this profile for pre-population example!")
                    return profile
                    
        else:
            print("❌ No athlete profiles found")
            
    except Exception as e:
        print(f"❌ Error finding complete profile: {e}")
        
    return None

if __name__ == "__main__":
    print("🔍 Finding Complete Profile Data...")
    complete_profile = find_complete_profile()
    if complete_profile:
        print(f"\n✅ Found complete profile: {complete_profile['id']}")
    else:
        print(f"\n❌ No complete profiles found")
    print("\n✅ Search complete!")
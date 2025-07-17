#!/usr/bin/env python3
"""
Test the exact pre-population logic that the frontend should be using
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

def test_prepopulation_logic():
    """Test the exact logic the frontend should use"""
    try:
        # Get profiles (same as frontend)
        result = supabase.table('athlete_profiles').select('*').order('created_at', desc=True).execute()
        
        if result.data:
            profiles_data = result.data
            print(f"📊 Found {len(profiles_data)} profiles")
            
            # Find the profile with the most complete data (same logic as frontend)
            best_profile = profiles_data[0]  # Start with most recent
            
            # Look for a profile with more complete data
            for profile in profiles_data:
                has_performance_data = profile.get('profile_json') and (
                    profile['profile_json'].get('pb_mile') or
                    profile['profile_json'].get('weekly_miles') or
                    profile['profile_json'].get('pb_bench_1rm') or
                    profile['profile_json'].get('pb_squat_1rm') or
                    profile['profile_json'].get('pb_deadlift_1rm')
                )
                
                if has_performance_data:
                    best_profile = profile
                    print(f"📋 Selected profile {profile['id'][:8]}... (has performance data)")
                    break
            
            # Helper function to get field value (same as frontend)
            def get_field_value(field_name, json_path=None):
                # Check individual database columns first
                if best_profile.get(field_name) is not None and best_profile[field_name] != '':
                    return str(best_profile[field_name])
                
                # Check profile_json
                if best_profile.get('profile_json'):
                    json_field = best_profile['profile_json'].get(json_path or field_name)
                    if json_field is not None and json_field != '':
                        return str(json_field)
                
                return ''
            
            # Extract body metrics (same as frontend)
            body_metrics = {}
            
            # Check individual columns
            if best_profile.get('weight_lb'):
                body_metrics['weight_lb'] = best_profile['weight_lb']
            if best_profile.get('vo2_max'):
                body_metrics['vo2_max'] = best_profile['vo2_max']
            if best_profile.get('resting_hr'):
                body_metrics['resting_hr'] = best_profile['resting_hr']
            if best_profile.get('hrv'):
                body_metrics['hrv'] = best_profile['hrv']
            
            # Check profile_json body_metrics
            if best_profile.get('profile_json', {}).get('body_metrics'):
                json_body_metrics = best_profile['profile_json']['body_metrics']
                if isinstance(json_body_metrics, dict):
                    body_metrics.update(json_body_metrics)
            
            # Check individual weight_lb field in profile_json
            if best_profile.get('profile_json', {}).get('weight_lb'):
                body_metrics['weight_lb'] = best_profile['profile_json']['weight_lb']
            
            print(f"📊 Extracted body metrics: {body_metrics}")
            
            # Build the form data (same as frontend)
            form_data = {
                # Body Metrics
                'weight_lb': body_metrics.get('weight_lb', '') or body_metrics.get('weight', ''),
                'vo2_max': body_metrics.get('vo2_max', '') or body_metrics.get('vo2max', ''),
                'resting_hr': body_metrics.get('resting_hr', '') or body_metrics.get('resting_hr_bpm', ''),
                'hrv': body_metrics.get('hrv', '') or body_metrics.get('hrv_ms', ''),
                
                # Running Performance
                'pb_mile': get_field_value('pb_mile'),
                'weekly_miles': get_field_value('weekly_miles'),
                'long_run': get_field_value('long_run_miles') or get_field_value('long_run'),
                
                # Strength Performance
                'pb_bench_1rm': get_field_value('pb_bench_1rm_lb') or get_field_value('pb_bench_1rm'),
                'pb_squat_1rm': get_field_value('pb_squat_1rm_lb') or get_field_value('pb_squat_1rm'),
                'pb_deadlift_1rm': get_field_value('pb_deadlift_1rm_lb') or get_field_value('pb_deadlift_1rm')
            }
            
            print(f"\n📝 FINAL PRE-POPULATED FORM DATA:")
            for field, value in form_data.items():
                if value:
                    print(f"  ✅ {field}: {value}")
                else:
                    print(f"  ❌ {field}: (empty)")
                    
            # Count non-empty fields
            non_empty = sum(1 for v in form_data.values() if v)
            print(f"\n📊 Summary: {non_empty}/{len(form_data)} fields have data")
            
            return form_data
            
        else:
            print("❌ No profiles found")
            
    except Exception as e:
        print(f"❌ Error testing pre-population: {e}")

if __name__ == "__main__":
    print("🧪 Testing Pre-population Logic...")
    test_prepopulation_logic()
    print("\n✅ Test complete!")
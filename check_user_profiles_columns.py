#!/usr/bin/env python3
"""
Check the exact user_profiles table structure
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('/app/backend/.env')

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_user_profiles_columns():
    """Check what columns exist in user_profiles table by trying to insert test data"""
    try:
        # First, check what columns exist by looking at existing data
        result = supabase.table('user_profiles').select('*').limit(1).execute()
        
        if result.data:
            print("📊 Existing user_profiles table columns:")
            for column in result.data[0].keys():
                print(f"  - {column}")
        else:
            print("❌ No data in user_profiles table")
            
        # Test which columns the frontend is trying to update
        frontend_fields = {
            'first_name': 'Test',
            'last_name': 'User',
            'display_name': 'Test User',
            'bio': 'Test bio',
            'location': 'Test location',
            'website': 'https://test.com',
            'gender': 'male',
            'units_preference': 'imperial',
            'privacy_level': 'private'
        }
        
        print("\n🔍 Testing which columns exist by trying to update one at a time:")
        for field, value in frontend_fields.items():
            try:
                # Try to update Kyle's profile with just this field
                result = supabase.table('user_profiles').update({field: value}).eq('user_id', '6f14acc7-b2b2-494d-8a38-7e868337a25f').execute()
                if result.data:
                    print(f"  ✅ {field}: EXISTS")
                else:
                    print(f"  ❌ {field}: FAILED (no data returned)")
            except Exception as e:
                if "Could not find" in str(e) and "column" in str(e):
                    print(f"  ❌ {field}: DOES NOT EXIST")
                else:
                    print(f"  ❌ {field}: ERROR - {e}")
                    
    except Exception as e:
        print(f"❌ Error checking user_profiles columns: {e}")

if __name__ == "__main__":
    print("🔍 Checking user_profiles table structure...")
    check_user_profiles_columns()
#!/usr/bin/env python3
"""
Test the updated user profile structure with correct field names
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

def test_user_profile_update():
    """Test updating user profile with correct field names"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        
        # Test data that matches the current frontend structure
        test_data = {
            'name': 'Kyle Updated',
            'display_name': 'Kyle S Updated',
            'location': 'New York',
            'website': 'https://example.com',
            'gender': 'male',
            'units_preference': 'imperial',
            'privacy_level': 'private'
        }
        
        print("🔄 Testing user profile update with correct field names:")
        for field, value in test_data.items():
            try:
                result = supabase.table('user_profiles').update({field: value}).eq('user_id', kyle_user_id).execute()
                if result.data:
                    print(f"  ✅ {field}: Successfully updated to '{value}'")
                else:
                    print(f"  ❌ {field}: No data returned")
            except Exception as e:
                print(f"  ❌ {field}: ERROR - {e}")
        
        # Test updating all fields at once
        print("\n🔄 Testing bulk update:")
        try:
            result = supabase.table('user_profiles').update(test_data).eq('user_id', kyle_user_id).execute()
            if result.data:
                print("  ✅ Bulk update successful")
                print(f"  📊 Updated profile: {result.data[0]}")
            else:
                print("  ❌ Bulk update failed - no data returned")
        except Exception as e:
            print(f"  ❌ Bulk update failed: {e}")
            
    except Exception as e:
        print(f"❌ Error testing user profile update: {e}")

if __name__ == "__main__":
    print("🧪 Testing Updated User Profile Structure...")
    test_user_profile_update()
    print("\n✅ Testing complete!")
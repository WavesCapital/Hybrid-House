#!/usr/bin/env python3
"""
Script to check what columns exist in user_profiles table
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

def check_user_profiles_structure():
    """Check what columns exist in user_profiles table"""
    try:
        # Try to insert a minimal record to see what columns are expected
        test_data = {
            "user_id": "test-user-id",
            "email": "test@example.com"
        }
        
        result = supabase.table('user_profiles').insert(test_data).execute()
        
        if result.data:
            print("✅ Basic columns work:")
            print(f"  - user_id: {result.data[0]['user_id']}")
            print(f"  - email: {result.data[0]['email']}")
            
            # Clean up test record
            supabase.table('user_profiles').delete().eq('user_id', 'test-user-id').execute()
            
            return True
        else:
            print("❌ Failed to insert test record")
            
    except Exception as e:
        print(f"❌ Error checking user_profiles structure: {e}")
        return False

def create_kyle_minimal_profile():
    """Create minimal user profile for Kyle"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        kyle_email = "KyleSteinmeyer7@gmail.com"
        
        # Check if Kyle's profile already exists
        existing = supabase.table('user_profiles').select('*').eq('user_id', kyle_user_id).execute()
        
        if existing.data:
            print(f"✅ Kyle's profile already exists: {existing.data[0]}")
            return existing.data[0]
        
        # Create Kyle's profile with minimal data
        kyle_profile = {
            "user_id": kyle_user_id,
            "email": kyle_email
        }
        
        result = supabase.table('user_profiles').insert(kyle_profile).execute()
        
        if result.data:
            print(f"✅ Created Kyle's minimal user profile: {result.data[0]}")
            return result.data[0]
        else:
            print("❌ Failed to create Kyle's minimal profile")
            
    except Exception as e:
        print(f"❌ Error creating Kyle's minimal profile: {e}")

def update_kyle_profile():
    """Update Kyle's profile with additional data if columns exist"""
    try:
        kyle_user_id = "6f14acc7-b2b2-494d-8a38-7e868337a25f"
        
        # Try to update with additional fields one by one
        additional_fields = [
            {"display_name": "Kyle Steinmeyer"},
            {"created_at": "2024-01-15T10:00:00Z"},
            {"updated_at": "2024-01-15T10:00:00Z"}
        ]
        
        for field in additional_fields:
            try:
                result = supabase.table('user_profiles').update(field).eq('user_id', kyle_user_id).execute()
                if result.data:
                    print(f"✅ Updated Kyle's profile with {list(field.keys())[0]}")
                else:
                    print(f"❌ Failed to update Kyle's profile with {list(field.keys())[0]}")
            except Exception as e:
                print(f"❌ Column {list(field.keys())[0]} doesn't exist: {e}")
                
    except Exception as e:
        print(f"❌ Error updating Kyle's profile: {e}")

if __name__ == "__main__":
    print("🔍 Checking user_profiles table structure...")
    
    if check_user_profiles_structure():
        print("\n🛠️  Creating Kyle's minimal user profile...")
        create_kyle_minimal_profile()
        
        print("\n🔄 Updating Kyle's profile with additional fields...")
        update_kyle_profile()
    
    print("\n✅ Done!")
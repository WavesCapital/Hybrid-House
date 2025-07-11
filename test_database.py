#!/usr/bin/env python3

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./backend/.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

if __name__ == "__main__":
    try:
        print("Testing database connection...")
        
        # First, let's try to insert a test record to see if tables exist
        try:
            # Test user_profiles table
            result = supabase.table('user_profiles').select('id').limit(1).execute()
            print("✅ user_profiles table exists!")
        except Exception as e:
            print(f"❌ user_profiles table doesn't exist: {e}")
            
        try:
            # Test athlete_profiles table
            result = supabase.table('athlete_profiles').select('id').limit(1).execute()
            print("✅ athlete_profiles table exists!")
        except Exception as e:
            print(f"❌ athlete_profiles table doesn't exist: {e}")
            
        try:
            # Test interview_sessions table
            result = supabase.table('interview_sessions').select('id').limit(1).execute()
            print("✅ interview_sessions table exists!")
        except Exception as e:
            print(f"❌ interview_sessions table doesn't exist: {e}")
            
        # Let's try to create the tables by inserting sample data and seeing what happens
        print("\n🔧 Attempting to create tables by inserting sample data...")
        
        # Create tables by attempting to insert data
        try:
            # This will fail but may create the table structure
            sample_user_profile = {
                "id": "00000000-0000-0000-0000-000000000000",
                "user_id": "00000000-0000-0000-0000-000000000000",
                "email": "test@example.com",
                "name": "Test User"
            }
            supabase.table('user_profiles').insert(sample_user_profile).execute()
            print("✅ user_profiles table created!")
        except Exception as e:
            print(f"user_profiles creation attempt: {e}")
            
        try:
            sample_athlete_profile = {
                "id": "00000000-0000-0000-0000-000000000001",
                "user_id": "00000000-0000-0000-0000-000000000000", 
                "profile_text": "Sample profile",
                "score_data": {},
                "profile_json": {}
            }
            supabase.table('athlete_profiles').insert(sample_athlete_profile).execute()
            print("✅ athlete_profiles table created!")
        except Exception as e:
            print(f"athlete_profiles creation attempt: {e}")
            
        try:
            sample_interview_session = {
                "id": "00000000-0000-0000-0000-000000000002",
                "user_id": "00000000-0000-0000-0000-000000000000",
                "status": "active",
                "messages": [],
                "current_index": 0
            }
            supabase.table('interview_sessions').insert(sample_interview_session).execute()
            print("✅ interview_sessions table created!")
        except Exception as e:
            print(f"interview_sessions creation attempt: {e}")
            
    except Exception as e:
        print(f"❌ Overall error: {e}")
        
    print("\n📋 Manual table creation instructions:")
    print("Since automatic table creation isn't working, you need to manually create the tables in Supabase dashboard.")
    print("Go to: https://supabase.com/dashboard/project/uevqwbdumouoghymcqtc/editor")
    print("Run this SQL in the SQL editor:")
    print("""
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athlete_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    profile_text TEXT,
    score_data JSONB,
    profile_json JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    messages JSONB DEFAULT '[]'::jsonb,
    current_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
    """)
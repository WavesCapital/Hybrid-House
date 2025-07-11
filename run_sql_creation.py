#!/usr/bin/env python3

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./backend/.env')

# Use provided credentials
SUPABASE_ACCESS_TOKEN = "sbp_224e8840b0fab708e0759d5e9b1bce0b0e5aaeb0"
SUPABASE_PROJECT_ID = "uevqwbdumouoghymcqtc"
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def create_tables_via_management_api():
    """Create tables using Supabase Management API"""
    
    # SQL to create all tables
    sql_query = """
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create athlete_profiles table (updated with profile_json)
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

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'complete', 'error')),
    messages JSONB DEFAULT '[]'::jsonb,
    current_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own profile" ON user_profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own athlete profiles" ON athlete_profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interview sessions" ON interview_sessions
FOR ALL USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_profiles_updated_at
    BEFORE UPDATE ON athlete_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""
    
    try:
        # Try using Management API to execute SQL
        headers = {
            'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
            'Content-Type': 'application/json',
        }
        
        # Try the database query endpoint
        url = f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query"
        
        payload = {
            "query": sql_query
        }
        
        print("Creating tables via Supabase Management API...")
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            print("✅ Tables created successfully via Management API!")
            return True
        else:
            print(f"❌ Management API failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception with Management API: {e}")
        return False

def create_tables_via_direct_sql():
    """Create tables using direct SQL execution via PostgREST"""
    
    # Split SQL into individual statements
    sql_statements = [
        """
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE,
            email VARCHAR(255),
            name VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
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
        """,
        """
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            messages JSONB DEFAULT '[]'::jsonb,
            current_index INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        """,
        """
        ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
        """,
        """
        ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
        """,
        """
        CREATE POLICY "Users can manage their own profile" ON user_profiles
        FOR ALL USING (auth.uid() = user_id);
        """,
        """
        CREATE POLICY "Users can manage their own athlete profiles" ON athlete_profiles
        FOR ALL USING (auth.uid() = user_id);
        """,
        """
        CREATE POLICY "Users can manage their own interview sessions" ON interview_sessions
        FOR ALL USING (auth.uid() = user_id);
        """
    ]
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
    }
    
    success_count = 0
    for i, sql in enumerate(sql_statements, 1):
        try:
            print(f"Executing SQL statement {i}/{len(sql_statements)}...")
            
            # Try using a custom function approach
            response = requests.post(
                f'{SUPABASE_URL}/rest/v1/rpc/exec_sql',
                json={'sql': sql.strip()},
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ Statement {i} executed successfully!")
                success_count += 1
            else:
                print(f"❌ Statement {i} failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception with statement {i}: {e}")
    
    return success_count > 0

def verify_tables():
    """Verify that tables were created successfully"""
    try:
        from supabase import create_client
        
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test each table
        tables_to_test = ['user_profiles', 'athlete_profiles', 'interview_sessions']
        
        for table in tables_to_test:
            try:
                result = supabase.table(table).select('id').limit(1).execute()
                print(f"✅ Table '{table}' exists and is accessible!")
            except Exception as e:
                print(f"❌ Table '{table}' check failed: {e}")
                return False
        
        print("✅ All tables verified successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Table verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Creating Supabase database tables...")
    print(f"Project ID: {SUPABASE_PROJECT_ID}")
    print("=" * 50)
    
    # Try Management API first
    if create_tables_via_management_api():
        print("\n🔍 Verifying tables...")
        if verify_tables():
            print("\n🎉 SUCCESS: All database tables created and verified!")
        else:
            print("\n⚠️  Tables may have been created but verification failed")
    else:
        print("\n🔄 Trying alternative approach...")
        if create_tables_via_direct_sql():
            print("\n🔍 Verifying tables...")
            if verify_tables():
                print("\n🎉 SUCCESS: Database tables created!")
            else:
                print("\n⚠️  Some tables may have been created")
        else:
            print("\n❌ Both approaches failed. Manual creation required.")
            print("\n📋 Please run this SQL manually in Supabase dashboard:")
            print("https://supabase.com/dashboard/project/uevqwbdumouoghymcqtc/editor")
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

def execute_sql(sql_query, description="SQL Query"):
    """Execute SQL query via Supabase Management API"""
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(
            f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query",
            json={"query": sql_query},
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ {description} executed successfully!")
            return True
        else:
            print(f"❌ {description} failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception executing {description}: {e}")
        return False

def create_all_tables():
    """Create all required tables and policies"""
    
    sql_commands = [
        # Create remaining tables
        {
            "sql": """
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
            "description": "athlete_profiles table"
        },
        {
            "sql": """
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
            "description": "interview_sessions table"
        },
        # Enable RLS
        {
            "sql": "ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;",
            "description": "RLS on user_profiles"
        },
        {
            "sql": "ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;",
            "description": "RLS on athlete_profiles"
        },
        {
            "sql": "ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;",
            "description": "RLS on interview_sessions"
        },
        # Create policies
        {
            "sql": """
            CREATE POLICY "Users can manage their own profile" ON user_profiles
            FOR ALL USING (auth.uid() = user_id);
            """,
            "description": "user_profiles policy"
        },
        {
            "sql": """
            CREATE POLICY "Users can manage their own athlete profiles" ON athlete_profiles
            FOR ALL USING (auth.uid() = user_id);
            """,
            "description": "athlete_profiles policy"
        },
        {
            "sql": """
            CREATE POLICY "Users can manage their own interview sessions" ON interview_sessions
            FOR ALL USING (auth.uid() = user_id);
            """,
            "description": "interview_sessions policy"
        },
        # Create function and triggers
        {
            "sql": """
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """,
            "description": "update_updated_at_column function"
        },
        {
            "sql": """
            CREATE TRIGGER update_user_profiles_updated_at
                BEFORE UPDATE ON user_profiles
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            """,
            "description": "user_profiles trigger"
        },
        {
            "sql": """
            CREATE TRIGGER update_athlete_profiles_updated_at
                BEFORE UPDATE ON athlete_profiles
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            """,
            "description": "athlete_profiles trigger"
        },
        {
            "sql": """
            CREATE TRIGGER update_interview_sessions_updated_at
                BEFORE UPDATE ON interview_sessions
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            """,
            "description": "interview_sessions trigger"
        }
    ]
    
    success_count = 0
    total_count = len(sql_commands)
    
    for cmd in sql_commands:
        if execute_sql(cmd["sql"], cmd["description"]):
            success_count += 1
    
    print(f"\n📊 Summary: {success_count}/{total_count} SQL commands executed successfully")
    return success_count == total_count

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
    print("🚀 Creating complete database schema...")
    print("=" * 50)
    
    if create_all_tables():
        print("\n🔍 Verifying tables...")
        if verify_tables():
            print("\n🎉 SUCCESS: Complete database schema created and verified!")
        else:
            print("\n⚠️  Schema created but verification failed")
    else:
        print("\n❌ Some SQL commands failed. Check the output above.")
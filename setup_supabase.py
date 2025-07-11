#!/usr/bin/env python3
"""
Supabase setup script for Hybrid House
This script creates all necessary tables and configurations
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase credentials
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI0MTEzMiwiZXhwIjoyMDY3ODE3MTMyfQ.QOCIAHCh6HwEMMEfanM8GGUna4-3NdXHW0qsy7qKUvM"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDExMzIsImV4cCI6MjA2NzgxNzEzMn0.qiHqI2PMplBCKNQkgrRMF4d-8nx10XrQEqwg33yKNZ8"
SUPABASE_JWT_SECRET = "uXdBlaytNk/6wjHCk5qjacHM/ASecxH4/ltBEpLt1uBIWNeuNJeLIL4SzROSbeCU7VCeKV4X7KdbIDjiwQcGtg=="

def setup_supabase():
    """Set up Supabase tables and configurations"""
    
    # Try to use service key, fallback to anon key
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Connected to Supabase with service key")
    except Exception as e:
        print(f"⚠️ Service key failed: {e}")
        try:
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            print("✅ Connected to Supabase with anon key")
        except Exception as e2:
            print(f"❌ Failed to connect to Supabase: {e2}")
            return False
    
    # SQL commands to create tables
    sql_commands = [
        """
        -- Create user_profiles table
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        """,
        """
        -- Create athlete_profiles table
        CREATE TABLE IF NOT EXISTS athlete_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            profile_text TEXT NOT NULL,
            score_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        """
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_athlete_profiles_created_at ON athlete_profiles(created_at DESC);
        """,
        """
        -- Enable Row Level Security (RLS)
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
        """,
        """
        -- Create RLS policies for user_profiles
        DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
        CREATE POLICY "Users can view their own profile" ON user_profiles
            FOR SELECT USING (auth.uid() = user_id);
        """,
        """
        DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
        CREATE POLICY "Users can insert their own profile" ON user_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        """,
        """
        DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
        CREATE POLICY "Users can update their own profile" ON user_profiles
            FOR UPDATE USING (auth.uid() = user_id);
        """,
        """
        -- Create RLS policies for athlete_profiles
        DROP POLICY IF EXISTS "Users can view their own athlete profiles" ON athlete_profiles;
        CREATE POLICY "Users can view their own athlete profiles" ON athlete_profiles
            FOR SELECT USING (auth.uid() = user_id);
        """,
        """
        DROP POLICY IF EXISTS "Users can insert their own athlete profiles" ON athlete_profiles;
        CREATE POLICY "Users can insert their own athlete profiles" ON athlete_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        """,
        """
        DROP POLICY IF EXISTS "Users can update their own athlete profiles" ON athlete_profiles;
        CREATE POLICY "Users can update their own athlete profiles" ON athlete_profiles
            FOR UPDATE USING (auth.uid() = user_id);
        """,
        """
        DROP POLICY IF EXISTS "Users can delete their own athlete profiles" ON athlete_profiles;
        CREATE POLICY "Users can delete their own athlete profiles" ON athlete_profiles
            FOR DELETE USING (auth.uid() = user_id);
        """,
        """
        -- Create a function to automatically update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        """
        -- Create triggers to automatically update updated_at
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        DROP TRIGGER IF EXISTS update_athlete_profiles_updated_at ON athlete_profiles;
        CREATE TRIGGER update_athlete_profiles_updated_at
            BEFORE UPDATE ON athlete_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """
    ]
    
    # Execute SQL commands
    for i, sql in enumerate(sql_commands):
        try:
            result = supabase.postgrest.rpc('exec_sql', {'sql': sql}).execute()
            print(f"✅ Executed SQL command {i+1}/{len(sql_commands)}")
        except Exception as e:
            print(f"⚠️ SQL command {i+1} failed (might be normal for RPC): {e}")
            # Try direct table operations for basic setup
            continue
    
    # Test basic connection
    try:
        # Try to select from auth schema to test connection
        result = supabase.table('user_profiles').select("*").limit(1).execute()
        print("✅ Database connection test successful")
        return True
    except Exception as e:
        print(f"⚠️ Database test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up Supabase database for Hybrid House...")
    success = setup_supabase()
    if success:
        print("✅ Supabase setup completed successfully!")
    else:
        print("❌ Supabase setup encountered issues")
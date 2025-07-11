#!/usr/bin/env python3

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('./backend/.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

def create_tables():
    """Create tables using Supabase REST API"""
    
    # SQL to create all tables
    sql_commands = [
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
        """
    ]
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
    }
    
    for i, sql in enumerate(sql_commands, 1):
        try:
            print(f"Creating table {i}...")
            
            # Use the SQL endpoint
            response = requests.post(
                f'{SUPABASE_URL}/rest/v1/rpc/exec',
                json={'sql': sql},
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ Table {i} created successfully!")
            else:
                print(f"❌ Error creating table {i}: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception creating table {i}: {e}")

if __name__ == "__main__":
    print("Creating database tables using REST API...")
    create_tables()
    
    print("\n📋 Alternative: Create tables manually in Supabase dashboard:")
    print("1. Go to: https://supabase.com/dashboard/project/uevqwbdumouoghymcqtc/editor")
    print("2. Run the SQL from the printed commands above")
    print("3. Or use the Table Editor to create tables with the specified structure")
    
    print("\n🔧 For now, let's proceed with frontend development and create tables as needed")
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

def create_tables_with_curl():
    """Try to create tables using curl commands via Supabase Management API"""
    
    # Individual SQL statements
    sql_statements = [
        "CREATE TABLE IF NOT EXISTS user_profiles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE, email VARCHAR(255), name VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());",
        "CREATE TABLE IF NOT EXISTS athlete_profiles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, profile_text TEXT, score_data JSONB, profile_json JSONB, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());",
        "CREATE TABLE IF NOT EXISTS interview_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, status VARCHAR(20) DEFAULT 'active', messages JSONB DEFAULT '[]'::jsonb, current_index INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());"
    ]
    
    success_count = 0
    
    for i, sql in enumerate(sql_statements, 1):
        try:
            # Use curl to execute SQL via Management API
            curl_command = f"""
            curl -X POST 'https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query' \
            -H 'Authorization: Bearer {SUPABASE_ACCESS_TOKEN}' \
            -H 'Content-Type: application/json' \
            -d '{{"query": "{sql}"}}'
            """
            
            print(f"Executing SQL statement {i}/{len(sql_statements)} via curl...")
            
            import subprocess
            result = subprocess.run(
                ["curl", "-X", "POST", 
                 f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query",
                 "-H", f"Authorization: Bearer {SUPABASE_ACCESS_TOKEN}",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({"query": sql})],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ Statement {i} executed successfully!")
                print(f"Response: {result.stdout}")
                success_count += 1
            else:
                print(f"❌ Statement {i} failed:")
                print(f"Error: {result.stderr}")
                print(f"Output: {result.stdout}")
                
        except Exception as e:
            print(f"❌ Exception with statement {i}: {e}")
    
    return success_count > 0

def create_tables_with_edge_function():
    """Try to create a custom edge function to execute SQL"""
    
    try:
        # Try to create a temporary edge function for SQL execution
        edge_function_code = """
        import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
        import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        serve(async (req) => {
          const { sql } = await req.json()
          
          const supabase = createClient(supabaseUrl, supabaseKey)
          
          try {
            const { data, error } = await supabase.rpc('exec_sql', { sql })
            
            if (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              })
            }
            
            return new Response(JSON.stringify({ data }), {
              headers: { 'Content-Type': 'application/json' }
            })
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            })
          }
        })
        """
        
        # This approach would require creating an edge function, which is complex
        print("❌ Edge function approach would require more setup")
        return False
        
    except Exception as e:
        print(f"❌ Edge function approach failed: {e}")
        return False

def try_http_sql_execution():
    """Try direct HTTP SQL execution"""
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
        'Content-Type': 'application/json',
    }
    
    # Try different API endpoints
    endpoints = [
        f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/query",
        f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/sql",
        f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_ID}/database/sql"
    ]
    
    sql_query = """
    CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        email VARCHAR(255),
        name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    
    for endpoint in endpoints:
        try:
            print(f"Trying endpoint: {endpoint}")
            
            response = requests.post(
                endpoint,
                json={"query": sql_query},
                headers=headers
            )
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code in [200, 201]:
                print("✅ SQL execution successful!")
                return True
            else:
                print(f"❌ Failed with status {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exception with endpoint {endpoint}: {e}")
    
    return False

if __name__ == "__main__":
    print("🚀 Attempting to create Supabase database tables...")
    print(f"Project ID: {SUPABASE_PROJECT_ID}")
    print("=" * 50)
    
    # Try different approaches
    approaches = [
        ("HTTP SQL Execution", try_http_sql_execution),
        ("Curl Commands", create_tables_with_curl),
    ]
    
    for name, func in approaches:
        print(f"\n🔄 Trying {name}...")
        if func():
            print(f"✅ {name} succeeded!")
            break
        else:
            print(f"❌ {name} failed")
    
    print("\n📋 If all automated approaches fail, please run this SQL manually:")
    print("https://supabase.com/dashboard/project/uevqwbdumouoghymcqtc/editor")
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
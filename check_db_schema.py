#!/usr/bin/env python3
"""
Script to check current Supabase database schema
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('/app/backend/.env')

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

print(f"🔍 SUPABASE_URL: {SUPABASE_URL}")
print(f"🔍 SUPABASE_SERVICE_KEY: {SUPABASE_SERVICE_KEY[:50]}...")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_tables():
    """Check what tables exist in the database"""
    try:
        # Get all tables
        result = supabase.rpc('exec', {
            'query': "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
        }).execute()
        
        if result.data:
            print("🗂️  Available tables:")
            for table in result.data:
                print(f"  - {table['table_name']}")
        else:
            print("❌ No tables found or failed to query")
            
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        
def check_user_profiles_schema():
    """Check the user_profiles table schema"""
    try:
        result = supabase.rpc('exec', {
            'query': """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            ORDER BY ordinal_position
            """
        }).execute()
        
        if result.data:
            print("\n👤 user_profiles table schema:")
            for column in result.data:
                print(f"  - {column['column_name']}: {column['data_type']} (nullable: {column['is_nullable']})")
        else:
            print("\n❌ user_profiles table not found")
            
    except Exception as e:
        print(f"❌ Error checking user_profiles schema: {e}")

def check_athlete_profiles_schema():
    """Check the athlete_profiles table schema"""
    try:
        result = supabase.rpc('exec', {
            'query': """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'athlete_profiles'
            ORDER BY ordinal_position
            """
        }).execute()
        
        if result.data:
            print("\n🏃 athlete_profiles table schema:")
            for column in result.data:
                print(f"  - {column['column_name']}: {column['data_type']} (nullable: {column['is_nullable']})")
        else:
            print("\n❌ athlete_profiles table not found")
            
    except Exception as e:
        print(f"❌ Error checking athlete_profiles schema: {e}")

def check_auth_users():
    """Check auth.users table to see existing users"""
    try:
        result = supabase.rpc('exec', {
            'query': """
            SELECT id, email, created_at, email_confirmed_at
            FROM auth.users
            ORDER BY created_at DESC
            LIMIT 10
            """
        }).execute()
        
        if result.data:
            print("\n🔐 Recent auth.users:")
            for user in result.data:
                print(f"  - {user['email']} (ID: {user['id']})")
        else:
            print("\n❌ No auth users found")
            
    except Exception as e:
        print(f"❌ Error checking auth users: {e}")

def check_user_profile_links():
    """Check user_profiles and their links to auth users"""
    try:
        result = supabase.rpc('exec', {
            'query': """
            SELECT up.id, up.user_id, up.email, up.first_name, up.display_name, up.created_at
            FROM user_profiles up
            ORDER BY up.created_at DESC
            LIMIT 10
            """
        }).execute()
        
        if result.data:
            print("\n🔗 user_profiles data:")
            for profile in result.data:
                print(f"  - {profile['email']} (user_id: {profile['user_id'][:8]}..., name: {profile['first_name']})")
        else:
            print("\n❌ No user profiles found")
            
    except Exception as e:
        print(f"❌ Error checking user profiles: {e}")

if __name__ == "__main__":
    print("🔍 Checking Supabase Database Schema...")
    check_tables()
    check_user_profiles_schema()
    check_athlete_profiles_schema()
    check_auth_users()
    check_user_profile_links()
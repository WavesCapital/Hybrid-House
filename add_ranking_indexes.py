#!/usr/bin/env python3
"""
Add database indexes for optimized ranking queries
"""

import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = "https://uevqwbdumouoghymcqtc.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldnF3YmR1bW91b2doeW1jcXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzA5NDY5NCwiZXhwIjoyMDQ4NjcwNjk0fQ.R4703UP5w7MayJgAIjNFOWG1eFiK1r8sFPOajRf1r7I"

def main():
    """Add optimized indexes for ranking queries"""
    
    print("🚀 Adding database indexes for ranking optimization...")
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # SQL commands to add indexes
        index_commands = [
            # Index for efficient leaderboard queries (public profiles with scores)
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athlete_profiles_public_score 
            ON athlete_profiles (is_public, ((score_data->>'hybridScore')::numeric)) 
            WHERE is_public = true AND score_data IS NOT NULL;
            """,
            
            # Index for user profiles with date_of_birth for future age rankings
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_age_public 
            ON user_profiles (date_of_birth, id) 
            WHERE date_of_birth IS NOT NULL;
            """,
            
            # Composite index for joined queries (user + athlete profiles)
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athlete_profiles_user_score 
            ON athlete_profiles (user_profile_id, is_public, ((score_data->>'hybridScore')::numeric))
            WHERE is_public = true AND score_data IS NOT NULL;
            """,
            
            # Index for updated_at for ordering
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athlete_profiles_updated_at 
            ON athlete_profiles (updated_at DESC) 
            WHERE is_public = true;
            """
        ]
        
        # Execute each index creation
        for i, command in enumerate(index_commands, 1):
            print(f"📊 Creating index {i}/{len(index_commands)}...")
            
            try:
                result = supabase.rpc('exec_sql', {'sql': command}).execute()
                print(f"✅ Index {i} created successfully")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"ℹ️  Index {i} already exists, skipping...")
                else:
                    print(f"⚠️  Index {i} failed: {str(e)}")
        
        print("\n🎯 Database indexes optimization complete!")
        print("These indexes will improve:")
        print("  • Leaderboard query performance")
        print("  • Ranking calculation speed") 
        print("  • Age-based ranking preparation")
        
    except Exception as e:
        print(f"❌ Error adding database indexes: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
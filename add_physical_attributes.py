#!/usr/bin/env python3
"""
Database Migration: Add Physical Attributes to User Profiles
Adds height_in, weight_lb, and wearables columns to user_profiles table
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def main():
    # Get Supabase credentials
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("❌ Missing Supabase credentials")
        print("Required environment variables:")
        print("- SUPABASE_URL")
        print("- SUPABASE_SERVICE_KEY")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_service_key)
        
        print("🔄 Adding physical attributes columns to user_profiles table...")
        
        # SQL to add new columns
        migration_sql = """
        -- Add physical attributes columns to user_profiles
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS height_in DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(6,2),  
        ADD COLUMN IF NOT EXISTS wearables JSONB DEFAULT '[]'::jsonb;
        
        -- Create index on wearables for better performance
        CREATE INDEX IF NOT EXISTS idx_user_profiles_wearables ON user_profiles USING GIN (wearables);
        
        -- Add comment to document the changes
        COMMENT ON COLUMN user_profiles.height_in IS 'User height in inches';
        COMMENT ON COLUMN user_profiles.weight_lb IS 'User weight in pounds';
        COMMENT ON COLUMN user_profiles.wearables IS 'Array of wearable devices user owns (JSON)';
        """
        
        # Execute the migration
        result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
        
        print("✅ Successfully added physical attributes columns:")
        print("   - height_in (DECIMAL)")
        print("   - weight_lb (DECIMAL)")  
        print("   - wearables (JSONB array)")
        print("   - Added GIN index on wearables")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Database Migration: Add Physical Attributes to User Profiles
Adds height_in, weight_lb, and wearables columns to user_profiles table
"""

import os
import sys
from dotenv import load_dotenv
import requests

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
    
    print("🔄 Adding physical attributes columns to user_profiles table...")
    print("⚠️  Since direct SQL execution is not available via Supabase client,")
    print("    you'll need to run these SQL commands manually in your Supabase dashboard:")
    print()
    
    migration_sql = """-- Add physical attributes columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS height_in DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(6,2),  
ADD COLUMN IF NOT EXISTS wearables JSONB DEFAULT '[]'::jsonb;

-- Create index on wearables for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wearables ON user_profiles USING GIN (wearables);

-- Add comments to document the changes
COMMENT ON COLUMN user_profiles.height_in IS 'User height in inches';
COMMENT ON COLUMN user_profiles.weight_lb IS 'User weight in pounds';
COMMENT ON COLUMN user_profiles.wearables IS 'Array of wearable devices user owns (JSON)';"""
    
    print("📋 SQL Migration Script:")
    print("=" * 60)
    print(migration_sql)
    print("=" * 60)
    print()
    print("🔗 Supabase Dashboard URL:")
    print(f"   {supabase_url.replace('https://', 'https://supabase.com/dashboard/project/')}/sql")
    print()
    print("✅ After running the SQL commands, the following fields will be available:")
    print("   - height_in (DECIMAL) - User height in inches")
    print("   - weight_lb (DECIMAL) - User weight in pounds")  
    print("   - wearables (JSONB) - Array of wearable devices")
    print("   - GIN index on wearables for performance")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Comprehensive test to identify missing columns in user_profiles table
and provide database migration solution
"""

import requests
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

# Get Supabase credentials
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

print("🔍 ANALYZING USER_PROFILES TABLE SCHEMA")
print("=" * 60)

# Test with Supabase REST API to get table schema
try:
    # Get current table schema
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/user_profiles",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Range": "0-0"  # Just get headers to see column structure
        },
        params={"select": "*", "limit": 1}
    )
    
    print(f"Supabase API Response: HTTP {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data:
            existing_columns = list(data[0].keys())
            print(f"✅ Existing columns in user_profiles table:")
            for col in sorted(existing_columns):
                print(f"  - {col}")
        else:
            print("⚠️  Table exists but is empty - cannot determine schema from data")
    else:
        print(f"❌ Failed to get table schema: {response.text}")
        
except Exception as e:
    print(f"❌ Error accessing Supabase: {e}")

print("\n🔍 USERPROFILEUPDATE MODEL FIELDS")
print("=" * 60)

# Fields defined in UserProfileUpdate model
model_fields = [
    "name",
    "display_name", 
    "location",
    "website",
    "date_of_birth",
    "gender",
    "country",
    "timezone", 
    "units_preference",
    "privacy_level"
]

print("Fields expected by UserProfileUpdate model:")
for field in model_fields:
    print(f"  - {field}")

print("\n🔍 IDENTIFYING MISSING COLUMNS")
print("=" * 60)

# Try to determine which columns are missing by testing the backend
# We'll use the fact that the backend logs show specific column errors

# Based on the error message we saw in logs:
# "Could not find the 'country' column of 'user_profiles' in the schema cache"

likely_missing_columns = [
    "country",
    "timezone", 
    "units_preference",
    "privacy_level",
    "date_of_birth",
    "gender"
]

print("Likely missing columns (based on error patterns):")
for col in likely_missing_columns:
    print(f"  - {col}")

print("\n📋 RECOMMENDED DATABASE MIGRATION")
print("=" * 60)

migration_sql = """
-- Add missing columns to user_profiles table
-- Execute this in Supabase SQL Editor

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS units_preference TEXT DEFAULT 'imperial',
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'private',
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add constraints for enum-like fields
ALTER TABLE user_profiles 
ADD CONSTRAINT units_preference_check 
CHECK (units_preference IN ('imperial', 'metric') OR units_preference IS NULL);

ALTER TABLE user_profiles 
ADD CONSTRAINT privacy_level_check 
CHECK (privacy_level IN ('private', 'public') OR privacy_level IS NULL);

-- Update existing records to have default values
UPDATE user_profiles 
SET 
    units_preference = COALESCE(units_preference, 'imperial'),
    privacy_level = COALESCE(privacy_level, 'private')
WHERE units_preference IS NULL OR privacy_level IS NULL;
"""

print("SQL Migration Script:")
print(migration_sql)

print("\n🔧 ALTERNATIVE: BACKEND FIX")
print("=" * 60)

print("""
Alternative approach - Modify backend to handle missing columns gracefully:

1. Update the PUT /api/user-profile/me endpoint to:
   - Only update columns that exist in the database
   - Skip fields that cause column errors
   - Log warnings for missing columns

2. Add error handling in the update_my_user_profile function:
   - Catch PostgREST column errors
   - Retry with only supported fields
   - Return success with warnings about unsupported fields

This would be a temporary fix until the database schema is updated.
""")

print("\n🎯 RECOMMENDED SOLUTION")
print("=" * 60)

print("""
RECOMMENDED: Execute the database migration above in Supabase SQL Editor.

This will:
1. Add all missing columns to support the full UserProfileUpdate model
2. Set appropriate defaults for enum-like fields
3. Add constraints to ensure data integrity
4. Update existing records with default values

After migration, the auto-save functionality should work correctly.
""")
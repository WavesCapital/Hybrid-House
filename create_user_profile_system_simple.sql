-- Create user_profiles table for comprehensive user management
-- This table will store user profile information like avatar, description, etc.

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    
    -- Preferences
    timezone VARCHAR(50),
    units_preference VARCHAR(20) DEFAULT 'imperial',
    privacy_level VARCHAR(20) DEFAULT 'private',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Update athlete_profiles table to properly link to users
-- Add user_profile_id to link to user_profiles table
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS user_profile_id UUID;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_profile_id ON athlete_profiles(user_profile_id);

-- Display success message
SELECT 'User profile system created successfully' as status;
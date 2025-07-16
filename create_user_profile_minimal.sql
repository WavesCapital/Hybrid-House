-- Create user_profiles table step by step
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update athlete_profiles table to properly link to users
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS user_profile_id UUID;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_profile_id ON athlete_profiles(user_profile_id);

-- Display success message
SELECT 'User profile system created successfully' as status;
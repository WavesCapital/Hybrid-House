-- Create user_profiles table for comprehensive user management
-- This table will store user profile information like avatar, description, etc.

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL, -- References auth.users.id
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
    units_preference VARCHAR(20) DEFAULT 'imperial', -- imperial or metric
    privacy_level VARCHAR(20) DEFAULT 'private', -- public, private, friends
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update athlete_profiles table to properly link to users
-- Add user_profile_id to link to user_profiles table
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS user_profile_id UUID,
ADD CONSTRAINT fk_athlete_profiles_user_profile_id 
    FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_profile_id ON athlete_profiles(user_profile_id);

-- Create a function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        user_id,
        email,
        first_name,
        display_name,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create user profile
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Create function to link athlete profiles to user profiles
CREATE OR REPLACE FUNCTION link_athlete_profile_to_user(
    athlete_profile_id UUID,
    target_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_profile_id UUID;
BEGIN
    -- Get the user_profile_id for the target user
    SELECT id INTO user_profile_id
    FROM user_profiles
    WHERE user_id = target_user_id;
    
    -- If user profile doesn't exist, create it
    IF user_profile_id IS NULL THEN
        INSERT INTO user_profiles (user_id, email, created_at, updated_at)
        SELECT target_user_id, email, NOW(), NOW()
        FROM auth.users
        WHERE id = target_user_id
        RETURNING id INTO user_profile_id;
    END IF;
    
    -- Link the athlete profile to the user profile
    UPDATE athlete_profiles
    SET user_profile_id = user_profile_id,
        user_id = target_user_id,
        updated_at = NOW()
    WHERE id = athlete_profile_id;
    
    RETURN TRUE;
END;
$$ language 'plpgsql';

-- Display success message
SELECT 'User profile system created successfully' as status;
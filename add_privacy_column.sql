-- Migration: Add is_public column to athlete_profiles table
-- This allows users to control whether their scores appear on the leaderboard

-- Add is_public column with default value of false (private by default)
ALTER TABLE athlete_profiles 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN athlete_profiles.is_public IS 'Controls whether this athlete profile appears on public leaderboards';

-- Create index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_public_scores 
ON athlete_profiles (is_public, score_data) 
WHERE is_public = true AND score_data IS NOT NULL;

-- Update any existing profiles to be private by default (safety measure)
UPDATE athlete_profiles 
SET is_public = FALSE 
WHERE is_public IS NULL;
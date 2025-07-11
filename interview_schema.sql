-- Interview Flow Database Schema
-- This schema creates the necessary tables for the interview flow

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'complete', 'error')),
    messages JSONB DEFAULT '[]'::jsonb,
    current_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Update athlete_profiles table to include profile_json and completed_at
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS profile_json JSONB,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create Row Level Security (RLS) policies for interview_sessions
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own interview sessions
CREATE POLICY "Users can manage their own interview sessions" ON interview_sessions
FOR ALL USING (auth.uid() = user_id);

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create Edge Function placeholder for score computation
-- This will be implemented as a Supabase Edge Function
CREATE OR REPLACE FUNCTION compute_hybrid_score(profile_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Placeholder for edge function
    -- This will trigger the external webhook for score computation
    -- Implementation will be done in the backend API
    RAISE NOTICE 'Score computation triggered for profile ID: %', profile_id;
END;
$$ LANGUAGE plpgsql;
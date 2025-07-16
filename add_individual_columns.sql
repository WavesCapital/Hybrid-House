-- Add individual columns to athlete_profiles table for optimized database structure
-- This SQL should be run in the Supabase SQL editor

-- Add basic info columns
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS sex VARCHAR(20),
ADD COLUMN IF NOT EXISTS age INTEGER,

-- Add body metrics columns
ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS vo2_max DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS hrv_ms INTEGER,
ADD COLUMN IF NOT EXISTS resting_hr_bpm INTEGER,

-- Add running performance columns
ADD COLUMN IF NOT EXISTS pb_mile_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pb_5k_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pb_10k_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pb_half_marathon_seconds INTEGER,
ADD COLUMN IF NOT EXISTS weekly_miles DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS long_run_miles DECIMAL(5,2),

-- Add strength performance columns
ADD COLUMN IF NOT EXISTS pb_bench_1rm_lb DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS pb_squat_1rm_lb DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS pb_deadlift_1rm_lb DECIMAL(6,2),

-- Add calculated hybrid score metrics
ADD COLUMN IF NOT EXISTS hybrid_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS strength_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS endurance_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS speed_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS vo2_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS distance_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS volume_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS recovery_score DECIMAL(5,2),

-- Add metadata columns
ADD COLUMN IF NOT EXISTS schema_version VARCHAR(10),
ADD COLUMN IF NOT EXISTS meta_session_id UUID,
ADD COLUMN IF NOT EXISTS interview_type VARCHAR(20);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_first_name ON athlete_profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_sex ON athlete_profiles(sex);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_hybrid_score ON athlete_profiles(hybrid_score);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_interview_type ON athlete_profiles(interview_type);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_weight_lb ON athlete_profiles(weight_lb);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_vo2_max ON athlete_profiles(vo2_max);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_weekly_miles ON athlete_profiles(weekly_miles);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_pb_mile_seconds ON athlete_profiles(pb_mile_seconds);

-- Display confirmation message
SELECT 'Database schema updated successfully with individual columns for optimized athlete profiles' as status;
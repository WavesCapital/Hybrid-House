-- Optimize athlete_profiles table with individual columns
-- This migration adds individual columns for better querying while keeping the JSON fields

-- Add individual profile columns
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS sex VARCHAR(20),
ADD COLUMN IF NOT EXISTS age INTEGER,

-- Body metrics columns
ADD COLUMN IF NOT EXISTS weight_lb DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS vo2_max DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS hrv_ms INTEGER,
ADD COLUMN IF NOT EXISTS resting_hr_bpm INTEGER,

-- Running performance columns
ADD COLUMN IF NOT EXISTS pb_mile_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pb_5k_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pb_10k_seconds INTEGER,
ADD COLUMN IF NOT EXISTS pb_half_marathon_seconds INTEGER,
ADD COLUMN IF NOT EXISTS weekly_miles DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS long_run_miles DECIMAL(5,2),

-- Strength performance columns
ADD COLUMN IF NOT EXISTS pb_bench_1rm_lb DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS pb_squat_1rm_lb DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS pb_deadlift_1rm_lb DECIMAL(6,2),

-- Calculated hybrid score metrics
ADD COLUMN IF NOT EXISTS hybrid_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS strength_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS endurance_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS speed_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS vo2_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS distance_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS volume_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS recovery_score DECIMAL(5,2),

-- Metadata columns
ADD COLUMN IF NOT EXISTS schema_version VARCHAR(10),
ADD COLUMN IF NOT EXISTS meta_session_id UUID,
ADD COLUMN IF NOT EXISTS interview_type VARCHAR(20);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_first_name ON athlete_profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_sex ON athlete_profiles(sex);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_hybrid_score ON athlete_profiles(hybrid_score);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_interview_type ON athlete_profiles(interview_type);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_created_at ON athlete_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_weight_lb ON athlete_profiles(weight_lb);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_vo2_max ON athlete_profiles(vo2_max);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_weekly_miles ON athlete_profiles(weekly_miles);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_pb_mile_seconds ON athlete_profiles(pb_mile_seconds);

-- Update existing records to populate the new columns from JSON data
-- This will extract data from profile_json and score_data to populate individual columns

-- Update basic info fields
UPDATE athlete_profiles 
SET 
    first_name = profile_json->>'first_name',
    last_name = profile_json->>'last_name',
    email = profile_json->>'email',
    sex = profile_json->>'sex',
    age = CASE 
        WHEN profile_json->>'age' ~ '^\d+$' THEN (profile_json->>'age')::integer 
        ELSE NULL 
    END,
    schema_version = profile_json->>'schema_version',
    meta_session_id = CASE 
        WHEN profile_json->>'meta_session_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (profile_json->>'meta_session_id')::uuid 
        ELSE NULL 
    END,
    interview_type = COALESCE(profile_json->>'interview_type', 'hybrid')
WHERE profile_json IS NOT NULL;

-- Update body metrics from nested body_metrics object
UPDATE athlete_profiles 
SET 
    weight_lb = CASE 
        WHEN profile_json->'body_metrics'->>'weight_lb' ~ '^\d+\.?\d*$' 
        THEN (profile_json->'body_metrics'->>'weight_lb')::decimal(5,2)
        WHEN profile_json->'body_metrics'->>'weight' ~ '^\d+\.?\d*$' 
        THEN (profile_json->'body_metrics'->>'weight')::decimal(5,2)
        ELSE NULL 
    END,
    vo2_max = CASE 
        WHEN profile_json->'body_metrics'->>'vo2_max' ~ '^\d+\.?\d*$' 
        THEN (profile_json->'body_metrics'->>'vo2_max')::decimal(5,2)
        WHEN profile_json->'body_metrics'->>'vo2max' ~ '^\d+\.?\d*$' 
        THEN (profile_json->'body_metrics'->>'vo2max')::decimal(5,2)
        ELSE NULL 
    END,
    hrv_ms = CASE 
        WHEN profile_json->'body_metrics'->>'hrv' ~ '^\d+$' 
        THEN (profile_json->'body_metrics'->>'hrv')::integer
        WHEN profile_json->'body_metrics'->>'hrv_ms' ~ '^\d+$' 
        THEN (profile_json->'body_metrics'->>'hrv_ms')::integer
        ELSE NULL 
    END,
    resting_hr_bpm = CASE 
        WHEN profile_json->'body_metrics'->>'resting_hr' ~ '^\d+$' 
        THEN (profile_json->'body_metrics'->>'resting_hr')::integer
        WHEN profile_json->'body_metrics'->>'resting_hr_bpm' ~ '^\d+$' 
        THEN (profile_json->'body_metrics'->>'resting_hr_bpm')::integer
        ELSE NULL 
    END
WHERE profile_json IS NOT NULL AND profile_json->'body_metrics' IS NOT NULL;

-- Update running performance
UPDATE athlete_profiles 
SET 
    weekly_miles = CASE 
        WHEN profile_json->>'weekly_miles' ~ '^\d+\.?\d*$' 
        THEN (profile_json->>'weekly_miles')::decimal(5,2)
        ELSE NULL 
    END,
    long_run_miles = CASE 
        WHEN profile_json->>'long_run' ~ '^\d+\.?\d*$' 
        THEN (profile_json->>'long_run')::decimal(5,2)
        ELSE NULL 
    END
WHERE profile_json IS NOT NULL;

-- Convert time strings to seconds for pb_mile (e.g., "7:43" -> 463)
UPDATE athlete_profiles 
SET pb_mile_seconds = CASE
    WHEN profile_json->>'pb_mile' ~ '^\d+:\d+$' THEN
        (split_part(profile_json->>'pb_mile', ':', 1)::integer * 60) + 
        split_part(profile_json->>'pb_mile', ':', 2)::integer
    ELSE NULL
END
WHERE profile_json IS NOT NULL AND profile_json->>'pb_mile' IS NOT NULL;

-- Extract bench press 1RM from object format
UPDATE athlete_profiles 
SET pb_bench_1rm_lb = CASE 
    WHEN profile_json->'pb_bench_1rm'->>'weight_lb' ~ '^\d+\.?\d*$' 
    THEN (profile_json->'pb_bench_1rm'->>'weight_lb')::decimal(6,2)
    WHEN profile_json->'pb_bench_1rm'->>'weight' ~ '^\d+\.?\d*$' 
    THEN (profile_json->'pb_bench_1rm'->>'weight')::decimal(6,2)
    ELSE NULL 
END
WHERE profile_json IS NOT NULL AND profile_json->'pb_bench_1rm' IS NOT NULL;

-- Update score data from score_data JSON
UPDATE athlete_profiles 
SET 
    hybrid_score = CASE 
        WHEN score_data->>'hybridScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'hybridScore')::decimal(5,2)
        ELSE NULL 
    END,
    strength_score = CASE 
        WHEN score_data->>'strengthScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'strengthScore')::decimal(5,2)
        ELSE NULL 
    END,
    endurance_score = CASE 
        WHEN score_data->>'enduranceScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'enduranceScore')::decimal(5,2)
        ELSE NULL 
    END,
    speed_score = CASE 
        WHEN score_data->>'speedScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'speedScore')::decimal(5,2)
        ELSE NULL 
    END,
    vo2_score = CASE 
        WHEN score_data->>'vo2Score' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'vo2Score')::decimal(5,2)
        ELSE NULL 
    END,
    distance_score = CASE 
        WHEN score_data->>'distanceScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'distanceScore')::decimal(5,2)
        ELSE NULL 
    END,
    volume_score = CASE 
        WHEN score_data->>'volumeScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'volumeScore')::decimal(5,2)
        ELSE NULL 
    END,
    recovery_score = CASE 
        WHEN score_data->>'recoveryScore' ~ '^\d+\.?\d*$' 
        THEN (score_data->>'recoveryScore')::decimal(5,2)
        ELSE NULL 
    END
WHERE score_data IS NOT NULL;

-- Display migration results
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_records,
    COUNT(first_name) as records_with_first_name,
    COUNT(hybrid_score) as records_with_hybrid_score,
    COUNT(weight_lb) as records_with_weight,
    COUNT(pb_mile_seconds) as records_with_mile_time
FROM athlete_profiles;
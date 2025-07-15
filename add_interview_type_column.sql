-- Add interview_type column to interview_sessions table
ALTER TABLE interview_sessions 
ADD COLUMN interview_type VARCHAR(20) DEFAULT 'full' CHECK (interview_type IN ('full', 'hybrid'));
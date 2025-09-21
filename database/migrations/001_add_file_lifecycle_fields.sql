-- Migration: Add file lifecycle management fields to recordings and transcriptions tables
-- This migration adds fields to track file deletion timers and retry attempts

-- Add new fields to recordings table
ALTER TABLE recordings 
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS transcription_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transcription_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE;

-- Add new fields to transcriptions table  
ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Update existing recordings to have uploaded_at set to created_at if not set
UPDATE recordings 
SET uploaded_at = created_at 
WHERE uploaded_at IS NULL;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_recordings_cleanup 
ON recordings(scheduled_deletion_at, uploaded_at, status) 
WHERE status != 'deleted';

-- Create index for efficient transcription retry queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_retry 
ON transcriptions(status, retry_count) 
WHERE status = 'failed';

-- Add comments for documentation
COMMENT ON COLUMN recordings.uploaded_at IS 'When the file was uploaded (for 7-day timer)';
COMMENT ON COLUMN recordings.transcription_attempts IS 'Number of transcription attempts';
COMMENT ON COLUMN recordings.last_transcription_attempt IS 'Last attempt timestamp';
COMMENT ON COLUMN recordings.scheduled_deletion_at IS 'When the file should be deleted';
COMMENT ON COLUMN transcriptions.retry_count IS 'Number of retry attempts';


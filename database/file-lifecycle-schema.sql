-- File Lifecycle Management Table
CREATE TABLE IF NOT EXISTS file_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'video')),
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  transcription_status TEXT NOT NULL DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_id UUID REFERENCES transcriptions(id),
  deletion_scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_lifecycle_recording_id ON file_lifecycle(recording_id);
CREATE INDEX IF NOT EXISTS idx_file_lifecycle_deletion_scheduled ON file_lifecycle(deletion_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_file_lifecycle_transcription_status ON file_lifecycle(transcription_status);
CREATE INDEX IF NOT EXISTS idx_file_lifecycle_uploaded_at ON file_lifecycle(uploaded_at);

-- RLS Policies
ALTER TABLE file_lifecycle ENABLE ROW LEVEL SECURITY;

-- Users can only see their own file lifecycle records
CREATE POLICY "Users can view own file lifecycle" ON file_lifecycle
  FOR SELECT USING (
    recording_id IN (
      SELECT id FROM recordings WHERE user_id = auth.uid()
    )
  );

-- Users can update their own file lifecycle records
CREATE POLICY "Users can update own file lifecycle" ON file_lifecycle
  FOR UPDATE USING (
    recording_id IN (
      SELECT id FROM recordings WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all file lifecycle records
CREATE POLICY "Service role can manage all file lifecycle" ON file_lifecycle
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_lifecycle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_file_lifecycle_updated_at
  BEFORE UPDATE ON file_lifecycle
  FOR EACH ROW
  EXECUTE FUNCTION update_file_lifecycle_updated_at();

-- Function to clean up old file lifecycle records (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_file_lifecycle_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 30 days that have been processed
  DELETE FROM file_lifecycle 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add file lifecycle columns to recordings table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recordings' AND column_name = 'file_lifecycle_id') THEN
    ALTER TABLE recordings ADD COLUMN file_lifecycle_id UUID REFERENCES file_lifecycle(id);
  END IF;
END $$;

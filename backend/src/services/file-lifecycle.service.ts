import { supabase } from '../lib/supabase';

export interface FileLifecycleStatus {
  id: string;
  recording_id: string;
  file_path: string;
  file_type: 'audio' | 'video';
  file_size: number;
  uploaded_at: string;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcription_id?: string;
  deletion_scheduled_at: string;
  retry_count: number;
  max_retries: number;
}

export class FileLifecycleService {
  private static readonly RETENTION_DAYS = 7;
  private static readonly MAX_RETRIES = 3;

  /**
   * Create a new file lifecycle record
   */
  static async createFileRecord(
    recordingId: string,
    filePath: string,
    fileType: 'audio' | 'video',
    fileSize: number
  ): Promise<FileLifecycleStatus> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + this.RETENTION_DAYS);

    const { data, error } = await supabase
      .from('file_lifecycle')
      .insert({
        recording_id: recordingId,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        uploaded_at: new Date().toISOString(),
        transcription_status: 'pending',
        deletion_scheduled_at: deletionDate.toISOString(),
        retry_count: 0,
        max_retries: this.MAX_RETRIES,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create file lifecycle record: ${error.message}`);
    }

    return data;
  }

  /**
   * Update transcription status
   */
  static async updateTranscriptionStatus(
    recordingId: string,
    status: 'processing' | 'completed' | 'failed',
    transcriptionId?: string
  ): Promise<void> {
    const updates: any = {
      transcription_status: status,
      updated_at: new Date().toISOString(),
    };

    if (transcriptionId) {
      updates.transcription_id = transcriptionId;
    }

    if (status === 'completed') {
      // Schedule immediate deletion for successful transcriptions
      updates.deletion_scheduled_at = new Date().toISOString();
    } else if (status === 'failed') {
      // Increment retry count for failed transcriptions
      const { data: current } = await supabase
        .from('file_lifecycle')
        .select('retry_count')
        .eq('recording_id', recordingId)
        .single();

      if (current) {
        updates.retry_count = current.retry_count + 1;
        
        // If max retries reached, schedule immediate deletion
        if (current.retry_count + 1 >= this.MAX_RETRIES) {
          updates.deletion_scheduled_at = new Date().toISOString();
        }
      }
    }

    const { error } = await supabase
      .from('file_lifecycle')
      .update(updates)
      .eq('recording_id', recordingId);

    if (error) {
      throw new Error(`Failed to update transcription status: ${error.message}`);
    }
  }

  /**
   * Get file lifecycle status for a recording
   */
  static async getFileStatus(recordingId: string): Promise<FileLifecycleStatus | null> {
    const { data, error } = await supabase
      .from('file_lifecycle')
      .select('*')
      .eq('recording_id', recordingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw new Error(`Failed to get file status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get files ready for deletion
   */
  static async getFilesForDeletion(): Promise<FileLifecycleStatus[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('file_lifecycle')
      .select('*')
      .lte('deletion_scheduled_at', now)
      .neq('file_path', null);

    if (error) {
      throw new Error(`Failed to get files for deletion: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a file and update the record
   */
  static async deleteFile(fileId: string): Promise<void> {
    // In a real implementation, you would delete the actual file from storage here
    // For now, we'll just update the database record
    
    const { error } = await supabase
      .from('file_lifecycle')
      .update({
        file_path: null,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get deletion countdown for a file
   */
  static getDeletionCountdown(deletionScheduledAt: string): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  } {
    const now = new Date();
    const deletionDate = new Date(deletionScheduledAt);
    const diffMs = deletionDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, totalSeconds };
  }

  /**
   * Check if a file can be retried
   */
  static canRetry(fileStatus: FileLifecycleStatus): boolean {
    return (
      fileStatus.transcription_status === 'failed' &&
      fileStatus.retry_count < fileStatus.max_retries &&
      fileStatus.file_path !== null
    );
  }

  /**
   * Retry transcription
   */
  static async retryTranscription(recordingId: string): Promise<void> {
    const { error } = await supabase
      .from('file_lifecycle')
      .update({
        transcription_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('recording_id', recordingId);

    if (error) {
      throw new Error(`Failed to retry transcription: ${error.message}`);
    }
  }
}

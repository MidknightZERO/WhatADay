import { supabase, incrementUsage, checkSubscriptionLimits } from '../lib/supabase';
import { FileLifecycleService } from './file-lifecycle.service';
import type { 
  Transcription, 
  CreateTranscriptionRequest, 
  Recording,
  FileLifecycleInfo,
  RetryTranscriptionRequest,
  RetryTranscriptionResponse
} from '../types/database';
import fs from 'fs/promises';

export class TranscriptionService {
  async createTranscription(
    userId: string,
    recordingId: string,
    request: CreateTranscriptionRequest
  ): Promise<Transcription> {
    // Check subscription limits
    const limits = await checkSubscriptionLimits(userId, 'transcriptions');
    if (!limits.allowed) {
      throw new Error(`Daily transcription limit exceeded. Limit: ${limits.limit}, Current: ${limits.current}`);
    }

    // Verify recording belongs to user
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('id, status')
      .eq('id', recordingId)
      .eq('user_id', userId)
      .single();

    if (recordingError || !recording) {
      throw new Error('Recording not found');
    }

    if (recording.status !== 'ready') {
      throw new Error('Recording is not ready for transcription');
    }

    // Create transcription record
    const { data, error } = await supabase
      .from('transcriptions')
      .insert({
        recording_id: recordingId,
        user_id: userId,
        language: request.language || 'auto',
        ai_service: request.aiService || 'gemini',
        status: 'processing',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transcription: ${error.message}`);
    }

    // Update file lifecycle status to processing
    await FileLifecycleService.updateTranscriptionStatus(recordingId, 'processing', data.id);

    // Increment usage
    await incrementUsage(userId, 'transcriptions');

    // Start background processing (in a real app, this would be a job queue)
    this.processTranscription(data.id).catch(console.error);

    return data;
  }

  async getTranscription(userId: string, transcriptionId: string): Promise<Transcription> {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', transcriptionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch transcription: ${error.message}`);
    }

    return data;
  }

  async getTranscriptions(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ transcriptions: Transcription[]; pagination: any }> {
    let query = supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch transcriptions: ${error.message}`);
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data?.slice(startIndex, endIndex) || [];

    return {
      transcriptions: paginatedData,
      pagination: {
        page,
        limit,
        total: data?.length || 0,
        totalPages: Math.ceil((data?.length || 0) / limit),
      },
    };
  }

  async retryTranscription(
    userId: string,
    request: RetryTranscriptionRequest
  ): Promise<RetryTranscriptionResponse> {
    // Get transcription details
    const { data: transcription, error: fetchError } = await supabase
      .from('transcriptions')
      .select('*, recordings(*)')
      .eq('id', request.transcriptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !transcription) {
      throw new Error('Transcription not found');
    }

    if (transcription.status !== 'failed') {
      throw new Error('Can only retry failed transcriptions');
    }

    const recording = transcription.recordings as Recording;

    // Check file lifecycle status
    const fileStatus = await FileLifecycleService.getFileStatus(recording.id);
    if (!fileStatus) {
      throw new Error('File lifecycle record not found');
    }

    if (!FileLifecycleService.canRetry(fileStatus)) {
      throw new Error('File cannot be retried - either max retries reached or file deleted');
    }

    // Retry transcription using FileLifecycleService
    await FileLifecycleService.retryTranscription(recording.id);

    // Update transcription status
    const { data: updatedTranscription, error: updateError } = await supabase
      .from('transcriptions')
      .update({
        status: 'processing',
        retry_count: transcription.retry_count + 1,
        error_message: null,
      })
      .eq('id', request.transcriptionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update transcription: ${updateError.message}`);
    }

    // Start background processing
    this.processTranscription(request.transcriptionId).catch(console.error);

    // Get updated file lifecycle info
    const updatedFileStatus = await FileLifecycleService.getFileStatus(recording.id);
    const fileLifecycle = await this.getFileLifecycleInfo(recording, updatedFileStatus);

    return {
      transcription: updatedTranscription,
      fileLifecycle,
    };
  }

  async getFileLifecycleInfo(recording: Recording, fileStatus?: any): Promise<FileLifecycleInfo> {
    if (!fileStatus) {
      fileStatus = await FileLifecycleService.getFileStatus(recording.id);
    }

    if (!fileStatus) {
      throw new Error('File lifecycle record not found');
    }

    const countdown = FileLifecycleService.getDeletionCountdown(fileStatus.deletion_scheduled_at);

    return {
      recordingId: recording.id,
      uploadedAt: fileStatus.uploaded_at,
      scheduledDeletionAt: fileStatus.deletion_scheduled_at,
      timeUntilDeletion: countdown.totalSeconds * 1000, // Convert to milliseconds
      transcriptionAttempts: fileStatus.retry_count,
      canRetry: FileLifecycleService.canRetry(fileStatus),
      // transcriptionStatus: fileStatus.transcription_status, // Remove this line as it's not in the interface
      // fileType: fileStatus.file_type, // Remove this line as it's not in the interface
      // fileSize: fileStatus.file_size, // Remove this line as it's not in the interface
    };
  }

  private async processTranscription(transcriptionId: string): Promise<void> {
    try {
      // Get transcription details
      const { data: transcription, error: fetchError } = await supabase
        .from('transcriptions')
        .select('*, recordings(*)')
        .eq('id', transcriptionId)
        .single();

      if (fetchError || !transcription) {
        throw new Error('Transcription not found');
      }

      const recording = transcription.recordings as Recording;

      // Simulate AI processing (in real app, call Google AI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock transcription result
      const mockText = `This is a mock transcription for recording ${transcription.recording_id}. 
      In a real implementation, this would be the actual transcribed text from the audio file.`;

      // Update transcription with results
      const { error: updateError } = await supabase
        .from('transcriptions')
        .update({
          text: mockText,
          confidence_score: 0.95,
          word_count: mockText.split(' ').length,
          processing_time: 2,
          status: 'completed',
        })
        .eq('id', transcriptionId);

      if (updateError) {
        throw new Error(`Failed to update transcription: ${updateError.message}`);
      }

      // Update file lifecycle status to completed and schedule deletion
      await FileLifecycleService.updateTranscriptionStatus(recording.id, 'completed', transcriptionId);

    } catch (error) {
      // Get transcription details for error handling
      const { data: transcriptionData } = await supabase
        .from('transcriptions')
        .select('*, recordings(*)')
        .eq('id', transcriptionId)
        .single();

      // Update transcription with error
      await supabase
        .from('transcriptions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', transcriptionId);

      // Update file lifecycle status to failed
      if (transcriptionData) {
        const recording = transcriptionData.recordings as Recording;
        await FileLifecycleService.updateTranscriptionStatus(recording.id, 'failed');
      }
    }
  }

  /**
   * Cleanup expired files - should be called by a cron job
   */
  async cleanupExpiredFiles(): Promise<void> {
    try {
      const filesForDeletion = await FileLifecycleService.getFilesForDeletion();
      
      console.log(`Found ${filesForDeletion.length} files ready for deletion`);

      for (const file of filesForDeletion) {
        try {
          // Delete the actual file from storage
          await this.deleteFileFromStorage(file.file_path);
          
          // Update the file lifecycle record
          await FileLifecycleService.deleteFile(file.id);
          
          console.log(`Deleted file: ${file.file_path}`);
        } catch (error) {
          console.error(`Failed to delete file ${file.file_path}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  }

  private async deleteFileFromStorage(filePath: string): Promise<void> {
    // This is a placeholder - implement based on your storage solution
    // For Supabase Storage, you would use:
    // const { error } = await supabase.storage.from('recordings').remove([filePath]);
    
    // For local file system (development):
    if (filePath.startsWith('/') || filePath.startsWith('./')) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might already be deleted, which is fine
        console.log(`File ${filePath} not found or already deleted`);
      }
    }
    
    // For other storage solutions, implement accordingly
    console.log(`Deleting file: ${filePath}`);
  }
}


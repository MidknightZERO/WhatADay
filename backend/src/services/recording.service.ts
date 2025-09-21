import { supabase, incrementUsage, checkSubscriptionLimits } from '../lib/supabase';
import { FileLifecycleService } from './file-lifecycle.service';
import type { Recording, CreateRecordingRequest } from '../types/database';

export class RecordingService {
  async createRecording(
    userId: string,
    request: CreateRecordingRequest
  ): Promise<Recording> {
    // Check subscription limits
    const limits = await checkSubscriptionLimits(userId, 'recordings');
    if (!limits.allowed) {
      throw new Error(`Daily recording limit exceeded. Limit: ${limits.limit}, Current: ${limits.current}`);
    }

    // Determine file type based on the file
    const fileExtension = request.audioFile.name.split('.').pop()?.toLowerCase() || '';
    const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExtension);
    const fileType = isVideo ? 'video' : 'audio';

    // Create recording record first
    const now = new Date().toISOString();
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .insert({
        user_id: userId,
        title: request.title,
        audio_url: 'placeholder_url', // Will be updated after file upload
        file_name: request.audioFile.name,
        file_size: request.audioFile.size,
        format: fileExtension,
        status: 'uploading',
        uploaded_at: now,
        transcription_attempts: 0,
      })
      .select()
      .single();

    if (recordingError) {
      throw new Error(`Failed to create recording: ${recordingError.message}`);
    }

    // Create file lifecycle record
    const filePath = `recordings/${userId}/${recording.id}/${request.audioFile.name}`;
    const fileLifecycle = await FileLifecycleService.createFileRecord(
      recording.id,
      filePath,
      fileType,
      request.audioFile.size
    );

    // Update recording with file lifecycle ID
    const { error: updateError } = await supabase
      .from('recordings')
      .update({ file_lifecycle_id: fileLifecycle.id })
      .eq('id', recording.id);

    if (updateError) {
      throw new Error(`Failed to link file lifecycle: ${updateError.message}`);
    }

    // Increment usage
    await incrementUsage(userId, 'recordings');

    return recording;
  }

  async getRecordings(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ recordings: Recording[]; pagination: any }> {
    let query = supabase
      .from('recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch recordings: ${error.message}`);
    }

    // Simple pagination (in production, use proper offset/limit)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data?.slice(startIndex, endIndex) || [];

    return {
      recordings: paginatedData,
      pagination: {
        page,
        limit,
        total: data?.length || 0,
        totalPages: Math.ceil((data?.length || 0) / limit),
      },
    };
  }

  async getRecording(userId: string, recordingId: string): Promise<Recording> {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch recording: ${error.message}`);
    }

    return data;
  }

  async deleteRecording(userId: string, recordingId: string): Promise<void> {
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', recordingId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete recording: ${error.message}`);
    }
  }

  async updateRecordingStatus(
    recordingId: string,
    status: 'uploading' | 'processing' | 'ready' | 'failed',
    audioUrl?: string
  ): Promise<void> {
    const updateData: any = { status };
    if (audioUrl) {
      updateData.audio_url = audioUrl;
    }

    const { error } = await supabase
      .from('recordings')
      .update(updateData)
      .eq('id', recordingId);

    if (error) {
      throw new Error(`Failed to update recording status: ${error.message}`);
    }
  }
}


export type SubscriptionTier = 'free' | 'middle' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';
export type RecordingStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
export type TranscriptionStatus = 'processing' | 'completed' | 'failed';
export type ExportFormat = 'twitter' | 'twitlonger' | 'youtube' | 'tiktok' | 'blog';

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  date: string;
  recordings_count: number;
  transcriptions_count: number;
  exports_count: number;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: string;
  user_id: string;
  title?: string;
  audio_url: string;
  file_name: string;
  file_size: number;
  duration?: number;
  format: string;
  status: RecordingStatus;
  // File lifecycle management fields
  uploaded_at: string; // When the file was uploaded (for 7-day timer)
  transcription_attempts: number; // Number of transcription attempts
  last_transcription_attempt?: string; // Last attempt timestamp
  scheduled_deletion_at?: string; // When the file should be deleted
  created_at: string;
  updated_at: string;
}

export interface Transcription {
  id: string;
  recording_id: string;
  user_id: string;
  text?: string;
  confidence_score?: number;
  language: string;
  word_count?: number;
  processing_time?: number;
  ai_service: string;
  status: TranscriptionStatus;
  error_message?: string;
  retry_count: number; // Number of retry attempts
  created_at: string;
  updated_at: string;
}

export interface Export {
  id: string;
  transcription_id: string;
  user_id: string;
  format: ExportFormat;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RecordingWithTranscription extends Recording {
  transcription?: Transcription;
}

export interface TranscriptionWithRecording extends Transcription {
  recording: Recording;
}

export interface ExportWithTranscription extends Export {
  transcription: TranscriptionWithRecording;
}

export interface CreateRecordingRequest {
  title?: string;
  audioFile: File;
}

export interface CreateRecordingResponse {
  recording: Recording;
}

export interface CreateTranscriptionRequest {
  language?: string;
  aiService?: string;
}

export interface CreateTranscriptionResponse {
  transcription: Transcription;
}

export interface CreateExportRequest {
  transcription_id: string;
  format: ExportFormat;
  options?: Record<string, any>;
}

export interface CreateExportResponse {
  export: Export;
}

export interface SubscriptionLimits {
  recordings_per_day: number;
  transcriptions_per_day: number;
  exports_per_day: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    recordings_per_day: 5,
    transcriptions_per_day: 5,
    exports_per_day: 3,
  },
  middle: {
    recordings_per_day: 50,
    transcriptions_per_day: 50,
    exports_per_day: 25,
  },
  pro: {
    recordings_per_day: 200,
    transcriptions_per_day: 200,
    exports_per_day: 100,
  },
};

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResponse;
}

// File lifecycle management types
export interface FileLifecycleInfo {
  recordingId: string;
  uploadedAt: string;
  scheduledDeletionAt: string;
  timeUntilDeletion: number; // milliseconds
  transcriptionAttempts: number;
  canRetry: boolean;
}

export interface RetryTranscriptionRequest {
  transcriptionId: string;
}

export interface RetryTranscriptionResponse {
  transcription: Transcription;
  fileLifecycle: FileLifecycleInfo;
}


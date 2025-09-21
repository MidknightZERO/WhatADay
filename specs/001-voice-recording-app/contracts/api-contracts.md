# API Contracts: Voice Recording App

**Date**: 2025-01-21  
**Feature**: Voice Recording App  
**Branch**: 001-voice-recording-app

## Authentication Endpoints

### POST /api/auth/google
**Purpose**: Authenticate user with Google OAuth
```typescript
// Request
interface GoogleAuthRequest {
  idToken: string;  // Google ID token
}

// Response
interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    subscription_tier: 'free' | 'middle' | 'pro';
  };
  accessToken: string;
  refreshToken: string;
}
```

**Status Codes**:
- 200: Authentication successful
- 400: Invalid ID token
- 401: Authentication failed

### POST /api/auth/refresh
**Purpose**: Refresh access token
```typescript
// Request
interface RefreshRequest {
  refreshToken: string;
}

// Response
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
```

## Recording Endpoints

### POST /api/recordings
**Purpose**: Upload audio file or start live recording
```typescript
// Request
interface CreateRecordingRequest {
  title?: string;
  audioFile?: File;  // Multipart form data
  isLiveRecording?: boolean;
}

// Response
interface CreateRecordingResponse {
  recording: {
    id: string;
    title?: string;
    status: 'uploading' | 'processing' | 'ready' | 'failed';
    duration?: number;
    format?: string;
    created_at: string;
  };
  uploadUrl?: string;  // For direct upload to Supabase
}
```

### GET /api/recordings
**Purpose**: List user's recordings
```typescript
// Query Parameters
interface ListRecordingsQuery {
  page?: number;
  limit?: number;
  status?: 'uploading' | 'processing' | 'ready' | 'failed';
  sortBy?: 'created_at' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

// Response
interface ListRecordingsResponse {
  recordings: Array<{
    id: string;
    title?: string;
    status: string;
    duration: number;
    format: string;
    created_at: string;
    transcription?: {
      id: string;
      text: string;
      confidence_score: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### GET /api/recordings/{id}
**Purpose**: Get specific recording details
```typescript
// Response
interface GetRecordingResponse {
  recording: {
    id: string;
    title?: string;
    audio_url: string;
    status: string;
    duration: number;
    format: string;
    file_size: number;
    created_at: string;
    transcription?: {
      id: string;
      text: string;
      confidence_score: number;
      language: string;
      word_count: number;
      processing_time: number;
    };
  };
}
```

### DELETE /api/recordings/{id}
**Purpose**: Delete recording and associated data
```typescript
// Response
interface DeleteRecordingResponse {
  success: boolean;
  message: string;
}
```

## Transcription Endpoints

### POST /api/recordings/{id}/transcribe
**Purpose**: Start transcription process
```typescript
// Request
interface TranscribeRequest {
  language?: string;  // Auto-detect if not provided
  aiService?: 'gemini' | 'whisper' | 'azure';
}

// Response
interface TranscribeResponse {
  transcription: {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    estimated_completion_time?: number;  // seconds
  };
}
```

### GET /api/transcriptions/{id}
**Purpose**: Get transcription status and results
```typescript
// Response
interface GetTranscriptionResponse {
  transcription: {
    id: string;
    recording_id: string;
    text: string;
    confidence_score: number;
    language: string;
    word_count: number;
    processing_time: number;
    ai_service: string;
    status: 'processing' | 'completed' | 'failed';
    created_at: string;
    error_message?: string;
  };
}
```

## Export Endpoints

### POST /api/exports
**Purpose**: Generate social media content export
```typescript
// Request
interface CreateExportRequest {
  transcription_id: string;
  format: 'twitter' | 'twitlonger' | 'blog' | 'youtube' | 'tiktok';
  options?: {
    tone?: 'professional' | 'casual' | 'engaging' | 'humorous';
    include_hashtags?: boolean;
    max_length?: number;
    include_hook?: boolean;
    include_outro?: boolean;
  };
}

// Response
interface CreateExportResponse {
  export: {
    id: string;
    format: string;
    content: string;
    metadata: {
      character_count?: number;
      hashtags?: string[];
      image_placeholders?: string[];
      shot_list?: Array<{
        timestamp: number;
        description: string;
        duration: number;
      }>;
      hook?: string;
      outro?: string;
    };
    created_at: string;
  };
}
```

### GET /api/exports
**Purpose**: List user's exports
```typescript
// Query Parameters
interface ListExportsQuery {
  transcription_id?: string;
  format?: string;
  page?: number;
  limit?: number;
}

// Response
interface ListExportsResponse {
  exports: Array<{
    id: string;
    format: string;
    content: string;
    created_at: string;
    transcription: {
      id: string;
      recording: {
        id: string;
        title?: string;
      };
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Subscription Endpoints

### GET /api/subscriptions
**Purpose**: Get user's subscription information
```typescript
// Response
interface GetSubscriptionResponse {
  subscription: {
    id: string;
    tier: 'free' | 'middle' | 'pro';
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    limits: {
      daily_recordings: number;
      daily_exports: number;
      max_file_size: number;  // bytes
      max_duration: number;    // seconds
    };
    usage: {
      recordings_today: number;
      exports_today: number;
      recordings_this_month: number;
      exports_this_month: number;
    };
  };
}
```

### POST /api/subscriptions
**Purpose**: Create or update subscription
```typescript
// Request
interface CreateSubscriptionRequest {
  tier: 'middle' | 'pro';
  payment_method_id: string;  // Stripe payment method
}

// Response
interface CreateSubscriptionResponse {
  subscription: {
    id: string;
    tier: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
  };
  checkout_url?: string;  // If payment required
}
```

### DELETE /api/subscriptions
**Purpose**: Cancel subscription
```typescript
// Response
interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  cancel_at_period_end: boolean;
}
```

## Usage Endpoints

### GET /api/usage
**Purpose**: Get user's usage statistics
```typescript
// Query Parameters
interface GetUsageQuery {
  period?: 'today' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
}

// Response
interface GetUsageResponse {
  usage: {
    period: string;
    recordings_count: number;
    exports_count: number;
    ai_tokens_used: number;
    daily_breakdown?: Array<{
      date: string;
      recordings_count: number;
      exports_count: number;
    }>;
  };
  limits: {
    daily_recordings: number;
    daily_exports: number;
    remaining_recordings: number;
    remaining_exports: number;
  };
}
```

## Error Responses

### Standard Error Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  request_id: string;
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: User must be authenticated
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `USAGE_LIMIT_EXCEEDED`: Daily/monthly usage limit reached
- `INVALID_FILE_FORMAT`: Unsupported audio format
- `FILE_TOO_LARGE`: File exceeds size limit
- `TRANSCRIPTION_FAILED`: AI transcription service error
- `PAYMENT_REQUIRED`: Subscription payment required
- `RATE_LIMIT_EXCEEDED`: Too many requests

## WebSocket Events

### Real-time Updates
```typescript
// Connection
const ws = new WebSocket('wss://api.whataday.com/ws');

// Events
interface WebSocketEvents {
  'transcription.progress': {
    transcription_id: string;
    progress: number;  // 0-100
    status: 'processing' | 'completed' | 'failed';
  };
  
  'transcription.completed': {
    transcription_id: string;
    text: string;
    confidence_score: number;
  };
  
  'export.completed': {
    export_id: string;
    format: string;
    content: string;
  };
  
  'subscription.updated': {
    subscription_id: string;
    tier: string;
    status: string;
  };
}
```

---

**API Contracts Status**: ✅ Complete  
**Next Phase**: Contract Tests (Phase 1 continued)


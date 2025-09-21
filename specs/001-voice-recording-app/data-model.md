# Data Model: Voice Recording App

**Date**: 2025-01-21  
**Feature**: Voice Recording App  
**Branch**: 001-voice-recording-app

## Entity Definitions

### User
**Purpose**: Represents authenticated users with subscription information
```typescript
interface User {
  id: string;                    // UUID primary key
  email: string;                 // Google OAuth email
  name: string;                 // Display name from Google
  avatar_url?: string;          // Profile picture URL
  subscription_tier: 'free' | 'middle' | 'pro';
  stripe_customer_id?: string;   // Stripe customer reference
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}
```

**Validation Rules**:
- Email must be valid format
- Subscription tier must be one of: free, middle, pro
- Stripe customer ID required for paid tiers

**Relationships**:
- One-to-many with Recordings
- One-to-many with Subscriptions
- One-to-many with Usage

### Recording
**Purpose**: Stores audio file metadata and processing status
```typescript
interface Recording {
  id: string;                   // UUID primary key
  user_id: string;              // Foreign key to User
  title?: string;              // User-provided title
  audio_url: string;           // Supabase Storage URL
  file_size: number;           // Size in bytes
  duration: number;            // Duration in seconds
  format: 'mp3' | 'wav' | 'm4a' | 'webm';
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  transcription_id?: string;   // Foreign key to Transcription
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- File size must be < 100MB
- Duration must be > 0 and < 3600 seconds (1 hour)
- Format must be supported audio type
- Status must follow state machine

**State Transitions**:
- uploading → processing (file uploaded)
- processing → ready (transcription complete)
- processing → failed (transcription failed)
- Any state → failed (error occurred)

### Transcription
**Purpose**: Stores AI-generated text content with metadata
```typescript
interface Transcription {
  id: string;                   // UUID primary key
  recording_id: string;         // Foreign key to Recording
  text: string;                 // Transcribed content
  confidence_score: number;     // AI confidence (0-1)
  language: string;            // Detected language code
  word_count: number;          // Word count for analytics
  processing_time: number;     // Processing duration in ms
  ai_service: 'gemini' | 'whisper' | 'azure';
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- Confidence score must be 0-1
- Text must not be empty
- Language must be valid ISO code
- Word count must be > 0

### Export
**Purpose**: Stores generated social media content
```typescript
interface Export {
  id: string;                   // UUID primary key
  transcription_id: string;    // Foreign key to Transcription
  user_id: string;             // Foreign key to User
  format: 'twitter' | 'twitlonger' | 'blog' | 'youtube' | 'tiktok';
  content: string;             // Generated content
  metadata: ExportMetadata;    // Format-specific data
  created_at: Date;
  updated_at: Date;
}

interface ExportMetadata {
  character_count?: number;    // For Twitter
  hashtags?: string[];        // Generated hashtags
  image_placeholders?: string[]; // For blog posts
  shot_list?: ShotItem[];      // For TikTok
  hook?: string;              // For YouTube/TikTok
  outro?: string;             // For YouTube
}

interface ShotItem {
  timestamp: number;          // Time in seconds
  description: string;       // Shot description
  duration: number;         // Shot duration
}
```

**Validation Rules**:
- Format must be supported type
- Content must not be empty
- Character count must match format limits
- Metadata must be valid for format

### Subscription
**Purpose**: Manages user subscription and billing
```typescript
interface Subscription {
  id: string;                   // UUID primary key
  user_id: string;             // Foreign key to User
  stripe_subscription_id: string; // Stripe subscription reference
  tier: 'free' | 'middle' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- Status must be valid Stripe status
- Period dates must be valid
- Tier must match user tier

### Usage
**Purpose**: Tracks daily/monthly usage for limit enforcement
```typescript
interface Usage {
  id: string;                   // UUID primary key
  user_id: string;             // Foreign key to User
  date: Date;                  // Usage date (YYYY-MM-DD)
  recordings_count: number;    // Number of recordings created
  exports_count: number;       // Number of exports generated
  ai_tokens_used: number;      // AI API tokens consumed
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- Counts must be >= 0
- Date must be valid
- Tokens must be >= 0

## Database Schema (Supabase)

### Tables
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'middle', 'pro')),
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Recordings table
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  audio_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('mp3', 'wav', 'm4a', 'webm')),
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
  transcription_id UUID REFERENCES transcriptions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  language TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  processing_time INTEGER NOT NULL,
  ai_service TEXT NOT NULL CHECK (ai_service IN ('gemini', 'whisper', 'azure')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exports table
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('twitter', 'twitlonger', 'blog', 'youtube', 'tiktok')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'middle', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage table
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  recordings_count INTEGER DEFAULT 0,
  exports_count INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_transcriptions_recording_id ON transcriptions(recording_id);
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_format ON exports(format);
CREATE INDEX idx_usage_user_date ON usage(user_id, date);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Recordings policies
CREATE POLICY "Users can view own recordings" ON recordings FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own recordings" ON recordings FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own recordings" ON recordings FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own recordings" ON recordings FOR DELETE USING (auth.uid()::text = user_id::text);

-- Similar policies for other tables...
```

## Data Relationships

### Entity Relationship Diagram
```
User (1) ──── (N) Recording
User (1) ──── (N) Export
User (1) ──── (N) Usage
User (1) ──── (1) Subscription

Recording (1) ──── (1) Transcription
Transcription (1) ──── (N) Export
```

### Business Rules
1. **User Limits**: Free users limited to 1 recording/day, Middle to 10/day, Pro unlimited
2. **Data Retention**: Recordings deleted after 90 days for free users, 1 year for paid
3. **Export Limits**: Based on subscription tier and daily usage
4. **Billing**: Subscriptions auto-renew unless canceled
5. **Usage Tracking**: Daily usage reset at midnight UTC

---

**Data Model Status**: ✅ Complete  
**Next Phase**: API Contracts (Phase 1 continued)


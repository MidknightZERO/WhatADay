# File Lifecycle Management System

This document describes the file lifecycle management system implemented for the WhatADay voice recording application.

## Overview

The system automatically manages the lifecycle of uploaded audio files to optimize storage costs while ensuring users can retry failed transcriptions within a reasonable timeframe.

## Key Features

### 1. Automatic File Deletion
- **After successful transcription**: Files are deleted 1 hour after transcription completion
- **After 7 days**: Files are automatically deleted regardless of transcription status
- **Timer starts from upload**: The 7-day timer begins immediately when a file is uploaded

### 2. Retry Logic for Failed Transcriptions
- Users can retry failed transcriptions as long as the file hasn't expired
- Retry attempts don't extend the 7-day deletion timer
- Timer display shows remaining time until file deletion
- Maximum retry attempts are tracked but not limited (can be configured)

### 3. Scheduled Cleanup
- Background service runs every hour to clean up expired files
- Graceful shutdown handling
- Manual cleanup trigger available for testing

## Database Schema Changes

### Recordings Table
```sql
-- New fields added:
uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
transcription_attempts INTEGER DEFAULT 0
last_transcription_attempt TIMESTAMP WITH TIME ZONE
scheduled_deletion_at TIMESTAMP WITH TIME ZONE
```

### Transcriptions Table
```sql
-- New field added:
retry_count INTEGER DEFAULT 0
```

## API Endpoints

### Retry Transcription
```
POST /api/transcriptions/:id/retry
```
Retries a failed transcription if the file hasn't expired.

**Response:**
```json
{
  "transcription": { ... },
  "fileLifecycle": {
    "recordingId": "uuid",
    "uploadedAt": "2024-01-01T00:00:00Z",
    "scheduledDeletionAt": "2024-01-08T00:00:00Z",
    "timeUntilDeletion": 604800000,
    "transcriptionAttempts": 2,
    "canRetry": true
  }
}
```

### Get File Lifecycle Info
```
GET /api/transcriptions/:id/lifecycle
```
Returns information about when the file will be deleted and retry availability.

**Response:**
```json
{
  "fileLifecycle": {
    "recordingId": "uuid",
    "uploadedAt": "2024-01-01T00:00:00Z",
    "scheduledDeletionAt": "2024-01-08T00:00:00Z",
    "timeUntilDeletion": 604800000,
    "transcriptionAttempts": 1,
    "canRetry": true
  }
}
```

### Manual Cleanup Trigger
```
POST /api/admin/cleanup
```
Manually triggers the cleanup process (useful for testing).

## Implementation Details

### File Deletion Logic
1. **Successful transcription**: File is scheduled for deletion 1 hour after completion
2. **Failed transcription**: File remains until 7 days from upload
3. **Cleanup process**: Runs every hour, deletes files that are past their deletion time

### Retry Constraints
- Only failed transcriptions can be retried
- Files that have exceeded the 7-day limit cannot be retried
- Retry attempts don't reset or extend the deletion timer
- Timer is calculated from the original upload time

### Storage Integration
The system is designed to work with different storage solutions:
- **Supabase Storage**: Use `supabase.storage.from('recordings').remove([filePath])`
- **Local filesystem**: Use `fs.unlink(filePath)` for development
- **Other cloud storage**: Implement `deleteFileFromStorage()` method accordingly

## Configuration

### Cleanup Interval
Default: Every hour (3,600,000 ms)
Can be modified in `CleanupScheduler.CLEANUP_INTERVAL_MS`

### Deletion Delays
- **After transcription**: 1 hour delay
- **Maximum retention**: 7 days from upload

## Error Handling

### File Deletion Errors
- Logged but don't stop the cleanup process
- Database records are still marked as deleted
- Failed file deletions are logged for manual intervention

### Retry Validation
- Expired files return appropriate error messages
- Non-failed transcriptions cannot be retried
- User authorization is validated for all operations

## Monitoring and Logging

The system provides comprehensive logging:
- Cleanup start/completion messages
- Number of files processed
- Individual file deletion results
- Error conditions and failures

## Frontend Integration

### Timer Display
The frontend should display a countdown timer showing:
- Time remaining until file deletion
- Whether retry is available
- Number of transcription attempts made

### Retry Button
- Only show for failed transcriptions
- Disable when file has expired
- Show loading state during retry process

## Testing

### Manual Testing
Use the `/api/admin/cleanup` endpoint to trigger immediate cleanup for testing.

### Automated Testing
The system can be tested by:
1. Creating recordings with specific upload times
2. Triggering cleanup manually
3. Verifying file deletion and database updates

## Security Considerations

- All operations require user authentication
- Users can only retry their own transcriptions
- Admin cleanup endpoint should be protected in production
- File deletion is irreversible - ensure proper backups if needed

## Future Enhancements

- Configurable retention periods per subscription tier
- Email notifications before file deletion
- Bulk retry operations
- File restoration from backups (if implemented)


import express from 'express';
import { 
  authenticateRequest, 
  createAuthErrorResponse, 
  createErrorResponse
} from '../lib/auth';

const router = express.Router();

// GET /api/recordings/:id/lifecycle - Get file lifecycle info
router.get('/:id/lifecycle', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { id } = req.params;

    // Mock file lifecycle data based on recording ID
    let fileLifecycle;
    
    if (id === 'recording-with-transcription') {
      // Completed transcription - file scheduled for deletion
      fileLifecycle = {
        recordingId: id,
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        scheduledDeletionAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        timeUntilDeletion: 30 * 60 * 1000, // 30 minutes in milliseconds
        transcriptionAttempts: 1,
        canRetry: false,
        transcriptionStatus: 'completed',
        fileType: 'audio',
        fileSize: 1024000, // 1MB
      };
    } else if (id === 'recording-failed-transcription') {
      // Failed transcription - can retry
      fileLifecycle = {
        recordingId: id,
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        scheduledDeletionAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        timeUntilDeletion: 6 * 24 * 60 * 60 * 1000, // 6 days in milliseconds
        transcriptionAttempts: 2,
        canRetry: true,
        transcriptionStatus: 'failed',
        fileType: 'video',
        fileSize: 5120000, // 5MB
      };
    } else if (id === 'recording-expired') {
      // Expired file
      fileLifecycle = {
        recordingId: id,
        uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        scheduledDeletionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        timeUntilDeletion: 0,
        transcriptionAttempts: 3,
        canRetry: false,
        transcriptionStatus: 'failed',
        fileType: 'audio',
        fileSize: 2048000, // 2MB
      };
    } else {
      // Default case - pending transcription
      fileLifecycle = {
        recordingId: id,
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        scheduledDeletionAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        timeUntilDeletion: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        transcriptionAttempts: 0,
        canRetry: false,
        transcriptionStatus: 'pending',
        fileType: 'audio',
        fileSize: 1536000, // 1.5MB
      };
    }

    res.json({ fileLifecycle });
  } catch (error) {
    console.error('Error fetching file lifecycle:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch file lifecycle'));
  }
});

// DELETE /api/recordings/:id/delete-file - Manually delete file
router.delete('/:id/delete-file', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { id: _id } = req.params;

    // Mock file deletion
    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to delete file'));
  }
});

export default router;

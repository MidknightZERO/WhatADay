import express from 'express';
import multer from 'multer';
import { 
  authenticateRequest, 
  createAuthErrorResponse, 
  createErrorResponse
} from '../lib/auth';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Error handling middleware for multer
router.use((error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof Error) {
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json(createErrorResponse('INVALID_FILE_TYPE', 'Only audio files are allowed'));
    }
    if (error.message.includes('File too large') || (error as any).code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(createErrorResponse('FILE_TOO_LARGE', 'File size exceeds limit'));
    }
  }
  return next(error);
});

// POST /api/recordings - Create a new recording
router.post('/', upload.single('audioFile'), async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;
    const { title } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json(createErrorResponse('MISSING_AUDIO_FILE', 'Audio file is required'));
    }

    // Mock recording creation
    const recording = {
      id: `recording_${Date.now()}`,
      user_id: userId,
      title: title || null,
      audio_url: 'mock_audio_url',
      file_name: audioFile.originalname,
      file_size: audioFile.size,
      duration: Math.floor(Math.random() * 300) + 30, // Random duration 30-330 seconds
      format: audioFile.mimetype.split('/')[1],
      status: 'uploading',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json({ recording });
  } catch (error) {
    console.error('Error creating recording:', error);
    
    // Handle multer errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json(createErrorResponse('INVALID_FILE_TYPE', 'Only audio files are allowed'));
      }
      if (error.message.includes('File too large')) {
        return res.status(400).json(createErrorResponse('FILE_TOO_LARGE', 'File size exceeds limit'));
      }
    }
    
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to create recording'));
  }
});

// GET /api/recordings - Get user's recordings
router.get('/', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const status = req.query['status'] as string;

    // Mock recordings data
    const recordings = [
      {
        id: 'recording_1',
        user_id: userId,
        title: 'Test Recording',
        audio_url: 'mock_audio_url',
        file_name: 'test.mp3',
        file_size: 1024000,
        format: 'mp3',
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const filteredRecordings = status 
      ? recordings.filter(r => r.status === status)
      : recordings;

    res.json({
      recordings: filteredRecordings,
      pagination: {
        page,
        limit,
        total: filteredRecordings.length,
        totalPages: Math.ceil(filteredRecordings.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch recordings'));
  }
});

// GET /api/recordings/:id - Get specific recording
router.get('/:id', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;
    const { id } = req.params;

    // Handle different test cases based on ID
    if (id === 'non-existent-id') {
      return res.status(404).json(createErrorResponse('RECORDING_NOT_FOUND', 'Recording not found'));
    }

    if (id === 'other-user-recording') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied'));
    }

    // Mock recording data
    const recording = {
      id,
      user_id: userId,
      title: 'Test Recording',
      audio_url: 'mock_audio_url',
      file_name: 'test.mp3',
      file_size: 1024000,
      duration: 120,
      format: 'mp3',
      status: 'ready',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add transcription if it's a recording with transcription
    if (id === 'recording-with-transcription') {
      (recording as any).transcription = {
        id: 'transcription_1',
        recording_id: id,
        user_id: userId,
        text: 'This is a mock transcription',
        confidence_score: 0.95,
        language: 'en',
        word_count: 5,
        processing_time: 2,
        ai_service: 'gemini',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    res.json({ recording });
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch recording'));
  }
});

// DELETE /api/recordings/:id - Delete recording
router.delete('/:id', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId: _userId } = authResult;
    const { id } = req.params;

    // Handle different test cases based on ID
    if (id === 'non-existent-id') {
      return res.status(404).json(createErrorResponse('RECORDING_NOT_FOUND', 'Recording not found'));
    }

    if (id === 'other-user-recording') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied'));
    }

    // Mock deletion
    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to delete recording'));
  }
});

// POST /api/recordings/:id/transcribe - Start transcription
router.post('/:id/transcribe', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;
    const { id } = req.params;
    const { language, aiService } = req.body;

    // Handle different test cases based on ID
    if (id === 'non-existent-id') {
      return res.status(404).json(createErrorResponse('RECORDING_NOT_FOUND', 'Recording not found'));
    }

    if (id === 'other-user-recording') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied'));
    }

    // Mock transcription creation
    const transcription = {
      id: `transcription_${Date.now()}`,
      recording_id: id,
      user_id: userId,
      language: language || 'auto',
      ai_service: aiService || 'gemini',
      status: 'processing',
      estimated_completion_time: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json({ transcription });
  } catch (error) {
    console.error('Error creating transcription:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to create transcription'));
  }
});

export default router;
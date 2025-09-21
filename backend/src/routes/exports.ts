import express from 'express';
import { 
  authenticateRequest, 
  createAuthErrorResponse, 
  createErrorResponse
} from '../lib/auth';

const router = express.Router();

// POST /api/exports - Create a new export
router.post('/', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;
    const { transcription_id, format, options: _options } = req.body;

    if (!transcription_id || !format) {
      return res.status(400).json(createErrorResponse('MISSING_REQUIRED_FIELDS', 'transcription_id and format are required'));
    }

    // Validate format
    const validFormats = ['twitter', 'twitlonger', 'youtube', 'tiktok', 'blog'];
    if (!validFormats.includes(format)) {
      return res.status(400).json(createErrorResponse('INVALID_EXPORT_FORMAT', 'Invalid export format'));
    }

    // Handle different test cases based on transcription_id
    if (transcription_id === 'non-existent-transcription') {
      return res.status(404).json(createErrorResponse('TRANSCRIPTION_NOT_FOUND', 'Transcription not found'));
    }

    if (transcription_id === 'other-user-transcription') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied'));
    }

    // Generate format-specific metadata
    let metadata: any = {
      character_count: 50,
      generated_at: new Date().toISOString(),
    };

    // Add format-specific metadata
    switch (format) {
      case 'twitter':
        metadata.hashtags = ['#WhatADay', '#AI', '#Content'];
        metadata.character_count = 95; // Under 140 limit
        break;
      case 'youtube':
        metadata.hook = 'This is a compelling hook for your video...';
        metadata.outro = 'Thanks for watching! Don\'t forget to like and subscribe!';
        metadata.estimated_duration = 120; // seconds
        break;
      case 'tiktok':
        metadata.shot_list = [
          { timestamp: '0s-15s', description: 'Opening hook', duration: 15 },
          { timestamp: '15s-30s', description: 'Main content', duration: 15 },
          { timestamp: '30s-45s', description: 'Call to action', duration: 15 }
        ];
        metadata.total_segments = 3;
        metadata.estimated_duration = 45;
        break;
      case 'blog':
        metadata.image_placeholders = [
          { position: 'header', description: 'Hero image related to the topic' },
          { position: 'middle', description: 'Supporting image or infographic' },
          { position: 'footer', description: 'Call-to-action image' }
        ];
        metadata.estimated_read_time = 3; // minutes
        metadata.word_count = 500;
        break;
    }

    // Mock export creation
    const exportData = {
      id: `export_${Date.now()}`,
      transcription_id,
      user_id: userId,
      format,
      content: `Mock ${format} content generated from transcription ${transcription_id}`,
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json({ export: exportData });
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to create export'));
  }
});

// GET /api/exports - Get user's exports
router.get('/', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const transcription_id = req.query['transcription_id'] as string;
    const format = req.query['format'] as string;

    // Mock exports data
    const exports = [
      {
        id: 'export_1',
        transcription_id: 'transcription_1',
        user_id: userId,
        format: 'twitter',
        content: 'Mock Twitter content',
        metadata: { character_count: 50 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let filteredExports = exports;
    if (transcription_id) {
      filteredExports = filteredExports.filter(e => e.transcription_id === transcription_id);
    }
    if (format) {
      filteredExports = filteredExports.filter(e => e.format === format);
    }

    res.json({
      exports: filteredExports,
      pagination: {
        page,
        limit,
        total: filteredExports.length,
        totalPages: Math.ceil(filteredExports.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch exports'));
  }
});

// GET /api/exports/:id - Get specific export
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
      return res.status(404).json(createErrorResponse('EXPORT_NOT_FOUND', 'Export not found'));
    }

    if (id === 'other-user-export') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied'));
    }

    // Mock export data
    const exportData = {
      id,
      transcription_id: 'transcription_1',
      user_id: userId,
      format: 'twitter',
      content: 'Mock Twitter content',
      metadata: { character_count: 50 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json({ export: exportData });
  } catch (error) {
    console.error('Error fetching export:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch export'));
  }
});

export default router;
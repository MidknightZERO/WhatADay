import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import recordingsRouter from './routes/recordings';
import transcriptionsRouter from './routes/transcriptions';
import exportsRouter from './routes/exports';
import subscriptionsRouter from './routes/subscriptions';
import webhooksRouter from './routes/webhooks';
import usageRouter from './routes/usage';
import fileLifecycleRouter from './routes/file-lifecycle';

// Import services
import { CleanupScheduler } from './services/cleanup.scheduler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'whataday-backend'
  });
});

// API routes
app.use('/api/recordings', recordingsRouter);
app.use('/api/recordings', fileLifecycleRouter); // File lifecycle routes
app.use('/api/transcriptions', transcriptionsRouter);
app.use('/api/exports', exportsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/usage', usageRouter);

// Admin endpoints
app.post('/api/admin/cleanup', async (_req, res) => {
  try {
    const cleanupScheduler = new CleanupScheduler();
    await cleanupScheduler.triggerCleanup();
    res.json({
      message: 'Cleanup triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering cleanup:', error);
    res.status(500).json({
      error: {
        code: 'CLEANUP_FAILED',
        message: 'Failed to trigger cleanup',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'WhatADay API is running',
    version: '1.0.0',
    endpoints: {
      recordings: '/api/recordings',
      transcriptions: '/api/transcriptions',
      exports: '/api/exports',
      subscriptions: '/api/subscriptions',
      usage: '/api/subscriptions/usage'
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatADay Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
  
  // Start the cleanup scheduler
  const cleanupScheduler = new CleanupScheduler();
  cleanupScheduler.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    cleanupScheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    cleanupScheduler.stop();
    process.exit(0);
  });
});

export default app;

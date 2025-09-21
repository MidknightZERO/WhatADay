import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'

describe('POST /api/recordings', () => {
  it('should create recording with valid audio file', async () => {
    const response = await request(app)
      .post('/api/recordings')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .field('title', 'Test Recording')
      .attach('audioFile', Buffer.from('fake audio data'), 'test.mp3')
      .expect(201)

    expect(response.body).toHaveProperty('recording')
    expect(response.body.recording).toHaveProperty('id')
    expect(response.body.recording).toHaveProperty('title', 'Test Recording')
    expect(response.body.recording).toHaveProperty('status', 'uploading')
    expect(response.body.recording).toHaveProperty('user_id')
    expect(response.body.recording).toHaveProperty('created_at')
    expect(response.body.recording).toHaveProperty('audio_url')
  })

  it('should create recording without title', async () => {
    const response = await request(app)
      .post('/api/recordings')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .attach('audioFile', Buffer.from('fake audio data'), 'test.wav')
      .expect(201)

    expect(response.body.recording).toHaveProperty('id')
    expect(response.body.recording.title).toBeNull()
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .post('/api/recordings')
      .attach('audioFile', Buffer.from('fake audio data'), 'test.mp3')
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 400 for unsupported file format', async () => {
    const response = await request(app)
      .post('/api/recordings')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .attach('audioFile', Buffer.from('fake audio data'), 'test.txt')
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('INVALID_FILE_FORMAT')
  })

  it('should return 400 for file too large', async () => {
    const largeBuffer = Buffer.alloc(101 * 1024 * 1024) // 101MB
    const response = await request(app)
      .post('/api/recordings')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .attach('audioFile', largeBuffer, 'large.mp3')
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('FILE_TOO_LARGE')
  })

  it('should check user subscription limits', async () => {
    const response = await request(app)
      .post('/api/recordings')
      .set('Authorization', 'Bearer free_tier_user_token')
      .attach('audioFile', Buffer.from('fake audio data'), 'test.mp3')
      .expect(201)

    // Should succeed but track usage
    expect(response.body.recording).toHaveProperty('id')
  })
})

describe('GET /api/recordings', () => {
  it('should return user recordings with pagination', async () => {
    const response = await request(app)
      .get('/api/recordings')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ page: 1, limit: 10 })
      .expect(200)

    expect(response.body).toHaveProperty('recordings')
    expect(response.body).toHaveProperty('pagination')
    expect(Array.isArray(response.body.recordings)).toBe(true)
    expect(response.body.pagination).toHaveProperty('page', 1)
    expect(response.body.pagination).toHaveProperty('limit', 10)
    expect(response.body.pagination).toHaveProperty('total')
    expect(response.body.pagination).toHaveProperty('totalPages')
  })

  it('should filter recordings by status', async () => {
    const response = await request(app)
      .get('/api/recordings')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ status: 'ready' })
      .expect(200)

    expect(response.body.recordings).toBeDefined()
    response.body.recordings.forEach((recording: any) => {
      expect(recording.status).toBe('ready')
    })
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .get('/api/recordings')
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('GET /api/recordings/{id}', () => {
  it('should return specific recording details', async () => {
    const response = await request(app)
      .get('/api/recordings/valid-recording-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body).toHaveProperty('recording')
    expect(response.body.recording).toHaveProperty('id', 'valid-recording-id')
    expect(response.body.recording).toHaveProperty('audio_url')
    expect(response.body.recording).toHaveProperty('status')
    expect(response.body.recording).toHaveProperty('duration')
    expect(response.body.recording).toHaveProperty('format')
    expect(response.body.recording).toHaveProperty('user_id')
  })

  it('should include transcription if available', async () => {
    const response = await request(app)
      .get('/api/recordings/recording-with-transcription')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body.recording).toHaveProperty('transcription')
    expect(response.body.recording.transcription).toHaveProperty('id')
    expect(response.body.recording.transcription).toHaveProperty('text')
    expect(response.body.recording.transcription).toHaveProperty('confidence_score')
  })

  it('should return 404 for non-existent recording', async () => {
    const response = await request(app)
      .get('/api/recordings/non-existent-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(404)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('RECORDING_NOT_FOUND')
  })

  it('should return 403 for recording owned by different user', async () => {
    const response = await request(app)
      .get('/api/recordings/other-user-recording')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(403)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('FORBIDDEN')
  })
})

describe('DELETE /api/recordings/{id}', () => {
  it('should delete recording successfully', async () => {
    const response = await request(app)
      .delete('/api/recordings/valid-recording-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body).toHaveProperty('success', true)
    expect(response.body).toHaveProperty('message')
  })

  it('should return 404 for non-existent recording', async () => {
    const response = await request(app)
      .delete('/api/recordings/non-existent-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(404)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('RECORDING_NOT_FOUND')
  })

  it('should return 403 for recording owned by different user', async () => {
    const response = await request(app)
      .delete('/api/recordings/other-user-recording')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(403)

    expect(response.body).toHaveProperty('error')
    expect(response.error.code).toBe('FORBIDDEN')
  })
})


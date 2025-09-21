import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'

describe('POST /api/recordings/{id}/transcribe', () => {
  it('should start transcription process', async () => {
    const response = await request(app)
      .post('/api/recordings/valid-recording-id/transcribe')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        language: 'en',
        aiService: 'gemini'
      })
      .expect(200)

    expect(response.body).toHaveProperty('transcription')
    expect(response.body.transcription).toHaveProperty('id')
    expect(response.body.transcription).toHaveProperty('recording_id', 'valid-recording-id')
    expect(response.body.transcription).toHaveProperty('status', 'processing')
    expect(response.body.transcription).toHaveProperty('estimated_completion_time')
    expect(response.body.transcription).toHaveProperty('user_id')
  })

  it('should auto-detect language if not provided', async () => {
    const response = await request(app)
      .post('/api/recordings/valid-recording-id/transcribe')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({})
      .expect(200)

    expect(response.body.transcription).toHaveProperty('id')
    expect(response.body.transcription).toHaveProperty('status', 'processing')
    expect(response.body.transcription).toHaveProperty('language', 'auto')
  })

  it('should return 404 for non-existent recording', async () => {
    const response = await request(app)
      .post('/api/recordings/non-existent-id/transcribe')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({})
      .expect(404)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('RECORDING_NOT_FOUND')
  })

  it('should return 403 for recording owned by different user', async () => {
    const response = await request(app)
      .post('/api/recordings/other-user-recording/transcribe')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({})
      .expect(403)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .post('/api/recordings/valid-recording-id/transcribe')
      .send({})
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('should check subscription limits for transcription', async () => {
    const response = await request(app)
      .post('/api/recordings/valid-recording-id/transcribe')
      .set('Authorization', 'Bearer free_tier_user_token')
      .send({})
      .expect(200)

    // Should succeed but track usage
    expect(response.body.transcription).toHaveProperty('id')
  })
})

describe('GET /api/transcriptions/{id}', () => {
  it('should return completed transcription', async () => {
    const response = await request(app)
      .get('/api/transcriptions/completed-transcription-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body).toHaveProperty('transcription')
    expect(response.body.transcription).toHaveProperty('id')
    expect(response.body.transcription).toHaveProperty('recording_id')
    expect(response.body.transcription).toHaveProperty('text')
    expect(response.body.transcription).toHaveProperty('confidence_score')
    expect(response.body.transcription).toHaveProperty('language')
    expect(response.body.transcription).toHaveProperty('word_count')
    expect(response.body.transcription).toHaveProperty('processing_time')
    expect(response.body.transcription).toHaveProperty('ai_service')
    expect(response.body.transcription).toHaveProperty('status', 'completed')
    expect(response.body.transcription).toHaveProperty('user_id')
  })

  it('should return processing transcription', async () => {
    const response = await request(app)
      .get('/api/transcriptions/processing-transcription-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body.transcription).toHaveProperty('status', 'processing')
    expect(response.body.transcription).toHaveProperty('id')
    expect(response.body.transcription.text).toBeUndefined()
  })

  it('should return failed transcription with error', async () => {
    const response = await request(app)
      .get('/api/transcriptions/failed-transcription-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body.transcription).toHaveProperty('status', 'failed')
    expect(response.body.transcription).toHaveProperty('error_message')
  })

  it('should return 404 for non-existent transcription', async () => {
    const response = await request(app)
      .get('/api/transcriptions/non-existent-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(404)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('TRANSCRIPTION_NOT_FOUND')
  })

  it('should return 403 for transcription owned by different user', async () => {
    const response = await request(app)
      .get('/api/transcriptions/other-user-transcription')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(403)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .get('/api/transcriptions/valid-transcription-id')
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('GET /api/transcriptions', () => {
  it('should return user transcriptions with pagination', async () => {
    const response = await request(app)
      .get('/api/transcriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ page: 1, limit: 10 })
      .expect(200)

    expect(response.body).toHaveProperty('transcriptions')
    expect(response.body).toHaveProperty('pagination')
    expect(Array.isArray(response.body.transcriptions)).toBe(true)
  })

  it('should filter transcriptions by status', async () => {
    const response = await request(app)
      .get('/api/transcriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ status: 'completed' })
      .expect(200)

    expect(response.body.transcriptions).toBeDefined()
    response.body.transcriptions.forEach((transcription: any) => {
      expect(transcription.status).toBe('completed')
    })
  })
})


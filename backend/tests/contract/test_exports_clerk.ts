import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'

describe('POST /api/exports', () => {
  it('should generate Twitter export', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'twitter',
        options: {
          tone: 'engaging',
          include_hashtags: true,
          max_length: 140
        }
      })
      .expect(201)

    expect(response.body).toHaveProperty('export')
    expect(response.body.export).toHaveProperty('id')
    expect(response.body.export).toHaveProperty('format', 'twitter')
    expect(response.body.export).toHaveProperty('content')
    expect(response.body.export).toHaveProperty('metadata')
    expect(response.body.export).toHaveProperty('transcription_id', 'valid-transcription-id')
    expect(response.body.export).toHaveProperty('user_id')
    expect(response.body.export.metadata).toHaveProperty('character_count')
    expect(response.body.export.metadata).toHaveProperty('hashtags')
    expect(response.body.export.metadata.character_count).toBeLessThanOrEqual(140)
  })

  it('should generate YouTube export with hook and outro', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'youtube',
        options: {
          tone: 'professional',
          include_hook: true,
          include_outro: true
        }
      })
      .expect(201)

    expect(response.body.export).toHaveProperty('format', 'youtube')
    expect(response.body.export.metadata).toHaveProperty('hook')
    expect(response.body.export.metadata).toHaveProperty('outro')
    expect(response.body.export.metadata).toHaveProperty('estimated_duration')
  })

  it('should generate TikTok export with shot list', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'tiktok',
        options: {
          tone: 'engaging'
        }
      })
      .expect(201)

    expect(response.body.export).toHaveProperty('format', 'tiktok')
    expect(response.body.export.metadata).toHaveProperty('shot_list')
    expect(Array.isArray(response.body.export.metadata.shot_list)).toBe(true)
    
    // Each shot should have required properties
    response.body.export.metadata.shot_list.forEach((shot: any) => {
      expect(shot).toHaveProperty('timestamp')
      expect(shot).toHaveProperty('description')
      expect(shot).toHaveProperty('duration')
    })
  })

  it('should generate blog export with image placeholders', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'blog',
        options: {
          tone: 'professional'
        }
      })
      .expect(201)

    expect(response.body.export).toHaveProperty('format', 'blog')
    expect(response.body.export.metadata).toHaveProperty('image_placeholders')
    expect(Array.isArray(response.body.export.metadata.image_placeholders)).toBe(true)
    expect(response.body.export.metadata).toHaveProperty('estimated_read_time')
  })

  it('should return 404 for non-existent transcription', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'non-existent-id',
        format: 'twitter'
      })
      .expect(404)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('TRANSCRIPTION_NOT_FOUND')
  })

  it('should return 400 for invalid format', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'invalid-format'
      })
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('INVALID_EXPORT_FORMAT')
  })

  it('should return 403 for transcription owned by different user', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        transcription_id: 'other-user-transcription',
        format: 'twitter'
      })
      .expect(403)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .post('/api/exports')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'twitter'
      })
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('should check subscription limits for exports', async () => {
    const response = await request(app)
      .post('/api/exports')
      .set('Authorization', 'Bearer free_tier_user_token')
      .send({
        transcription_id: 'valid-transcription-id',
        format: 'twitter'
      })
      .expect(201)

    // Should succeed but track usage
    expect(response.body.export).toHaveProperty('id')
  })
})

describe('GET /api/exports', () => {
  it('should return user exports with pagination', async () => {
    const response = await request(app)
      .get('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ page: 1, limit: 10 })
      .expect(200)

    expect(response.body).toHaveProperty('exports')
    expect(response.body).toHaveProperty('pagination')
    expect(Array.isArray(response.body.exports)).toBe(true)
    expect(response.body.pagination).toHaveProperty('page', 1)
    expect(response.body.pagination).toHaveProperty('limit', 10)
  })

  it('should filter exports by transcription_id', async () => {
    const response = await request(app)
      .get('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ transcription_id: 'specific-transcription-id' })
      .expect(200)

    expect(response.body.exports).toBeDefined()
    response.body.exports.forEach((exportItem: any) => {
      expect(exportItem.transcription.id).toBe('specific-transcription-id')
    })
  })

  it('should filter exports by format', async () => {
    const response = await request(app)
      .get('/api/exports')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .query({ format: 'twitter' })
      .expect(200)

    expect(response.body.exports).toBeDefined()
    response.body.exports.forEach((exportItem: any) => {
      expect(exportItem.format).toBe('twitter')
    })
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .get('/api/exports')
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('GET /api/exports/{id}', () => {
  it('should return specific export details', async () => {
    const response = await request(app)
      .get('/api/exports/valid-export-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body).toHaveProperty('export')
    expect(response.body.export).toHaveProperty('id', 'valid-export-id')
    expect(response.body.export).toHaveProperty('content')
    expect(response.body.export).toHaveProperty('format')
    expect(response.body.export).toHaveProperty('metadata')
  })

  it('should return 404 for non-existent export', async () => {
    const response = await request(app)
      .get('/api/exports/non-existent-id')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(404)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('EXPORT_NOT_FOUND')
  })

  it('should return 403 for export owned by different user', async () => {
    const response = await request(app)
      .get('/api/exports/other-user-export')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(403)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('FORBIDDEN')
  })
})


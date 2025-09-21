import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'

describe('GET /api/subscriptions', () => {
  it('should return user subscription details', async () => {
    const response = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .expect(200)

    expect(response.body).toHaveProperty('subscription')
    expect(response.body.subscription).toHaveProperty('tier')
    expect(response.body.subscription).toHaveProperty('status')
    expect(response.body.subscription).toHaveProperty('current_period_start')
    expect(response.body.subscription).toHaveProperty('current_period_end')
    expect(response.body.subscription).toHaveProperty('usage_limits')
    expect(response.body.subscription.usage_limits).toHaveProperty('recordings_per_day')
    expect(response.body.subscription.usage_limits).toHaveProperty('transcriptions_per_day')
    expect(response.body.subscription.usage_limits).toHaveProperty('exports_per_day')
  })

  it('should return free tier for new user', async () => {
    const response = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', 'Bearer new_user_token')
      .expect(200)

    expect(response.body.subscription.tier).toBe('free')
    expect(response.body.subscription.status).toBe('active')
    expect(response.body.subscription.usage_limits.recordings_per_day).toBe(1)
    expect(response.body.subscription.usage_limits.transcriptions_per_day).toBe(1)
    expect(response.body.subscription.usage_limits.exports_per_day).toBe(1)
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .get('/api/subscriptions')
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /api/subscriptions', () => {
  it('should create Stripe checkout session for pro tier', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        tier: 'pro',
        success_url: 'https://whataday.app/success',
        cancel_url: 'https://whataday.app/cancel'
      })
      .expect(200)

    expect(response.body).toHaveProperty('checkout_url')
    expect(response.body).toHaveProperty('session_id')
    expect(response.body.checkout_url).toContain('checkout.stripe.com')
  })

  it('should create Stripe checkout session for middle tier', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        tier: 'middle',
        success_url: 'https://whataday.app/success',
        cancel_url: 'https://whataday.app/cancel'
      })
      .expect(200)

    expect(response.body).toHaveProperty('checkout_url')
    expect(response.body).toHaveProperty('session_id')
  })

  it('should return 400 for invalid tier', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        tier: 'invalid-tier',
        success_url: 'https://whataday.app/success',
        cancel_url: 'https://whataday.app/cancel'
      })
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('INVALID_TIER')
  })

  it('should return 400 for missing URLs', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', 'Bearer valid_clerk_session_token')
      .send({
        tier: 'pro'
      })
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('MISSING_URLS')
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .send({
        tier: 'pro',
        success_url: 'https://whataday.app/success',
        cancel_url: 'https://whataday.app/cancel'
      })
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('GET /api/usage', () => {
  it('should return current usage for free tier user', async () => {
    const response = await request(app)
      .get('/api/usage')
      .set('Authorization', 'Bearer free_tier_user_token')
      .expect(200)

    expect(response.body).toHaveProperty('usage')
    expect(response.body.usage).toHaveProperty('recordings_today')
    expect(response.body.usage).toHaveProperty('transcriptions_today')
    expect(response.body.usage).toHaveProperty('exports_today')
    expect(response.body.usage).toHaveProperty('recordings_this_month')
    expect(response.body.usage).toHaveProperty('transcriptions_this_month')
    expect(response.body.usage).toHaveProperty('exports_this_month')
    expect(response.body.usage).toHaveProperty('limits')
    expect(response.body.usage.limits).toHaveProperty('recordings_per_day')
    expect(response.body.usage.limits).toHaveProperty('transcriptions_per_day')
    expect(response.body.usage.limits).toHaveProperty('exports_per_day')
  })

  it('should return unlimited usage for pro tier user', async () => {
    const response = await request(app)
      .get('/api/usage')
      .set('Authorization', 'Bearer pro_tier_user_token')
      .expect(200)

    expect(response.body.usage.limits.recordings_per_day).toBe(-1) // -1 means unlimited
    expect(response.body.usage.limits.transcriptions_per_day).toBe(-1)
    expect(response.body.usage.limits.exports_per_day).toBe(-1)
  })

  it('should return 401 without Clerk session', async () => {
    const response = await request(app)
      .get('/api/usage')
      .expect(401)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /api/webhooks/stripe', () => {
  it('should handle successful subscription creation', async () => {
    const stripeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
          metadata: {
            clerk_user_id: 'user_test_123',
            tier: 'pro'
          }
        }
      }
    }

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid_stripe_signature')
      .send(stripeEvent)
      .expect(200)

    expect(response.body).toHaveProperty('received', true)
  })

  it('should handle subscription cancellation', async () => {
    const stripeEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          metadata: {
            clerk_user_id: 'user_test_123'
          }
        }
      }
    }

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid_stripe_signature')
      .send(stripeEvent)
      .expect(200)

    expect(response.body).toHaveProperty('received', true)
  })

  it('should return 400 for invalid signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'invalid_signature')
      .send({})
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error.code).toBe('INVALID_SIGNATURE')
  })
})


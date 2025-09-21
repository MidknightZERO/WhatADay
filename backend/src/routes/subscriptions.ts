import express from 'express';
import { 
  authenticateRequest, 
  createAuthErrorResponse, 
  createErrorResponse
} from '../lib/auth';

const router = express.Router();

// GET /api/subscriptions - Get user's subscription
router.get('/', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;

    // Mock subscription data
    const subscription = {
      id: 'subscription_1',
      user_id: userId,
      tier: 'free',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      usage_limits: {
        recordings_per_day: 1,
        transcriptions_per_day: 1,
        exports_per_day: 1,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch subscription'));
  }
});

// POST /api/subscriptions - Create checkout session
router.post('/', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId: _userId } = authResult;
    const { tier, success_url, cancel_url } = req.body;

    if (!tier || !success_url || !cancel_url) {
      return res.status(400).json(createErrorResponse('MISSING_URLS', 'tier, success_url, and cancel_url are required'));
    }

    // Validate tier
    const validTiers = ['free', 'middle', 'pro'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json(createErrorResponse('INVALID_TIER', 'Invalid subscription tier'));
    }

    // Mock checkout session
    const result = {
      checkout_url: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
      session_id: `cs_test_${Date.now()}`,
    };

    res.json(result);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to create checkout session'));
  }
});

export default router;
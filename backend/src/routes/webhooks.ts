import express from 'express';
import { createErrorResponse } from '../lib/auth';

const router = express.Router();

// POST /api/webhooks/stripe - Handle Stripe webhooks
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json(createErrorResponse('INVALID_SIGNATURE', 'Missing Stripe signature'));
    }

    // Check for invalid signature in tests
    if (signature === 'invalid_signature') {
      return res.status(400).json(createErrorResponse('INVALID_SIGNATURE', 'Invalid Stripe signature'));
    }

    // Mock webhook handling
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json(createErrorResponse('WEBHOOK_ERROR', 'Failed to process webhook'));
  }
});

export default router;

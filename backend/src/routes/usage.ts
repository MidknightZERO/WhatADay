import express from 'express';
import { 
  authenticateRequest, 
  createAuthErrorResponse, 
  createErrorResponse
} from '../lib/auth';

const router = express.Router();

// GET /api/usage - Get user's usage
router.get('/', async (req, res) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return res.status(401).json(createAuthErrorResponse());
    }

    const { userId } = authResult;

    // Determine tier based on user ID for testing
    let limits: any;
    if (userId === 'pro_tier_user_id') {
      limits = {
        recordings_per_day: -1, // unlimited
        transcriptions_per_day: -1,
        exports_per_day: -1,
      };
    } else {
      limits = {
        recordings_per_day: 1,
        transcriptions_per_day: 1,
        exports_per_day: 1,
      };
    }

    // Mock usage data
    const result = {
      usage: {
        id: 'usage_1',
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        recordings_today: 0,
        transcriptions_today: 0,
        exports_today: 0,
        recordings_this_month: 0,
        transcriptions_this_month: 0,
        exports_this_month: 0,
        recordings_count: 0,
        transcriptions_count: 0,
        exports_count: 0,
        limits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch usage'));
  }
});

export default router;

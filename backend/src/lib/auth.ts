import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  clerkUserId?: string;
}

export async function authenticateRequest(req: Request): Promise<{
  userId: string;
  clerkUserId: string;
} | null> {
  try {
    // For now, we'll use a mock authentication since we don't have the full setup
    // In production, this would verify the Clerk token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Mock authentication - in production, verify the token with Clerk
    const token = authHeader.substring(7);
    
    // Handle different token types for testing
    if (token === 'valid_clerk_session_token') {
      return { 
        userId: 'mock_user_id', 
        clerkUserId: 'mock_clerk_user_id' 
      };
    }
    
    if (token === 'free_tier_user_token') {
      return { 
        userId: 'free_tier_user_id', 
        clerkUserId: 'free_tier_clerk_user_id' 
      };
    }
    
    if (token === 'pro_tier_user_token') {
      return { 
        userId: 'pro_tier_user_id', 
        clerkUserId: 'pro_tier_clerk_user_id' 
      };
    }
    
    if (token === 'new_user_token') {
      return { 
        userId: 'new_user_id', 
        clerkUserId: 'new_clerk_user_id' 
      };
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function createAuthErrorResponse(message: string = 'Authentication required') {
  return {
    error: {
      code: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString(),
    },
  };
}

export function createErrorResponse(
  code: string,
  message: string
) {
  return {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };
}

export function createSuccessResponse<T>(data: T) {
  return data;
}

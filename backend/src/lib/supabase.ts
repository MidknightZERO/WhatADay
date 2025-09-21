import { createClient } from '@supabase/supabase-js';
import type { User } from '../types/database';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '../types/database';

const supabaseUrl = process.env['SUPABASE_URL'] || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'placeholder_service_role_key';

if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY'] === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.warn('⚠️  Missing or placeholder Supabase credentials. Using placeholder values for development.');
  console.warn('   The server will start but database operations will fail.');
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to get user ID from Clerk user ID
export async function getUserIdFromClerkId(clerkUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

// Helper function to create or update user from Clerk data
export async function upsertUserFromClerk(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}): Promise<User> {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error('No email address found for user');
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_user_id: clerkUser.id,
      email,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      image_url: clerkUser.imageUrl,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert user: ${error.message}`);
  }

  return data;
}

// Helper function to check subscription limits
export async function checkSubscriptionLimits(
  userId: string,
  action: 'recordings' | 'transcriptions' | 'exports'
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // Get user's subscription tier
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  const tier = user.subscription_tier as SubscriptionTier;
  const limit = SUBSCRIPTION_LIMITS[tier][`${action}_per_day` as keyof typeof SUBSCRIPTION_LIMITS[SubscriptionTier]];

  // If unlimited (pro tier)
  if (limit === -1) {
    return { allowed: true, limit: -1, current: 0 };
  }

  // Get today's usage
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select(`${action}_count`)
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const current = (usage as any)?.[`${action}_count`] || 0;
  const allowed = current < limit;

  return { allowed, limit, current };
}

// Helper function to increment usage
export async function incrementUsage(
  userId: string,
  action: 'recordings' | 'transcriptions' | 'exports'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('usage_tracking')
    .upsert({
      user_id: userId,
      date: today,
      [`${action}_count`]: supabase.rpc('increment_usage', {
        user_id: userId,
        date: today,
        action_type: action,
      }),
    });

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`);
  }
}

import { supabase } from '../lib/supabase';
import type { Subscription, UsageTracking, SubscriptionTier } from '../types/database';
import { SUBSCRIPTION_LIMITS } from '../types/database';

export class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data;
  }

  async getUsage(userId: string): Promise<{
    usage: UsageTracking;
    limits: Record<string, number>;
  }> {
    // Get user's subscription tier
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const tier = user.subscription_tier;
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const todayUsage = usage || {
      id: '',
      user_id: userId,
      date: today,
      recordings_count: 0,
      transcriptions_count: 0,
      exports_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      usage: todayUsage,
      limits: {
        recordings_per_day: limits.recordings_per_day,
        transcriptions_per_day: limits.transcriptions_per_day,
        exports_per_day: limits.exports_per_day,
      },
    };
  }

  async createCheckoutSession(
    _userId: string,
    _tier: SubscriptionTier,
    _successUrl: string,
    _cancelUrl: string
  ): Promise<{ checkout_url: string; session_id: string }> {
    // In a real implementation, you'd integrate with Stripe here
    // For now, return mock data
    const mockSessionId = `cs_test_${Date.now()}`;
    const mockCheckoutUrl = `https://checkout.stripe.com/pay/${mockSessionId}`;

    return {
      checkout_url: mockCheckoutUrl,
      session_id: mockSessionId,
    };
  }

  async handleWebhookEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: any): Promise<void> {
    const clerkUserId = session.metadata?.clerk_user_id;
    const tier = session.metadata?.tier;

    if (!clerkUserId || !tier) {
      throw new Error('Missing required metadata in checkout session');
    }

    // Get user ID from Clerk ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Create subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        stripe_subscription_id: session.subscription,
        tier: tier as SubscriptionTier,
        status: 'active',
        current_period_start: new Date(session.subscription_details?.current_period_start * 1000).toISOString(),
        current_period_end: new Date(session.subscription_details?.current_period_end * 1000).toISOString(),
      });

    if (subscriptionError) {
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    // Update user's subscription tier
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        stripe_customer_id: session.customer,
      })
      .eq('id', user.id);

    if (userUpdateError) {
      throw new Error(`Failed to update user subscription: ${userUpdateError.message}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      throw new Error(`Failed to update subscription status: ${error.message}`);
    }

    // Update user's subscription tier to free
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
      })
      .eq('stripe_customer_id', subscription.customer);

    if (userError) {
      throw new Error(`Failed to update user subscription: ${userError.message}`);
    }
  }

  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    // Handle successful payment
    console.log('Payment succeeded for invoice:', invoice.id);
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    // Handle failed payment
    const { error } = await supabase
      .from('users')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer);

    if (error) {
      throw new Error(`Failed to update user subscription status: ${error.message}`);
    }
  }
}



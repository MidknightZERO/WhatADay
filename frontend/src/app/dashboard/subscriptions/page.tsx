import { DashboardLayout } from '@/components/layout/DashboardLayout';
import SubscriptionOverview from '@/components/subscriptions/SubscriptionOverview';
import UsageTracking from '@/components/subscriptions/UsageTracking';
import BillingHistory from '@/components/subscriptions/BillingHistory';

export default function SubscriptionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
            <p className="text-gray-600">Manage your plan, view usage, and billing information.</p>
          </div>
        </div>
        
        <SubscriptionOverview />
        <UsageTracking />
        <BillingHistory />
      </div>
    </DashboardLayout>
  );
}

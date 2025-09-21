'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Crown, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Star,
  Zap,
  Shield,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Share2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface Subscription {
  id: string
  tier: 'free' | 'middle' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  usageLimits: {
    recordingsPerDay: number
    transcriptionsPerDay: number
    exportsPerDay: number
    recordingsPerMonth: number
    transcriptionsPerMonth: number
    exportsPerMonth: number
  }
  features: {
    adFree: boolean
    prioritySupport: boolean
    advancedAnalytics: boolean
    customBranding: boolean
    apiAccess: boolean
  }
}

interface PricingPlan {
  id: string
  name: string
  tier: 'free' | 'middle' | 'pro'
  price: number
  interval: 'month' | 'year'
  description: string
  features: string[]
  limits: {
    recordingsPerDay: number
    transcriptionsPerDay: number
    exportsPerDay: number
    recordingsPerMonth: number
    transcriptionsPerMonth: number
    exportsPerMonth: number
  }
  popular?: boolean
}

const TIER_CONFIGS = {
  free: {
    name: 'Free',
    icon: Users,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Perfect for getting started'
  },
  middle: {
    name: 'Creator',
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Great for content creators'
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'For professionals and teams'
  }
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started',
    features: [
      '1 recording per day',
      '1 transcription per day',
      '1 export per day',
      'Basic support',
      'Banner ads'
    ],
    limits: {
      recordingsPerDay: 1,
      transcriptionsPerDay: 1,
      exportsPerDay: 1,
      recordingsPerMonth: 30,
      transcriptionsPerMonth: 30,
      exportsPerMonth: 30
    }
  },
  {
    id: 'middle',
    name: 'Creator',
    tier: 'middle',
    price: 19,
    interval: 'month',
    description: 'Great for content creators',
    features: [
      '10 recordings per day',
      '10 transcriptions per day',
      '10 exports per day',
      'Ad-free experience',
      'Priority support',
      'Advanced analytics'
    ],
    limits: {
      recordingsPerDay: 10,
      transcriptionsPerDay: 10,
      exportsPerDay: 10,
      recordingsPerMonth: 300,
      transcriptionsPerMonth: 300,
      exportsPerMonth: 300
    },
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'pro',
    price: 49,
    interval: 'month',
    description: 'For professionals and teams',
    features: [
      'Unlimited recordings',
      'Unlimited transcriptions',
      'Unlimited exports',
      'Ad-free experience',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ],
    limits: {
      recordingsPerDay: -1,
      transcriptionsPerDay: -1,
      exportsPerDay: -1,
      recordingsPerMonth: -1,
      transcriptionsPerMonth: -1,
      exportsPerMonth: -1
    }
  }
]

export default function SubscriptionOverview() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/dashboard/subscriptions?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/subscriptions?canceled=true`
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      } else {
        const error = await response.json()
        alert(`Failed to upgrade: ${error.message}`)
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      alert('Failed to upgrade subscription. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setCanceling(true)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Subscription canceled successfully. You will retain access until the end of your billing period.')
        fetchSubscription() // Refresh subscription data
      } else {
        const error = await response.json()
        alert(`Failed to cancel subscription: ${error.message}`)
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setCanceling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'trialing':
        return 'text-blue-600 bg-blue-100'
      case 'past_due':
        return 'text-red-600 bg-red-100'
      case 'canceled':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'trialing':
        return 'Trial'
      case 'past_due':
        return 'Past Due'
      case 'canceled':
        return 'Canceled'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading subscription...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentTierConfig = subscription ? TIER_CONFIGS[subscription.tier] : TIER_CONFIGS.free
  const CurrentTierIcon = currentTierConfig.icon

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CurrentTierIcon className={`h-5 w-5 ${currentTierConfig.color}`} />
            <span>Current Plan</span>
          </CardTitle>
          <CardDescription>
            {subscription ? currentTierConfig.description : 'No active subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${currentTierConfig.bgColor}`}>
                    <CurrentTierIcon className={`h-6 w-6 ${currentTierConfig.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentTierConfig.name} Plan
                    </h3>
                    <p className="text-sm text-gray-600">
                      {subscription.tier === 'free' ? 'Free forever' : `$${PRICING_PLANS.find(p => p.tier === subscription.tier)?.price}/month`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                  {subscription.cancelAtPeriodEnd && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                      Canceling
                    </span>
                  )}
                </div>
              </div>

              {/* Billing Information */}
              {subscription.tier !== 'free' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Period</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                  {subscription.trialEnd && (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Trial Ends</p>
                        <p className="text-sm text-gray-600">{formatDate(subscription.trialEnd)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(subscription.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center space-x-2">
                      {enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                {subscription.tier !== 'pro' && (
                  <Button
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgrading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {upgrading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Upgrading...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Upgrade to Pro
                      </>
                    )}
                  </Button>
                )}
                {subscription.tier === 'free' && (
                  <Button
                    onClick={() => handleUpgrade('middle')}
                    disabled={upgrading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {upgrading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Upgrading...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Upgrade to Creator
                      </>
                    )}
                  </Button>
                )}
                {subscription.tier !== 'free' && !subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={canceling}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {canceling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Canceling...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No subscription found.</p>
              <p className="text-sm text-gray-400">You are currently on the free plan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Available Plans</span>
          </CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => {
              const TierIcon = TIER_CONFIGS[plan.tier].icon
              const isCurrentPlan = subscription?.tier === plan.tier
              const isUpgrade = subscription && (
                (subscription.tier === 'free' && plan.tier === 'middle') ||
                (subscription.tier === 'middle' && plan.tier === 'pro')
              )

              return (
                <div
                  key={plan.id}
                  className={`relative p-6 border rounded-lg ${
                    plan.popular
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : isCurrentPlan
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className={`inline-flex p-3 rounded-lg ${TIER_CONFIGS[plan.tier].bgColor} mb-3`}>
                      <TierIcon className={`h-8 w-8 ${TIER_CONFIGS[plan.tier].color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                    <div className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-green-600 hover:bg-green-700'
                        : plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    disabled={isCurrentPlan || upgrading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Current Plan
                      </>
                    ) : isUpgrade ? (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Upgrade
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Downgrade
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

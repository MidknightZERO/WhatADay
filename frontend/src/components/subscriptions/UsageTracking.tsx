'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  Mic, 
  FileText, 
  Share2, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'

interface UsageData {
  recordingsToday: number
  transcriptionsToday: number
  exportsToday: number
  recordingsThisMonth: number
  transcriptionsThisMonth: number
  exportsThisMonth: number
  limits: {
    recordingsPerDay: number
    transcriptionsPerDay: number
    exportsPerDay: number
    recordingsPerMonth: number
    transcriptionsPerMonth: number
    exportsPerMonth: number
  }
  resetTime: {
    daily: string
    monthly: string
  }
}

interface UsageItem {
  type: 'recording' | 'transcription' | 'export'
  name: string
  icon: React.ComponentType<{ className?: string }>
  today: number
  thisMonth: number
  dailyLimit: number
  monthlyLimit: number
  color: string
  bgColor: string
}

export default function UsageTracking() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageStatus = (current: number, limit: number) => {
    if (limit === -1) return 'unlimited'
    const percentage = (current / limit) * 100
    if (percentage >= 90) return 'critical'
    if (percentage >= 75) return 'warning'
    return 'good'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unlimited':
        return 'text-green-600'
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unlimited':
        return <Zap className="h-4 w-4 text-green-500" />
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading usage data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Unable to load usage data.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const usageItems: UsageItem[] = [
    {
      type: 'recording',
      name: 'Recordings',
      icon: Mic,
      today: usage.recordingsToday,
      thisMonth: usage.recordingsThisMonth,
      dailyLimit: usage.limits.recordingsPerDay,
      monthlyLimit: usage.limits.recordingsPerMonth,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      type: 'transcription',
      name: 'Transcriptions',
      icon: FileText,
      today: usage.transcriptionsToday,
      thisMonth: usage.transcriptionsThisMonth,
      dailyLimit: usage.limits.transcriptionsPerDay,
      monthlyLimit: usage.limits.transcriptionsPerMonth,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'export',
      name: 'Exports',
      icon: Share2,
      today: usage.exportsToday,
      thisMonth: usage.exportsThisMonth,
      dailyLimit: usage.limits.exportsPerDay,
      monthlyLimit: usage.limits.exportsPerMonth,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span>Usage Tracking</span>
        </CardTitle>
        <CardDescription>
          Monitor your daily and monthly usage across all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reset Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Daily Reset</p>
              <p className="text-sm text-gray-600">
                {formatTime(usage.resetTime.daily)} (UTC)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Monthly Reset</p>
              <p className="text-sm text-gray-600">
                {formatDate(usage.resetTime.monthly)}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usageItems.map((item) => {
            const IconComponent = item.icon
            const todayStatus = getUsageStatus(item.today, item.dailyLimit)
            const monthlyStatus = getUsageStatus(item.thisMonth, item.monthlyLimit)
            const todayPercentage = getUsagePercentage(item.today, item.dailyLimit)
            const monthlyPercentage = getUsagePercentage(item.thisMonth, item.monthlyLimit)

            return (
              <div key={item.type} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">Usage tracking</p>
                  </div>
                </div>

                {/* Today's Usage */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Today</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(todayStatus)}
                      <span className={`text-sm font-medium ${getStatusColor(todayStatus)}`}>
                        {item.today} / {item.dailyLimit === -1 ? '∞' : item.dailyLimit}
                      </span>
                    </div>
                  </div>
                  {item.dailyLimit !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          todayStatus === 'critical'
                            ? 'bg-red-500'
                            : todayStatus === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${todayPercentage}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* This Month's Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">This Month</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(monthlyStatus)}
                      <span className={`text-sm font-medium ${getStatusColor(monthlyStatus)}`}>
                        {item.thisMonth} / {item.monthlyLimit === -1 ? '∞' : item.monthlyLimit}
                      </span>
                    </div>
                  </div>
                  {item.monthlyLimit !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          monthlyStatus === 'critical'
                            ? 'bg-red-500'
                            : monthlyStatus === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${monthlyPercentage}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Status Messages */}
                {(todayStatus === 'critical' || monthlyStatus === 'critical') && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 font-medium">Limit Reached</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      {todayStatus === 'critical' 
                        ? 'Daily limit reached. Upgrade to continue.'
                        : 'Monthly limit reached. Upgrade to continue.'
                      }
                    </p>
                  </div>
                )}

                {(todayStatus === 'warning' || monthlyStatus === 'warning') && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700 font-medium">Approaching Limit</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      {todayStatus === 'warning' 
                        ? 'Daily limit almost reached.'
                        : 'Monthly limit almost reached.'
                      }
                    </p>
                  </div>
                )}

                {todayStatus === 'unlimited' && monthlyStatus === 'unlimited' && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700 font-medium">Unlimited</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      No limits on this feature.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Usage Summary */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Usage Summary</h4>
          </div>
          <p className="text-sm text-blue-800">
            You&apos;ve used <strong>{usage.recordingsToday + usage.transcriptionsToday + usage.exportsToday}</strong> features today 
            and <strong>{usage.recordingsThisMonth + usage.transcriptionsThisMonth + usage.exportsThisMonth}</strong> this month.
            {usage.limits.recordingsPerDay === -1 && ' You have unlimited access to all features.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

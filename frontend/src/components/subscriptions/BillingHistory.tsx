'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Download, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink
} from 'lucide-react'

interface BillingItem {
  id: string
  date: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  planName: string
  invoiceUrl?: string
  receiptUrl?: string
}

interface BillingHistory {
  items: BillingItem[]
  totalPaid: number
  currency: string
  nextBillingDate?: string
  nextBillingAmount?: number
}

const STATUS_CONFIGS = {
  paid: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    text: 'Paid'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    text: 'Pending'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    text: 'Failed'
  },
  refunded: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    text: 'Refunded'
  }
}

export default function BillingHistory() {
  const [billing, setBilling] = useState<BillingHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingHistory()
  }, [])

  const fetchBillingHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions/billing')
      if (response.ok) {
        const data = await response.json()
        setBilling(data)
      }
    } catch (error) {
      console.error('Error fetching billing history:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async (invoiceId: string) => {
    setDownloading(invoiceId)
    try {
      const response = await fetch(`/api/subscriptions/billing/${invoiceId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert('Failed to download invoice. Please try again.')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100) // Assuming amount is in cents
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading billing history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!billing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Unable to load billing history.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          <span>Billing History</span>
        </CardTitle>
        <CardDescription>
          View your payment history and download invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Total Paid</p>
              <p className="text-sm text-gray-600">
                {formatCurrency(billing.totalPaid, billing.currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Total Invoices</p>
              <p className="text-sm text-gray-600">{billing.items.length}</p>
            </div>
          </div>
          {billing.nextBillingDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Next Billing</p>
                <p className="text-sm text-gray-600">
                  {formatDate(billing.nextBillingDate)}
                  {billing.nextBillingAmount && (
                    <span className="ml-1">
                      ({formatCurrency(billing.nextBillingAmount, billing.currency)})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Billing Items */}
        {billing.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No billing history available.</p>
            <p className="text-sm">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {billing.items.map((item) => {
              const statusConfig = STATUS_CONFIGS[item.status]
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                      <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.description}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{item.planName}</span>
                        <span>•</span>
                        <span>{formatDate(item.date)}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.invoiceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(item.id)}
                          disabled={downloading === item.id}
                          title="Download invoice"
                        >
                          {downloading === item.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      {item.receiptUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.receiptUrl, '_blank')}
                          title="View receipt"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Billing Information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Billing Information</h4>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• All payments are processed securely through Stripe</p>
            <p>• Invoices are automatically generated for each payment</p>
            <p>• You can download invoices for tax and accounting purposes</p>
            <p>• Failed payments will be retried automatically</p>
            <p>• Contact support if you have any billing questions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

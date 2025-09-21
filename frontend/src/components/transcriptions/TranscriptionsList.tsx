'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Copy,
  Eye,
  Trash2,
  Calendar,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface Transcription {
  id: string
  recordingId: string
  recordingTitle: string
  text: string
  confidenceScore: number
  language: string
  aiService: string
  status: 'processing' | 'completed' | 'failed'
  processingTime: number
  wordCount: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
  retryCount: number
  fileLifecycle?: {
    timeUntilDeletion: number
    canRetry: boolean
    transcriptionStatus: string
  }
}

export default function TranscriptionsList() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTranscriptions()
    
    // Set up real-time updates for processing transcriptions
    const interval = setInterval(() => {
      const processingTranscriptions = transcriptions.filter(t => t.status === 'processing')
      if (processingTranscriptions.length > 0) {
        fetchTranscriptions()
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [transcriptions])

  const fetchTranscriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transcriptions')
      if (response.ok) {
        const data = await response.json()
        setTranscriptions(data.transcriptions || [])
      }
    } catch (error) {
      console.error('Error fetching transcriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryTranscription = async (transcriptionId: string) => {
    setRetryingId(transcriptionId)
    try {
      const response = await fetch(`/api/transcriptions/${transcriptionId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // Refresh transcriptions
        await fetchTranscriptions()
        alert('Transcription retry started!')
      } else {
        const error = await response.json()
        alert(`Failed to retry transcription: ${error.message}`)
      }
    } catch (error) {
      console.error('Error retrying transcription:', error)
      alert('Failed to retry transcription. Please try again.')
    } finally {
      setRetryingId(null)
    }
  }

  const deleteTranscription = async (transcriptionId: string) => {
    if (!confirm('Are you sure you want to delete this transcription?')) {
      return
    }

    try {
      const response = await fetch(`/api/transcriptions/${transcriptionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTranscriptions(transcriptions.filter(t => t.id !== transcriptionId))
        alert('Transcription deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete transcription: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting transcription:', error)
      alert('Failed to delete transcription. Please try again.')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Transcription copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy text:', error)
      alert('Failed to copy text. Please try again.')
    }
  }

  const downloadTranscription = (transcription: Transcription) => {
    const content = `Transcription: ${transcription.recordingTitle}
Created: ${new Date(transcription.createdAt).toLocaleString()}
Language: ${transcription.language}
AI Service: ${transcription.aiService}
Confidence Score: ${(transcription.confidenceScore * 100).toFixed(1)}%
Word Count: ${transcription.wordCount}

${transcription.text}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcription.recordingTitle}_transcription.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'processing':
        return 'Processing'
      default:
        return 'Pending'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatTimeUntilDeletion = (milliseconds: number) => {
    if (milliseconds <= 0) return 'Expired'
    
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Transcriptions</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTranscriptions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          View and manage your AI-powered transcriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transcriptions...</p>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No transcriptions yet.</p>
            <p className="text-sm">Start a transcription from the interface above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((transcription) => (
              <div
                key={transcription.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(transcription.status)}
                      <h3 className="font-semibold text-gray-900">
                        {transcription.recordingTitle}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transcription.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : transcription.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getStatusText(transcription.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(transcription.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4" />
                        <span>{transcription.aiService}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{transcription.wordCount} words</span>
                      </div>
                      {transcription.status === 'completed' && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{(transcription.confidenceScore * 100).toFixed(1)}% confidence</span>
                        </div>
                      )}
                    </div>

                    {/* File Lifecycle Warning */}
                    {transcription.fileLifecycle && transcription.fileLifecycle.timeUntilDeletion > 0 && (
                      <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center space-x-2 text-orange-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">
                            File expires in {formatTimeUntilDeletion(transcription.fileLifecycle.timeUntilDeletion)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Transcription Text Preview */}
                    {transcription.status === 'completed' && transcription.text && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {expandedId === transcription.id 
                            ? transcription.text 
                            : transcription.text.substring(0, 200) + (transcription.text.length > 200 ? '...' : '')
                          }
                        </p>
                        {transcription.text.length > 200 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(expandedId === transcription.id ? null : transcription.id)}
                            className="mt-1 text-blue-600 hover:text-blue-700"
                          >
                            {expandedId === transcription.id ? 'Show Less' : 'Show More'}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {transcription.status === 'failed' && transcription.errorMessage && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2 text-red-700">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Error:</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{transcription.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {transcription.status === 'completed' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transcription.text)}
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadTranscription(transcription)}
                          title="Download transcription"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {transcription.status === 'failed' && transcription.fileLifecycle?.canRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryTranscription(transcription.id)}
                        disabled={retryingId === transcription.id}
                        title="Retry transcription"
                      >
                        <RefreshCw className={`h-4 w-4 ${retryingId === transcription.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTranscription(transcription.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete transcription"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

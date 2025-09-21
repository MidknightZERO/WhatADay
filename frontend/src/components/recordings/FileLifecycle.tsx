'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface FileLifecycleInfo {
  recordingId: string
  uploadedAt: string
  scheduledDeletionAt: string
  timeUntilDeletion: number
  transcriptionAttempts: number
  canRetry: boolean
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  fileType: 'audio' | 'video'
  fileSize: number
}

interface FileLifecycleProps {
  recordingId: string
  onRetryTranscription?: () => void
  onDeleteFile?: () => void
}

export default function FileLifecycle({ 
  recordingId, 
  onRetryTranscription, 
  onDeleteFile 
}: FileLifecycleProps) {
  const [fileInfo, setFileInfo] = useState<FileLifecycleInfo | null>(null)
  const [countdown, setCountdown] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Fetch file lifecycle info
    fetchFileLifecycleInfo()
    
    // Set up countdown timer
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [recordingId])

  const fetchFileLifecycleInfo = async () => {
    try {
      const result = await apiClient.getFileLifecycle(recordingId)
      if (result.data) {
        setFileInfo((result.data as { fileLifecycle: FileLifecycleInfo }).fileLifecycle)
      } else {
        console.error('Failed to fetch file lifecycle info:', result.error?.message)
      }
    } catch (error) {
      console.error('Failed to fetch file lifecycle info:', error)
    }
  }

  const updateCountdown = () => {
    if (!fileInfo) return

    const now = new Date().getTime()
    const deletionTime = new Date(fileInfo.scheduledDeletionAt).getTime()
    const timeLeft = Math.max(0, deletionTime - now)

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    setCountdown({ days, hours, minutes, seconds })
  }

  const handleRetryTranscription = async () => {
    if (!fileInfo?.canRetry) return

    setIsRetrying(true)
    try {
      const result = await apiClient.transcribeRecording(recordingId, {
        language: 'auto',
        aiService: 'gemini',
      })

      if (result.data) {
        // Refresh file info
        await fetchFileLifecycleInfo()
        onRetryTranscription?.()
        alert('Transcription retry started successfully!')
      } else {
        alert(`Failed to retry transcription: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error retrying transcription:', error)
      alert('Failed to retry transcription. Please try again.')
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const result = await apiClient.deleteFile(recordingId)
      if (result.data) {
        onDeleteFile?.()
        alert('File deleted successfully!')
      } else {
        alert(`Failed to delete file: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = () => {
    switch (fileInfo?.transcriptionStatus) {
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

  const getStatusText = () => {
    switch (fileInfo?.transcriptionStatus) {
      case 'completed':
        return 'Transcription completed - file will be deleted soon'
      case 'failed':
        return 'Transcription failed - retry available'
      case 'processing':
        return 'Transcription in progress'
      default:
        return 'Waiting for transcription'
    }
  }

  if (!fileInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading file information...</div>
        </CardContent>
      </Card>
    )
  }

  const isExpired = countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0
  const isUrgent = countdown.days === 0 && countdown.hours < 24

  return (
    <Card className={isUrgent ? 'border-orange-200 bg-orange-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>File Lifecycle</span>
        </CardTitle>
        <CardDescription>
          {getStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">File Type:</span>
            <span className="ml-2 capitalize">{fileInfo.fileType}</span>
          </div>
          <div>
            <span className="font-medium">File Size:</span>
            <span className="ml-2">{formatFileSize(fileInfo.fileSize)}</span>
          </div>
          <div>
            <span className="font-medium">Uploaded:</span>
            <span className="ml-2">{new Date(fileInfo.uploadedAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="font-medium">Attempts:</span>
            <span className="ml-2">{fileInfo.transcriptionAttempts}/3</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className={`p-4 rounded-lg ${isExpired ? 'bg-red-100 border-red-200' : isUrgent ? 'bg-orange-100 border-orange-200' : 'bg-gray-100'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              {isExpired ? 'File expired' : 'Time until deletion'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold">{countdown.days}</div>
              <div className="text-xs text-gray-600">Days</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold">{countdown.hours}</div>
              <div className="text-xs text-gray-600">Hours</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold">{countdown.minutes}</div>
              <div className="text-xs text-gray-600">Minutes</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold">{countdown.seconds}</div>
              <div className="text-xs text-gray-600">Seconds</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {fileInfo.canRetry && fileInfo.transcriptionStatus === 'failed' && (
            <Button
              onClick={handleRetryTranscription}
              disabled={isRetrying}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Transcription'}
            </Button>
          )}
          
          {fileInfo.transcriptionStatus === 'completed' && (
            <Button
              onClick={handleDeleteFile}
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete File Now
            </Button>
          )}
        </div>

        {/* Warning Messages */}
        {isExpired && (
          <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                This file has expired and will be deleted automatically.
              </span>
            </div>
          </div>
        )}

        {isUrgent && !isExpired && (
          <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                File will be deleted soon. Complete transcription or retry if needed.
              </span>
            </div>
          </div>
        )}

        {fileInfo.transcriptionStatus === 'failed' && !fileInfo.canRetry && (
          <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Maximum retry attempts reached. File will be deleted when timer expires.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

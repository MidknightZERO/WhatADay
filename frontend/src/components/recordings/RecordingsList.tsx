'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  MoreVertical,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react'
import FileLifecycle from './FileLifecycle'
import { apiClient } from '@/lib/api-client'

interface Recording {
  id: string
  title: string
  duration: number
  file_size: number
  format: string
  status: 'uploading' | 'ready' | 'processing' | 'failed'
  created_at: string
  audio_url: string
  transcription?: {
    id: string
    status: 'processing' | 'completed' | 'failed'
    text?: string
  }
}

export function RecordingsList() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRecordings()
  }, [])

  const fetchRecordings = async () => {
    try {
      const result = await apiClient.getRecordings()
      if (result.data) {
        setRecordings((result.data as { recordings?: Recording[] }).recordings || [])
      } else {
        console.error('Error fetching recordings:', result.error?.message)
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRecording = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return

    try {
      const result = await apiClient.deleteRecording(id)
      if (result.data) {
        setRecordings(prev => prev.filter(r => r.id !== id))
        alert('Recording deleted successfully!')
      } else {
        alert(`Failed to delete recording: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting recording:', error)
      alert('Failed to delete recording. Please try again.')
    }
  }

  const startTranscription = async (id: string) => {
    try {
      const result = await apiClient.transcribeRecording(id, {
        language: 'auto',
        aiService: 'gemini',
      })

      if (result.data) {
        // Update the recording with transcription info
        setRecordings(prev => prev.map(r => 
          r.id === id 
            ? { ...r, transcription: { id: (result.data as { transcription: { id: string } }).transcription.id, status: 'processing' } }
            : r
        ))
        alert('Transcription started! Check back in a few minutes.')
      } else {
        alert(`Failed to start transcription: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error starting transcription:', error)
      alert('Failed to start transcription. Please try again.')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Recordings</CardTitle>
          <CardDescription>Loading your recordings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Recordings</CardTitle>
        <CardDescription>
          {recordings.length} recording{recordings.length !== 1 ? 's' : ''} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
            <p className="text-gray-600 mb-4">
              Start by recording your voice or uploading an audio file.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {recording.title || 'Untitled Recording'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(recording.status)}`}>
                        {recording.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(recording.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(recording.created_at)}</span>
                      </div>
                      <span>{formatFileSize(recording.file_size)}</span>
                      <span className="uppercase">{recording.format}</span>
                    </div>

                    {recording.transcription && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600">
                            Transcription: {recording.transcription.status}
                          </span>
                        </div>
                        {recording.transcription.text && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {recording.transcription.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (playingId === recording.id) {
                          setPlayingId(null)
                        } else {
                          setPlayingId(recording.id)
                        }
                      }}
                    >
                      {playingId === recording.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {recording.status === 'ready' && !recording.transcription && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startTranscription(recording.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecording(recording.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {playingId === recording.id && (
                  <div className="mt-4">
                    <audio
                      controls
                      className="w-full"
                      src={recording.audio_url}
                    />
                  </div>
                )}

                {/* File Lifecycle Information */}
                <div className="mt-4">
                  <FileLifecycle 
                    recordingId={recording.id}
                    onRetryTranscription={() => {
                      // Refresh recordings list
                      fetchRecordings()
                    }}
                    onDeleteFile={() => {
                      // Remove from list
                      setRecordings(recordings.filter(r => r.id !== recording.id))
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

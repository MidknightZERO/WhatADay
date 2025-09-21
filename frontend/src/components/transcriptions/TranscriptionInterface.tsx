'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Mic, 
  FileText, 
  Play, 
  Pause, 
  Upload,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface TranscriptionRequest {
  recordingId: string
  language: string
  aiService: string
  options: {
    includeTimestamps: boolean
    includeConfidence: boolean
    customPrompt?: string
  }
}

interface Recording {
  id: string
  title: string
  duration: number
  format: string
  status: 'ready' | 'processing' | 'failed'
  createdAt: string
  audioUrl: string
}

export default function TranscriptionInterface() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [transcriptionRequest, setTranscriptionRequest] = useState<TranscriptionRequest>({
    recordingId: '',
    language: 'auto',
    aiService: 'gemini',
    options: {
      includeTimestamps: false,
      includeConfidence: true,
      customPrompt: ''
    }
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecordings()
  }, [])

  const fetchRecordings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recordings')
      if (response.ok) {
        const data = await response.json()
        // Filter recordings that are ready for transcription
        const readyRecordings = data.recordings?.filter((r: Recording) => r.status === 'ready') || []
        setRecordings(readyRecordings)
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startTranscription = async () => {
    if (!selectedRecording) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/transcriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId: selectedRecording.id,
          language: transcriptionRequest.language,
          aiService: transcriptionRequest.aiService,
          options: transcriptionRequest.options
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Transcription started:', data)
        
        // Update recording status
        setRecordings(recordings.map(r => 
          r.id === selectedRecording.id ? { ...r, status: 'processing' } : r
        ))
        
        // Reset selection
        setSelectedRecording(null)
        setTranscriptionRequest({
          recordingId: '',
          language: 'auto',
          aiService: 'gemini',
          options: {
            includeTimestamps: false,
            includeConfidence: true,
            customPrompt: ''
          }
        })
        
        alert('Transcription started! You can monitor progress in the list below.')
      } else {
        const error = await response.json()
        alert(`Failed to start transcription: ${error.message}`)
      }
    } catch (error) {
      console.error('Error starting transcription:', error)
      alert('Failed to start transcription. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <span>Start New Transcription</span>
        </CardTitle>
        <CardDescription>
          Select a recording and configure AI transcription settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Recording</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading recordings...</p>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recordings available for transcription.</p>
              <p className="text-sm">Upload or record audio files first.</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRecording?.id === recording.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRecording(recording)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {selectedRecording?.id === recording.id ? (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{recording.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(recording.duration)}</span>
                          </span>
                          <span className="uppercase">{recording.format}</span>
                          <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Play audio preview
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transcription Settings */}
        {selectedRecording && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Transcription Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Language</label>
                <select
                  value={transcriptionRequest.language}
                  onChange={(e) => setTranscriptionRequest(prev => ({
                    ...prev,
                    language: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              {/* AI Service Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">AI Service</label>
                <select
                  value={transcriptionRequest.aiService}
                  onChange={(e) => setTranscriptionRequest(prev => ({
                    ...prev,
                    aiService: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="whisper">OpenAI Whisper</option>
                  <option value="azure">Azure Speech</option>
                </select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Advanced Options</h4>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={transcriptionRequest.options.includeTimestamps}
                    onChange={(e) => setTranscriptionRequest(prev => ({
                      ...prev,
                      options: {
                        ...prev.options,
                        includeTimestamps: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include timestamps</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={transcriptionRequest.options.includeConfidence}
                    onChange={(e) => setTranscriptionRequest(prev => ({
                      ...prev,
                      options: {
                        ...prev.options,
                        includeConfidence: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include confidence scores</span>
                </label>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Custom Prompt (Optional)</label>
                <textarea
                  value={transcriptionRequest.options.customPrompt || ''}
                  onChange={(e) => setTranscriptionRequest(prev => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      customPrompt: e.target.value
                    }
                  }))}
                  placeholder="Add specific instructions for the AI (e.g., 'Focus on technical terms', 'Include speaker names')"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRecording(null)
                  setTranscriptionRequest({
                    recordingId: '',
                    language: 'auto',
                    aiService: 'gemini',
                    options: {
                      includeTimestamps: false,
                      includeConfidence: true,
                      customPrompt: ''
                    }
                  })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={startTranscription}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Transcription
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

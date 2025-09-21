'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Share2, 
  FileText, 
  Twitter, 
  Youtube, 
  Video,
  BookOpen,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  Hash,
  Play,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Transcription {
  id: string
  recordingTitle: string
  text: string
  wordCount: number
  confidenceScore: number
  language: string
  createdAt: string
}

interface ExportRequest {
  transcriptionId: string
  format: 'twitter' | 'twitlonger' | 'youtube' | 'tiktok' | 'blog'
  options: {
    // Twitter options
    maxLength?: number
    includeHashtags?: boolean
    
    // YouTube options
    includeHook?: boolean
    includeOutro?: boolean
    
    // TikTok options
    includeShotList?: boolean
    
    // Blog options
    title?: string
    includeImages?: boolean
    
    // General options
    tone?: 'professional' | 'casual' | 'engaging' | 'humorous'
    targetAudience?: string
    customPrompt?: string
  }
}

const FORMAT_CONFIGS = {
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    description: 'Short-form posts with hashtags',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  twitlonger: {
    name: 'Twitlonger',
    icon: FileText,
    description: 'Long-form Twitter threads',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    description: 'Video scripts with hooks and outros',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  tiktok: {
    name: 'TikTok',
    icon: Video,
    description: 'Short video scripts with shot lists',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  blog: {
    name: 'Blog Post',
    icon: BookOpen,
    description: 'Long-form articles with images',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

export default function ExportInterface() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<keyof typeof FORMAT_CONFIGS | null>(null)
  const [exportRequest, setExportRequest] = useState<ExportRequest>({
    transcriptionId: '',
    format: 'twitter',
    options: {
      maxLength: 280,
      includeHashtags: true,
      includeHook: true,
      includeOutro: true,
      includeShotList: true,
      title: '',
      includeImages: true,
      tone: 'engaging',
      targetAudience: '',
      customPrompt: ''
    }
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTranscriptions()
  }, [])

  const fetchTranscriptions = async () => {
    try {
      setIsLoading(true)
      const result = await apiClient.getTranscriptions()
      if (result.data) {
        // Filter only completed transcriptions
        const completedTranscriptions = (result.data as { transcriptions?: Transcription[] }).transcriptions?.filter((t: Transcription) => t.text) || []
        setTranscriptions(completedTranscriptions)
      } else {
        console.error('Error fetching transcriptions:', result.error?.message)
      }
    } catch (error) {
      console.error('Error fetching transcriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateExport = async () => {
    if (!selectedTranscription || !selectedFormat) return

    setIsGenerating(true)
    try {
      const result = await apiClient.createExport({
        transcriptionId: selectedTranscription.id,
        format: selectedFormat,
        options: exportRequest.options
      })

      if (result.data) {
        console.log('Export generated:', result.data)
        
        // Reset selection
        setSelectedTranscription(null)
        setSelectedFormat(null)
        setExportRequest({
          transcriptionId: '',
          format: 'twitter',
          options: {
            maxLength: 280,
            includeHashtags: true,
            includeHook: true,
            includeOutro: true,
            includeShotList: true,
            title: '',
            includeImages: true,
            tone: 'engaging',
            targetAudience: '',
            customPrompt: ''
          }
        })
        
        alert('Content generated successfully! Check the exports list below.')
      } else {
        alert(`Failed to generate content: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating export:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getWordCountEstimate = (format: string) => {
    switch (format) {
      case 'twitter':
        return '~280 characters'
      case 'twitlonger':
        return '~500-2000 words'
      case 'youtube':
        return '~1000-3000 words'
      case 'tiktok':
        return '~100-300 words'
      case 'blog':
        return '~800-2000 words'
      default:
        return 'Variable'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-purple-600" />
          <span>Generate Social Media Content</span>
        </CardTitle>
        <CardDescription>
          Transform your transcriptions into engaging content for different platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transcription Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Transcription</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading transcriptions...</p>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No completed transcriptions available.</p>
              <p className="text-sm">Complete a transcription first to generate content.</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {transcriptions.map((transcription) => (
                <div
                  key={transcription.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTranscription?.id === transcription.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTranscription(transcription)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {selectedTranscription?.id === transcription.id ? (
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transcription.recordingTitle}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{transcription.wordCount} words</span>
                          <span>{(transcription.confidenceScore * 100).toFixed(1)}% confidence</span>
                          <span>{formatDate(transcription.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {transcription.text.substring(0, 100)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Format Selection */}
        {selectedTranscription && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Choose Content Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(FORMAT_CONFIGS).map(([key, config]) => {
                const IconComponent = config.icon
                return (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedFormat === key
                        ? `${config.borderColor} ${config.bgColor} ring-2 ring-offset-2 ring-current`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFormat(key as keyof typeof FORMAT_CONFIGS)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent className={`h-6 w-6 ${config.color}`} />
                      <h4 className="font-semibold text-gray-900">{config.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                    <p className="text-xs text-gray-500">{getWordCountEstimate(key)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Format-Specific Options */}
        {selectedTranscription && selectedFormat && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Content Options</h3>
            
            {/* General Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tone</label>
                <select
                  value={exportRequest.options.tone}
                  onChange={(e) => setExportRequest(prev => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      tone: e.target.value as 'professional' | 'casual' | 'engaging' | 'humorous'
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="engaging">Engaging</option>
                  <option value="humorous">Humorous</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Target Audience</label>
                <input
                  type="text"
                  value={exportRequest.options.targetAudience}
                  onChange={(e) => setExportRequest(prev => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      targetAudience: e.target.value
                    }
                  }))}
                  placeholder="e.g., tech professionals, students, general audience"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Format-Specific Options */}
            {selectedFormat === 'twitter' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Twitter Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Max Length</label>
                    <input
                      type="number"
                      value={exportRequest.options.maxLength}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          maxLength: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      checked={exportRequest.options.includeHashtags}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          includeHashtags: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="text-sm text-gray-700">Include hashtags</label>
                  </div>
                </div>
              </div>
            )}

            {selectedFormat === 'youtube' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">YouTube Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportRequest.options.includeHook}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          includeHook: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Include engaging hook</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportRequest.options.includeOutro}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          includeOutro: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Include call-to-action outro</span>
                  </label>
                </div>
              </div>
            )}

            {selectedFormat === 'tiktok' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">TikTok Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportRequest.options.includeShotList}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          includeShotList: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Include shot list</span>
                  </label>
                </div>
              </div>
            )}

            {selectedFormat === 'blog' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Blog Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={exportRequest.options.title}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          title: e.target.value
                        }
                      }))}
                      placeholder="Custom blog post title"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      checked={exportRequest.options.includeImages}
                      onChange={(e) => setExportRequest(prev => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          includeImages: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="text-sm text-gray-700">Include image placeholders</label>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Custom Instructions (Optional)</label>
              <textarea
                value={exportRequest.options.customPrompt}
                onChange={(e) => setExportRequest(prev => ({
                  ...prev,
                  options: {
                    ...prev.options,
                    customPrompt: e.target.value
                  }
                }))}
                placeholder="Add specific instructions for content generation (e.g., 'Focus on actionable tips', 'Include statistics', 'Make it beginner-friendly')"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTranscription(null)
                  setSelectedFormat(null)
                  setExportRequest({
                    transcriptionId: '',
                    format: 'twitter',
                    options: {
                      maxLength: 280,
                      includeHashtags: true,
                      includeHook: true,
                      includeOutro: true,
                      includeShotList: true,
                      title: '',
                      includeImages: true,
                      tone: 'engaging',
                      targetAudience: '',
                      customPrompt: ''
                    }
                  })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={generateExport}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Content
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

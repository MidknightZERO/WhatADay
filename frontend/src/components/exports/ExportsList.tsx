'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Share2, 
  Twitter, 
  Youtube, 
  Video,
  BookOpen,
  FileText,
  Download,
  Copy,
  Eye,
  Trash2,
  Calendar,
  Zap,
  Hash,
  Play,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface Export {
  id: string
  transcriptionId: string
  transcriptionTitle: string
  format: 'twitter' | 'twitlonger' | 'youtube' | 'tiktok' | 'blog'
  content: string
  metadata: {
    characterCount?: number
    wordCount?: number
    hashtags?: string[]
    estimatedDuration?: number
    shotList?: string[]
    imagePlaceholders?: string[]
    hook?: string
    outro?: string
  }
  status: 'completed' | 'processing' | 'failed'
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

const FORMAT_ICONS = {
  twitter: Twitter,
  twitlonger: FileText,
  youtube: Youtube,
  tiktok: Video,
  blog: BookOpen
}

const FORMAT_COLORS = {
  twitter: 'text-blue-500',
  twitlonger: 'text-blue-600',
  youtube: 'text-red-500',
  tiktok: 'text-pink-500',
  blog: 'text-green-500'
}

const FORMAT_BG_COLORS = {
  twitter: 'bg-blue-50',
  twitlonger: 'bg-blue-100',
  youtube: 'bg-red-50',
  tiktok: 'bg-pink-50',
  blog: 'bg-green-50'
}

export default function ExportsList() {
  const [exports, setExports] = useState<Export[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchExports()
  }, [])

  const fetchExports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exports')
      if (response.ok) {
        const data = await response.json()
        setExports(data.exports || [])
      }
    } catch (error) {
      console.error('Error fetching exports:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteExport = async (exportId: string) => {
    if (!confirm('Are you sure you want to delete this export?')) {
      return
    }

    try {
      const response = await fetch(`/api/exports/${exportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setExports(exports.filter(e => e.id !== exportId))
        alert('Export deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete export: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting export:', error)
      alert('Failed to delete export. Please try again.')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Content copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy text:', error)
      alert('Failed to copy text. Please try again.')
    }
  }

  const downloadExport = (exportItem: Export) => {
    const formatExtension = exportItem.format === 'twitter' || exportItem.format === 'twitlonger' ? 'txt' : 'md'
    const content = `# ${exportItem.transcriptionTitle} - ${exportItem.format.toUpperCase()}
Generated: ${new Date(exportItem.createdAt).toLocaleString()}

${exportItem.content}

${exportItem.metadata.hashtags ? `\nHashtags: ${exportItem.metadata.hashtags.join(' ')}` : ''}
${exportItem.metadata.estimatedDuration ? `\nEstimated Duration: ${exportItem.metadata.estimatedDuration} seconds` : ''}
${exportItem.metadata.wordCount ? `\nWord Count: ${exportItem.metadata.wordCount}` : ''}
${exportItem.metadata.characterCount ? `\nCharacter Count: ${exportItem.metadata.characterCount}` : ''}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportItem.transcriptionTitle}_${exportItem.format}.${formatExtension}`
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const renderFormatSpecificContent = (exportItem: Export) => {
    const { format, metadata } = exportItem

    switch (format) {
      case 'twitter':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{exportItem.content}</p>
            </div>
            {metadata.hashtags && metadata.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {metadata.hashtags.map((hashtag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {hashtag}
                  </span>
                ))}
              </div>
            )}
            {metadata.characterCount && (
              <p className="text-xs text-gray-500">
                {metadata.characterCount} characters
              </p>
            )}
          </div>
        )

      case 'twitlonger':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{exportItem.content}</p>
            </div>
            {metadata.wordCount && (
              <p className="text-xs text-gray-500">
                {metadata.wordCount} words
              </p>
            )}
          </div>
        )

      case 'youtube':
        return (
          <div className="space-y-3">
            {metadata.hook && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-1">🎬 Hook</h4>
                <p className="text-sm text-red-700">{metadata.hook}</p>
              </div>
            )}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-800 mb-2">📝 Script</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{exportItem.content}</p>
            </div>
            {metadata.outro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-1">🎯 Outro</h4>
                <p className="text-sm text-red-700">{metadata.outro}</p>
              </div>
            )}
            {metadata.estimatedDuration && (
              <p className="text-xs text-gray-500">
                Estimated duration: {Math.floor(metadata.estimatedDuration / 60)}:{(metadata.estimatedDuration % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        )

      case 'tiktok':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
              <h4 className="text-sm font-medium text-pink-800 mb-2">📱 Script</h4>
              <p className="text-sm text-pink-700 whitespace-pre-wrap">{exportItem.content}</p>
            </div>
            {metadata.shotList && metadata.shotList.length > 0 && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
                <h4 className="text-sm font-medium text-pink-800 mb-2">🎬 Shot List</h4>
                <ul className="text-sm text-pink-700 space-y-1">
                  {metadata.shotList.map((shot, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-pink-600 font-medium">{index + 1}.</span>
                      <span>{shot}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {metadata.estimatedDuration && (
              <p className="text-xs text-gray-500">
                Estimated duration: {metadata.estimatedDuration} seconds
              </p>
            )}
          </div>
        )

      case 'blog':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-800 mb-2">📝 Article</h4>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{exportItem.content}</p>
            </div>
            {metadata.imagePlaceholders && metadata.imagePlaceholders.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-2">🖼️ Image Placeholders</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {metadata.imagePlaceholders.map((placeholder, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <ImageIcon className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>{placeholder}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {metadata.wordCount && (
              <p className="text-xs text-gray-500">
                {metadata.wordCount} words
              </p>
            )}
          </div>
        )

      default:
        return (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{exportItem.content}</p>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-purple-600" />
            <span>Generated Content</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExports}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          View and manage your generated social media content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading exports...</p>
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No content generated yet.</p>
            <p className="text-sm">Create your first export from the interface above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exports.map((exportItem) => {
              const FormatIcon = FORMAT_ICONS[exportItem.format]
              const formatColor = FORMAT_COLORS[exportItem.format]
              const formatBgColor = FORMAT_BG_COLORS[exportItem.format]

              return (
                <div
                  key={exportItem.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FormatIcon className={`h-5 w-5 ${formatColor}`} />
                        <h3 className="font-semibold text-gray-900">
                          {exportItem.transcriptionTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatBgColor} ${formatColor}`}>
                          {exportItem.format.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          exportItem.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : exportItem.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getStatusText(exportItem.status)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(exportItem.createdAt)}</span>
                        </div>
                        {exportItem.metadata.wordCount && (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{exportItem.metadata.wordCount} words</span>
                          </div>
                        )}
                        {exportItem.metadata.characterCount && (
                          <div className="flex items-center space-x-1">
                            <Hash className="h-4 w-4" />
                            <span>{exportItem.metadata.characterCount} chars</span>
                          </div>
                        )}
                        {exportItem.metadata.estimatedDuration && (
                          <div className="flex items-center space-x-1">
                            <Play className="h-4 w-4" />
                            <span>{exportItem.metadata.estimatedDuration}s</span>
                          </div>
                        )}
                      </div>

                      {/* Error Message */}
                      {exportItem.status === 'failed' && exportItem.errorMessage && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center space-x-2 text-red-700">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Error:</span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">{exportItem.errorMessage}</p>
                        </div>
                      )}

                      {/* Content Preview */}
                      {exportItem.status === 'completed' && (
                        <div className="mb-3">
                          {expandedId === exportItem.id ? (
                            renderFormatSpecificContent(exportItem)
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {exportItem.content.substring(0, 200)}...
                              </p>
                            </div>
                          )}
                          {exportItem.content.length > 200 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(expandedId === exportItem.id ? null : exportItem.id)}
                              className="mt-1 text-purple-600 hover:text-purple-700"
                            >
                              {expandedId === exportItem.id ? 'Show Less' : 'Show More'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {exportItem.status === 'completed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(exportItem.content)}
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadExport(exportItem)}
                            title="Download content"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExport(exportItem.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete export"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

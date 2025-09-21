'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    timestamp: string
  }
}

class ApiClient {
  private baseURL: string
  private authToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.loadAuthToken()
  }

  private loadAuthToken() {
    // In a real app, this would come from Clerk or your auth system
    // For now, we'll use a mock token for testing
    this.authToken = 'valid_clerk_session_token'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'An error occurred',
            timestamp: new Date().toISOString(),
          },
        }
      }

      return { data }
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  // Recordings API
  async getRecordings() {
    return this.request('/api/recordings')
  }

  async getRecording(id: string) {
    return this.request(`/api/recordings/${id}`)
  }

  async createRecording(formData: FormData) {
    const url = `${this.baseURL}/api/recordings`
    
    const headers: Record<string, string> = {}
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'An error occurred',
            timestamp: new Date().toISOString(),
          },
        }
      }

      return { data }
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  async deleteRecording(id: string) {
    return this.request(`/api/recordings/${id}`, {
      method: 'DELETE',
    })
  }

  async transcribeRecording(id: string, options: {
    language?: string
    aiService?: string
    includeTimestamps?: boolean
    customPrompt?: string
  }) {
    return this.request(`/api/recordings/${id}/transcribe`, {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  // Transcriptions API
  async getTranscriptions() {
    return this.request('/api/transcriptions')
  }

  async getTranscription(id: string) {
    return this.request(`/api/transcriptions/${id}`)
  }

  // Exports API
  async getExports() {
    return this.request('/api/exports')
  }

  async getExport(id: string) {
    return this.request(`/api/exports/${id}`)
  }

  async createExport(data: {
    transcriptionId: string
    format: 'twitter' | 'twitlonger' | 'youtube' | 'tiktok' | 'blog'
    options: Record<string, unknown>
  }) {
    return this.request('/api/exports', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteExport(id: string) {
    return this.request(`/api/exports/${id}`, {
      method: 'DELETE',
    })
  }

  // Subscriptions API
  async getSubscription() {
    return this.request('/api/subscriptions')
  }

  async createSubscription(data: {
    planId: string
    successUrl: string
    cancelUrl: string
  }) {
    return this.request('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async cancelSubscription() {
    return this.request('/api/subscriptions', {
      method: 'DELETE',
    })
  }

  // Usage API
  async getUsage() {
    return this.request('/api/usage')
  }

  // File Lifecycle API
  async getFileLifecycle(recordingId: string) {
    return this.request(`/api/recordings/${recordingId}/lifecycle`)
  }

  async deleteFile(recordingId: string) {
    return this.request(`/api/recordings/${recordingId}/delete-file`, {
      method: 'DELETE',
    })
  }

  // Health Check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse }

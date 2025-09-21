'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, FileText, Share2, Clock, CheckCircle } from 'lucide-react'

interface DashboardStats {
  recordings: number
  transcriptions: number
  exports: number
  recordingsToday: number
  transcriptionsToday: number
  exportsToday: number
}

interface RecentActivity {
  id: string
  type: 'recording' | 'transcription' | 'export'
  title: string
  status: 'completed' | 'processing' | 'failed'
  timestamp: string
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    recordings: 0,
    transcriptions: 0,
    exports: 0,
    recordingsToday: 0,
    transcriptionsToday: 0,
    exportsToday: 0,
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    // Mock data - in production, fetch from API
    setStats({
      recordings: 12,
      transcriptions: 8,
      exports: 15,
      recordingsToday: 2,
      transcriptionsToday: 1,
      exportsToday: 3,
    })

    setRecentActivity([
      {
        id: '1',
        type: 'export',
        title: 'Twitter post from morning thoughts',
        status: 'completed',
        timestamp: '2 minutes ago',
      },
      {
        id: '2',
        type: 'transcription',
        title: 'Meeting notes transcription',
        status: 'processing',
        timestamp: '5 minutes ago',
      },
      {
        id: '3',
        type: 'recording',
        title: 'Daily reflection recording',
        status: 'completed',
        timestamp: '1 hour ago',
      },
    ])
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <div className="h-4 w-4 rounded-full bg-red-500" />
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Mic className="h-4 w-4 text-blue-500" />
      case 'transcription':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'export':
        return <Share2 className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your content today.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Mic className="mr-2 h-4 w-4" />
          New Recording
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recordings}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recordingsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transcriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transcriptions}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.transcriptionsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exports</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exports}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.exportsToday} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest recordings, transcriptions, and exports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(activity.type)}
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mic className="mr-2 h-4 w-4" />
                Start New Recording
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Upload Audio File
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="mr-2 h-4 w-4" />
                Create Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

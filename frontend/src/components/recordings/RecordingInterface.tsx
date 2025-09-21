'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Upload, Square, Play, Pause, Video, Camera } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
  videoBlob: Blob | null
  videoUrl: string | null
  recordingType: 'audio' | 'video'
}

export function RecordingInterface() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    videoBlob: null,
    videoUrl: null,
    recordingType: 'audio',
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [isExtractingAudio, setIsExtractingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl)
      }
      if (recordingState.videoUrl) {
        URL.revokeObjectURL(recordingState.videoUrl)
      }
    }
  }, [recordingState.audioUrl, recordingState.videoUrl])

  // Function to extract audio from video
  const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      
      video.src = URL.createObjectURL(videoBlob)
      video.load()
      
      video.onloadedmetadata = async () => {
        try {
          const source = audioContext.createMediaElementSource(video)
          const destination = audioContext.createMediaStreamDestination()
          source.connect(destination)
          
          const mediaRecorder = new MediaRecorder(destination.stream)
          const chunks: BlobPart[] = []
          
          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data)
          }
          
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' })
            URL.revokeObjectURL(video.src)
            resolve(audioBlob)
          }
          
          mediaRecorder.start()
          video.play()
          
          video.onended = () => {
            mediaRecorder.stop()
          }
          
        } catch (error) {
          reject(error)
        }
      }
      
      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }
    })
  }

  const startRecording = async (type: 'audio' | 'video' = 'audio') => {
    try {
      const constraints = type === 'video' 
        ? { audio: true, video: true } 
        : { audio: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        })
        const url = URL.createObjectURL(blob)
        
        if (type === 'video') {
          setRecordingState(prev => ({
            ...prev,
            videoBlob: blob,
            videoUrl: url,
          }))
        } else {
          setRecordingState(prev => ({
            ...prev,
            audioBlob: blob,
            audioUrl: url,
          }))
        }
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        recordingType: type,
      }))

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }))
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      const message = recordingState.recordingType === 'video' 
        ? 'Could not access camera and microphone. Please check permissions.'
        : 'Could not access microphone. Please check permissions.'
      alert(message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop()
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }))
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume()
        setRecordingState(prev => ({ ...prev, isPaused: false }))
        
        // Resume timer
        intervalRef.current = setInterval(() => {
          setRecordingState(prev => ({
            ...prev,
            duration: prev.duration + 1,
          }))
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        setRecordingState(prev => ({ ...prev, isPaused: true }))
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }

  const playRecording = () => {
    if (audioRef.current && recordingState.audioUrl) {
      audioRef.current.play()
    }
  }

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const saveRecording = async () => {
    if (!recordingState.audioBlob && !recordingState.videoBlob) return

    setIsUploading(true)
    try {
      let audioBlob = recordingState.audioBlob
      
      // If we have video, extract audio from it
      if (recordingState.videoBlob && !audioBlob) {
        setIsExtractingAudio(true)
        try {
          audioBlob = await extractAudioFromVideo(recordingState.videoBlob)
        } catch (error) {
          console.error('Error extracting audio from video:', error)
          alert('Failed to extract audio from video. Please try again.')
          return
        } finally {
          setIsExtractingAudio(false)
        }
      }

      if (!audioBlob) {
        alert('No audio data available to save.')
        return
      }

      const formData = new FormData()
      formData.append('audioFile', audioBlob, 'recording.webm')
      formData.append('title', `${recordingState.recordingType === 'video' ? 'Video' : 'Audio'} Recording ${new Date().toLocaleString()}`)
      
      // If we have video, also save the video file
      if (recordingState.videoBlob) {
        formData.append('videoFile', recordingState.videoBlob, 'recording.webm')
      }

      const result = await apiClient.createRecording(formData)

      if (result.data) {
        // Reset recording state
        setRecordingState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          audioBlob: null,
          audioUrl: null,
          videoBlob: null,
          videoUrl: null,
          recordingType: 'audio',
        })
        alert('Recording saved successfully!')
      } else {
        alert(`Failed to save recording: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      alert('Failed to save recording. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Audio & Video</CardTitle>
        <CardDescription>
          Record your voice, video, or upload audio/video files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="space-y-4">
          {!recordingState.isRecording && !recordingState.audioBlob && !recordingState.videoBlob && (
            <div className="flex flex-col space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => startRecording('audio')}
                  className="bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Record Audio
                </Button>
                <Button 
                  onClick={() => startRecording('video')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Video className="mr-2 h-5 w-5" />
                  Record Video
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const audioUrl = URL.createObjectURL(file)
                        setRecordingState(prev => ({
                          ...prev,
                          audioBlob: file,
                          audioUrl,
                        }))
                      }
                    }}
                  />
                  <Button variant="outline" className="w-full" size="lg">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Audio
                  </Button>
                </div>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const videoUrl = URL.createObjectURL(file)
                        setRecordingState(prev => ({
                          ...prev,
                          videoBlob: file,
                          videoUrl,
                        }))
                      }
                    }}
                  />
                  <Button variant="outline" className="w-full" size="lg">
                    <Camera className="mr-2 h-5 w-5" />
                    Upload Video
                  </Button>
                </div>
              </div>
            </div>
          )}

          {recordingState.isRecording && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-mono text-red-600 mb-2">
                  {formatTime(recordingState.duration)}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    {recordingState.isPaused ? 'Paused' : 'Recording...'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex-1"
                >
                  {recordingState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {recordingState.isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  onClick={stopRecording}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
          )}

          {(recordingState.audioBlob || recordingState.videoBlob) && !recordingState.isRecording && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-mono text-gray-600 mb-2">
                  Duration: {formatTime(recordingState.duration)}
                </div>
                
                {recordingState.videoBlob && recordingState.videoUrl && (
                  <video
                    ref={videoRef}
                    src={recordingState.videoUrl}
                    controls
                    className="w-full max-h-64 rounded-lg"
                  />
                )}
                
                {recordingState.audioBlob && recordingState.audioUrl && (
                  <audio
                    ref={audioRef}
                    src={recordingState.audioUrl}
                    controls
                    className="w-full"
                  />
                )}
                
                {recordingState.videoBlob && !recordingState.audioBlob && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📹 Video recorded! Audio will be extracted automatically when you save.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={saveRecording}
                  disabled={isUploading || isExtractingAudio}
                  className="flex-1"
                >
                  {isExtractingAudio ? 'Extracting Audio...' : isUploading ? 'Saving...' : 'Save Recording'}
                </Button>
                <Button
                  onClick={() => {
                    setRecordingState({
                      isRecording: false,
                      isPaused: false,
                      duration: 0,
                      audioBlob: null,
                      audioUrl: null,
                      videoBlob: null,
                      videoUrl: null,
                      recordingType: 'audio',
                    })
                  }}
                  variant="outline"
                >
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

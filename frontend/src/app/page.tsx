import { Button } from '@/components/ui/button'
import { Mic, FileText, Share2 } from 'lucide-react'
import Image from 'next/image'
import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function HomePage() {
  return (
    <>
      <SignedIn>
        {redirect('/dashboard')}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          {/* Header with theme toggle */}
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>
          
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <Image
                  src="/logo.svg"
                  alt="WhatADay Logo"
                  width={200}
                  height={130}
                  className="h-32 w-auto"
                />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                WhatADay
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                Transform your voice recordings into engaging social media content. 
                Record, transcribe, and export to multiple platforms with AI-powered intelligence.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <Mic className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Record</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Record your thoughts live or upload audio files in multiple formats.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <FileText className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Transcribe</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    AI-powered transcription with high accuracy and confidence scoring.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <Share2 className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Export</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Generate content for Twitter, YouTube, TikTok, blogs, and more.
                  </p>
                </div>
              </div>
              
              <div className="space-x-4">
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    Get Started
                  </Button>
                </SignUpButton>
                <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  )
}
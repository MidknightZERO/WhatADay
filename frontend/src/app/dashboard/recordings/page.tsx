import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RecordingsList } from '@/components/recordings/RecordingsList'
import { RecordingInterface } from '@/components/recordings/RecordingInterface'

export default function RecordingsPage() {
  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Recordings</h1>
                <p className="text-gray-600">Manage your voice recordings and start new ones</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <RecordingInterface />
              </div>
              <div className="lg:col-span-2">
                <RecordingsList />
              </div>
            </div>
          </div>
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}



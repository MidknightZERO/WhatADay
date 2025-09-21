import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'

export default function DashboardPage() {
  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <DashboardOverview />
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}



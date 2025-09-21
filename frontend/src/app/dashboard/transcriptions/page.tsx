import { DashboardLayout } from '@/components/layout/DashboardLayout';
import TranscriptionInterface from '@/components/transcriptions/TranscriptionInterface';
import TranscriptionsList from '@/components/transcriptions/TranscriptionsList';

export default function TranscriptionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transcriptions</h1>
            <p className="text-gray-600">Manage your AI-powered transcriptions and view results.</p>
          </div>
        </div>
        
        <TranscriptionInterface />
        <TranscriptionsList />
      </div>
    </DashboardLayout>
  );
}

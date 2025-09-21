import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ExportInterface from '@/components/exports/ExportInterface';
import ExportsList from '@/components/exports/ExportsList';

export default function ExportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Exports</h1>
            <p className="text-gray-600">Transform your transcriptions into engaging social media content.</p>
          </div>
        </div>
        
        <ExportInterface />
        <ExportsList />
      </div>
    </DashboardLayout>
  );
}

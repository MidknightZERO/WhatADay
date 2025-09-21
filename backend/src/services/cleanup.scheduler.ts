import { TranscriptionService } from './transcription.service';

export class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  start(): void {
    console.log('🧹 Starting file cleanup scheduler...');
    
    // Run cleanup immediately on start
    this.runCleanup();
    
    // Schedule regular cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧹 File cleanup scheduler stopped');
    }
  }

  async triggerCleanup(): Promise<void> {
    console.log('🧹 Manual cleanup triggered');
    await this.runCleanup();
  }

  private async runCleanup(): Promise<void> {
    try {
      console.log('🧹 Running file cleanup...');
      const transcriptionService = new TranscriptionService();
      await transcriptionService.cleanupExpiredFiles();
      console.log('✅ File cleanup completed');
    } catch (error) {
      console.error('❌ File cleanup failed:', error);
    }
  }
}
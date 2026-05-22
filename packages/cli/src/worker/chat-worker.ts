import type { CliSyncEngine } from "./sync-engine.js";

export interface WorkerStatus {
  running: boolean;
  lastPullTimestamp: string | null;
  lastPushTimestamp: string | null;
  errorCount: number;
}

export class ChatWorker {
  private readonly engine: CliSyncEngine;
  private running = false;
  private pullIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastPullTimestamp: string | null = null;
  private lastPushTimestamp: string | null = null;
  private errorCount = 0;

  constructor(engine: CliSyncEngine) {
    this.engine = engine;
  }

  async start(pollIntervalMs = 5000): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    console.log("Sync worker started.");

    await this.doPull();

    this.pullIntervalId = setInterval(() => {
      void this.doPull();
    }, pollIntervalMs);

    await this.doPush();
  }

  stop(): void {
    this.running = false;
    if (this.pullIntervalId !== null) {
      clearInterval(this.pullIntervalId);
      this.pullIntervalId = null;
    }
    console.log("Sync worker stopped.");
  }

  status(): WorkerStatus {
    return {
      running: this.running,
      lastPullTimestamp: this.lastPullTimestamp,
      lastPushTimestamp: this.lastPushTimestamp,
      errorCount: this.errorCount,
    };
  }

  private async doPull(): Promise<void> {
    try {
      const result = await this.engine.pull();
      if (result.success) {
        this.lastPullTimestamp = new Date().toISOString();
      } else {
        this.errorCount++;
      }
    } catch {
      this.errorCount++;
    }
  }

  private async doPush(): Promise<void> {
    try {
      const pending = this.engine.getPendingMutations();
      if (pending.length > 0) {
        const flushResult = await this.engine.flush();
        if (flushResult.replayed > 0) {
          this.lastPushTimestamp = new Date().toISOString();
        }
        this.errorCount += flushResult.failed.length;
      }
    } catch {
      this.errorCount++;
    }
  }
}

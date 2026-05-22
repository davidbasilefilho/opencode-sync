import type { SyncConfig } from "@opencode-sync/types";

export interface SyncStatus {
  connected: boolean;
  pendingCount: number;
  lastSyncTimestamp: string | null;
  convexUrl: string | null;
}

interface PendingMutation {
  readonly id: string;
  readonly type: "pushThread" | "pushMessage" | "pushToolResult";
  readonly payload: unknown;
  readonly createdAt: string;
}

interface PushResult {
  readonly success: boolean;
  readonly error?: string;
}

interface PullResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T[];
  readonly error?: string;
}

interface FlushResult {
  readonly replayed: number;
  readonly failed: PendingMutation[];
}

export class CliSyncEngine {
  private convexUrl: string | null = null;
  private apiKey: string | null = null;
  private machineId: string | null = null;
  private lastSyncTimestamp: string | null = null;
  private readonly pendingMutations: PendingMutation[] = [];
  private connected = false;

  connect(config: SyncConfig): void {
    this.convexUrl = config.convexUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.machineId = config.machineId;
    this.connected = true;
  }

  disconnect(): void {
    this.convexUrl = null;
    this.apiKey = null;
    this.machineId = null;
    this.connected = false;
  }

  status(): SyncStatus {
    return {
      connected: this.connected,
      pendingCount: this.pendingMutations.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      convexUrl: this.convexUrl,
    };
  }

  async push(updates: unknown): Promise<PushResult> {
    if (!this.connected || !this.convexUrl || !this.apiKey) {
      const mutation: PendingMutation = {
        id: crypto.randomUUID(),
        type: "pushMessage",
        payload: updates,
        createdAt: new Date().toISOString(),
      };
      this.pendingMutations.push(mutation);
      return { success: false, error: "Offline: mutation buffered" };
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/actions/sync.push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          machineId: this.machineId,
          updates,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      this.lastSyncTimestamp = new Date().toISOString();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Push failed: ${message}` };
    }
  }

  async pull<T = unknown>(): Promise<PullResult<T>> {
    if (!this.connected || !this.convexUrl || !this.apiKey) {
      return { success: false, data: [], error: "Not connected" };
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/actions/sync.pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          machineId: this.machineId,
          since: this.lastSyncTimestamp,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = (await response.json()) as { result?: T[] };
      this.lastSyncTimestamp = new Date().toISOString();
      return { success: true, data: data.result ?? [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Pull failed: ${message}` };
    }
  }

  getPendingMutations(): readonly PendingMutation[] {
    return [...this.pendingMutations];
  }

  async flush(): Promise<FlushResult> {
    const failed: PendingMutation[] = [];
    const batch = [...this.pendingMutations];
    this.pendingMutations.length = 0;

    for (const mutation of batch) {
      const result = await this.push(mutation.payload);
      if (!result.success) {
        failed.push(mutation);
      }
    }

    if (failed.length > 0) {
      this.pendingMutations.push(...failed);
    }

    return { replayed: batch.length - failed.length, failed };
  }

  async checkConnectivity(): Promise<boolean> {
    if (!this.convexUrl || !this.apiKey) {
      this.connected = false;
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.convexUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);
      this.connected = response.ok;
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }
}

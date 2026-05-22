import type { SyncConfig } from "opencodedb-types";

/** Represents a pending mutation that was buffered while offline. */
export interface PendingMutation {
  readonly id: string;
  readonly type: "pushThread" | "pushMessage" | "pushToolResult";
  readonly payload: unknown;
  readonly createdAt: string;
}

/** Status snapshot returned by the sync engine. */
export interface SyncStatus {
  readonly connected: boolean;
  readonly pendingCount: number;
  readonly lastSyncTimestamp: string | null;
  readonly convexUrl: string | null;
}

/** Options for pulling changes from Convex. */
export interface PullOptions {
  readonly since?: string;
}

/** Result of a push operation. */
export interface PushResult {
  readonly success: boolean;
  readonly error?: string;
}

/** Result of a pull operation. */
export interface PullResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T[];
  readonly error?: string;
}

/**
 * HTTP-based sync engine that communicates with a Convex backend.
 *
 * Uses fetch() to call Convex HTTP actions. Buffers mutations when offline and replays them when
 * connectivity is restored.
 */
export class SyncEngine {
  private convexUrl: string | null = null;
  private apiKey: string | null = null;
  private machineId: string | null = null;
  private lastSyncTimestamp: string | null = null;
  private readonly pendingMutations: PendingMutation[] = [];
  private connected = false;

  /** Configures the engine with Convex connection details. */
  connect(config: SyncConfig): void {
    this.convexUrl = config.convexUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.machineId = config.machineId;
    this.connected = true;
  }

  /** Disconnects the engine and clears connection state. */
  disconnect(): void {
    this.convexUrl = null;
    this.apiKey = null;
    this.machineId = null;
    this.connected = false;
  }

  /** Returns the current sync status. */
  status(): SyncStatus {
    return {
      connected: this.connected,
      pendingCount: this.pendingMutations.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      convexUrl: this.convexUrl,
    };
  }

  /** Pushes updates to Convex. Buffers mutations if offline and returns a cached result. */
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

  /** Pulls changes from Convex since the given timestamp (or last sync). */
  async pull<T = unknown>(options?: PullOptions): Promise<PullResult<T>> {
    if (!this.connected || !this.convexUrl || !this.apiKey) {
      return { success: false, data: [], error: "Not connected" };
    }

    const since = options?.since ?? this.lastSyncTimestamp;

    try {
      const response = await fetch(`${this.convexUrl}/api/actions/sync.pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          machineId: this.machineId,
          since: since ?? null,
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

  /** Returns all buffered pending mutations. */
  getPendingMutations(): readonly PendingMutation[] {
    return [...this.pendingMutations];
  }

  /** Attempts to replay all buffered mutations. Clears the buffer on success. */
  async flush(): Promise<{ replayed: number; failed: PendingMutation[] }> {
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

  /** Checks connectivity by performing a lightweight GET to the Convex URL. */
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

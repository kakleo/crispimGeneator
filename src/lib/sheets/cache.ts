import type { SheetData } from '../schema/types';

interface CacheEntry {
  data: SheetData;
  timestamp: number;
  etag?: string;
}

const DEFAULT_TTL_SECONDS = 60;

class SheetCache {
  private cache: CacheEntry | null = null;
  private staleBackup: CacheEntry | null = null;
  private ttlMs: number;

  constructor() {
    const envTtl = Number(process.env.CACHE_TTL_SECONDS);
    this.ttlMs = (isNaN(envTtl) || envTtl <= 0 ? DEFAULT_TTL_SECONDS : envTtl) * 1000;
  }

  public get(): { data: SheetData; isStale: boolean; lastUpdated: string } | null {
    const now = Date.now();

    if (this.cache && now - this.cache.timestamp < this.ttlMs) {
      return {
        data: this.cache.data,
        isStale: false,
        lastUpdated: new Date(this.cache.timestamp).toISOString(),
      };
    }

    // If cache expired, but we have data, we might treat it as stale if fresh fetch fails
    return null;
  }

  public getStaleBackup(): { data: SheetData; isStale: boolean; lastUpdated: string } | null {
    if (this.staleBackup) {
      return {
        data: this.staleBackup.data,
        isStale: true,
        lastUpdated: new Date(this.staleBackup.timestamp).toISOString(),
      };
    }
    return null;
  }

  public set(data: SheetData): void {
    const now = Date.now();
    const entry: CacheEntry = {
      data,
      timestamp: now,
    };
    this.cache = entry;
    this.staleBackup = entry;
  }

  public clear(): void {
    this.cache = null;
  }

  public getLastUpdatedTime(): string | undefined {
    if (this.cache) {
      return new Date(this.cache.timestamp).toLocaleTimeString();
    }
    return undefined;
  }
}

export const sheetCache = new SheetCache();

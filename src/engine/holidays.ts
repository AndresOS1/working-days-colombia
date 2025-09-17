import { HolidaysProvider, IsoDateStr } from "./types.js";
import { setTimeout as delay } from "node:timers/promises";
import { request } from "undici";

const HOLIDAYS_URL = "https://content.capta.co/Recruitment/WorkingDays.json";

export class RemoteHolidaysProvider implements HolidaysProvider {
  private cache: Set<IsoDateStr> | null = null;
  private lastFetchOkAt: number | null = null;

  constructor(
    private readonly url: string = HOLIDAYS_URL,
    private readonly cacheTtlMs: number = 1000 * 60 * 60 // 1h
  ) {}

  public async getHolidays(): Promise<Set<IsoDateStr>> {
    const now = Date.now();
    if (this.cache && this.lastFetchOkAt && now - this.lastFetchOkAt < this.cacheTtlMs) {
      return this.cache;
    }
    // Retry simple: 2 short backoff attempts
    let lastErr: unknown = null;
    for (const waitMs of [0, 300]) {
      try {
        if (waitMs) await delay(waitMs);
        const res = await request(this.url, { method: "GET" });
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        const body = await res.body.json();

        const parsed = this.parseHolidayPayload(body);
        this.cache = parsed;
        this.lastFetchOkAt = Date.now();
        return parsed;
      } catch (e) {
        lastErr = e;
      }
    }
    // If it fails, it propagates for the caller to respond 503
    throw new Error(`Failed to fetch holidays: ${String(lastErr)}`);
  }

  private parseHolidayPayload(payload: unknown): Set<IsoDateStr> {
    const set = new Set<IsoDateStr>();
    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (typeof item === "string") {
          // Accept 'YYYY-MM-DD'
          set.add(item);
        } else if (item && typeof item === "object") {
          // Common key attempts: date / iso / day
          const maybe =
            (item as Record<string, unknown>)["date"] ??
            (item as Record<string, unknown>)["iso"] ??
            (item as Record<string, unknown>)["day"];
          if (typeof maybe === "string") set.add(maybe);
        }
      }
    } else if (payload && typeof payload === "object") {
      // Sometimes it comes as { holidays: [...] }
      const arr = (payload as Record<string, unknown>)["holidays"];
      if (Array.isArray(arr)) {
        for (const v of arr) {
          if (typeof v === "string") set.add(v);
          else if (v && typeof v === "object") {
            const maybe =
              (v as Record<string, unknown>)["date"] ??
              (v as Record<string, unknown>)["iso"] ??
              (v as Record<string, unknown>)["day"];
            if (typeof maybe === "string") set.add(maybe);
          }
        }
      }
    }
    return set;
  }
}
import { DateTime } from "luxon";
import { HolidaysProvider, IsoDateStr, IsoUtcStr } from "./types.js";

const TZ = "America/Bogota";
const MORNING_START = { hour: 8, minute: 0 };
const MORNING_END = { hour: 12, minute: 0 };
const AFTERNOON_START = { hour: 13, minute: 0 };
const AFTERNOON_END = { hour: 17, minute: 0 };

export interface EngineOptions {
  holidaysProvider: HolidaysProvider;
}

export class BusinessTimeEngine {
  private readonly holidaysProvider: HolidaysProvider;

  constructor(opts: EngineOptions) {
    this.holidaysProvider = opts.holidaysProvider;
  }

  // ---- Main API -------------------------------------------------------

  /**
   * Calculates the resulting date in UTC, given days/hours and a UTC base (optional).
   * - If 'date' is omitted: Use "now" in Colombia.
   * - Sums days (business days) first, then hours (business hours).
   * - Returns ISO with a 'Z' suffix.
   */

  public async calculate({
    days,
    hours,
    date,
  }: {
    days?: number;
    hours?: number;
    date?: IsoUtcStr;
  }): Promise<IsoUtcStr> {
    const holidays = await this.holidaysProvider.getHolidays();

    let baseLocal = date ? this.utcToBogota(date) : DateTime.now().setZone(TZ);

    // 1) Normalize backward for day count
    if (days && days > 0) {
      baseLocal = this.snapBackwardToWorkingInstant(baseLocal, holidays);
      baseLocal = this.addBusinessDays(baseLocal, days, holidays);
    }

    // 2) Normalize forward for hour computation
    if (hours && hours > 0) {
      baseLocal = this.snapForwardToWorkingInstant(baseLocal, holidays);
      baseLocal = this.addBusinessHours(baseLocal, hours, holidays);
    }

    // If neither days nor hours were sent, but 'date' was, it's a parameter error;
    // This validation is done upstream.
    return this.bogotaToUtcIso(baseLocal);
  }

  // ---- Zone conversion -------------------------------------------------

  private utcToBogota(isoUtc: IsoUtcStr): DateTime {
    const dt = DateTime.fromISO(isoUtc, { zone: "utc" });
    if (!dt.isValid) throw new Error("Invalid ISO UTC date.");
    return dt.setZone(TZ);
  }

  private bogotaToUtcIso(bogota: DateTime): IsoUtcStr {
    const utc = bogota.setZone("utc");
    // ISO with 'Z' suffix and seconds
    return utc.toISO({ suppressMilliseconds: true }) as IsoUtcStr;
  }

  // ---- Business calendar --------------------------------------------------

  private isWeekend(dt: DateTime): boolean {
    // 1 = Monday ... 7 = Sunday
    return dt.weekday === 6 || dt.weekday === 7;
  }

  private isHoliday(dt: DateTime, holidays: Set<IsoDateStr>): boolean {
    const key = dt.toISODate() as IsoDateStr; // YYYY-MM-DD
    return holidays.has(key);
  }

  private isBusinessDay(dt: DateTime, holidays: Set<IsoDateStr>): boolean {
    return !this.isWeekend(dt) && !this.isHoliday(dt, holidays);
  }

  private isWithinMorning(dt: DateTime): boolean {
    const mStart = dt.set(MORNING_START);
    const mEnd = dt.set(MORNING_END);
    return dt >= mStart && dt < mEnd;
  }

  // ---- Normalizations -----------------------------------------------------

  /**
   * Back to the nearest business hour of the SAME day if possible,
   * or to the close of business (5:00 PM) of the previous business day.
   * - If lunchtime (12:00 PM, 1:00 PM): down to 12:00 PM of the same day.
   * - If before 8:00 AM: down to 5:00 PM of the previous business day.
   * - If after 5:00 PM: down to 5:00 PM of the same day (if a business day) or the previous business day.
   * - If a non-business day: 5:00 PM of the previous business day.
   */
  private snapBackwardToWorkingInstant(
    dt: DateTime,
    holidays: Set<IsoDateStr>
  ): DateTime {
    const cur = dt;

    const sameDay17 = (d: DateTime) => d.set(AFTERNOON_END);
    const sameDay12 = (d: DateTime) => d.set(MORNING_END);

    const prevBusinessClose = (d: DateTime) => {
      let p = d.minus({ days: 1 }).startOf("day").set(AFTERNOON_END);
      while (!this.isBusinessDay(p, holidays)) {
        p = p.minus({ days: 1 }).startOf("day").set(AFTERNOON_END);
      }
      return p;
    };

    if (!this.isBusinessDay(cur, holidays)) {
      return prevBusinessClose(cur);
    }

    const mStart = cur.set(MORNING_START);
    const mEnd = cur.set(MORNING_END);
    const aStart = cur.set(AFTERNOON_START);
    const aEnd = cur.set(AFTERNOON_END);

    if (cur < mStart) {
      return prevBusinessClose(cur);
    }
    if (cur >= mStart && cur < mEnd) {
      return cur; // already within (morning)
    }
    if (cur >= mEnd && cur < aStart) {
      return sameDay12(cur); // down to 12:00
    }
    if (cur >= aStart && cur < aEnd) {
      return cur; // already within (afternoon)
    }
    // cur >= 17:00
    return this.isBusinessDay(cur, holidays)
      ? sameDay17(cur)
      : prevBusinessClose(cur);
  }

  /**
   * Forward to the next business day:
   * - If before 8:00 AM -> 8:00 AM on the same day (if business day) or the next business day.
   * - If at lunch -> 1:00 PM.
   * - If >= 5:00 PM or on a non-business day -> 8:00 AM of the next business day.
   */
  private snapForwardToWorkingInstant(
    dt: DateTime,
    holidays: Set<IsoDateStr>
  ): DateTime {
    const cur = dt;

    const nextBusinessOpen = (d: DateTime) => {
      let n = d.plus({ days: 1 }).startOf("day").set(MORNING_START);
      while (!this.isBusinessDay(n, holidays)) {
        n = n.plus({ days: 1 }).startOf("day").set(MORNING_START);
      }
      return n;
    };

    if (!this.isBusinessDay(cur, holidays)) return nextBusinessOpen(cur);

    const mStart = cur.set(MORNING_START);
    const mEnd = cur.set(MORNING_END);
    const aStart = cur.set(AFTERNOON_START);
    const aEnd = cur.set(AFTERNOON_END);

    if (cur < mStart) return mStart;
    if (cur >= mStart && cur < mEnd) return cur;
    if (cur >= mEnd && cur < aStart) return aStart;
    if (cur >= aStart && cur < aEnd) return cur;
    return nextBusinessOpen(cur);
  }

  // ---- Sums ---------------------------------------------------------------

  private addBusinessDays(
    dt: DateTime,
    days: number,
    holidays: Set<IsoDateStr>
  ): DateTime {
    let cur = dt;
    let remaining = days;

    while (remaining > 0) {
      cur = cur.plus({ days: 1 });
      while (!this.isBusinessDay(cur, holidays)) {
        cur = cur.plus({ days: 1 });
      }
      // Preserve original hour/minute
      const preserved = cur.set({
        hour: dt.hour,
        minute: dt.minute,
        second: 0,
        millisecond: 0,
      });
      cur = preserved;
      remaining--;
    }
    return cur;
  }

  private addBusinessHours(
    dt: DateTime,
    hours: number,
    holidays: Set<IsoDateStr>
  ): DateTime {
    let cur = dt;
    let remainingMin = hours * 60;

    while (remainingMin > 0) {
      cur = this.snapForwardToWorkingInstant(cur, holidays);

      // Determine end of current block (12:00 or 17:00)
      const blockEnd = this.isWithinMorning(cur)
        ? cur.set(MORNING_END)
        : cur.set(AFTERNOON_END);

      const available = blockEnd.diff(cur, "minutes").minutes;
      if (remainingMin <= available) {
        cur = cur
          .plus({ minutes: remainingMin })
          .set({ second: 0, millisecond: 0 });
        remainingMin = 0;
      } else {
        // Consume the block and jump to the next working start
        remainingMin -= available;
        // If it was a morning block, jump to 1:00 PM; if it was an afternoon block, jump to 8:00 AM of the next business day
        if (this.isWithinMorning(cur)) {
          cur = cur.set(AFTERNOON_START);
        } else {
          // next business day 08:00
          cur = cur.plus({ days: 1 }).startOf("day").set(MORNING_START);
          while (!this.isBusinessDay(cur, holidays)) {
            cur = cur.plus({ days: 1 }).startOf("day").set(MORNING_START);
          }
        }
      }
    }
    return cur;
  }
}

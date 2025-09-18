import { Request, Response } from "express";
import { BusinessTimeEngine } from "../engine/businessTime.js";
import { RemoteHolidaysProvider } from "../engine/holidays.js";
import {
  querySchema,
  badRequest,
  upstreamUnavailable,
  internalError,
} from "../utils/http";
import { SuccessResponse } from "../engine/types";

const engine = new BusinessTimeEngine({
  holidaysProvider: new RemoteHolidaysProvider(),
});

export const getWorkingDate = async (req: Request, res: Response) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      return badRequest(res, msg);
    }
    const { days, hours, date } = parsed.data;

    if (days === undefined && hours === undefined) {
      return badRequest(
        res,
        "at least one of 'days' or 'hours' must be provided"
      );
    }

    let utc: string;
    try {
      utc = await engine.calculate({ days, hours, date });
    } catch (e) {
      const message = String(e ?? "unknown");
      if (message.includes("Failed to fetch holidays")) {
        return upstreamUnavailable(res, "Holidays source unavailable");
      }
      return internalError(res, "Unexpected error");
    }

    const payload: SuccessResponse = { date: utc };
    return res.status(200).json(payload);
  } catch {
    return internalError(res, "Unexpected error");
  }
};

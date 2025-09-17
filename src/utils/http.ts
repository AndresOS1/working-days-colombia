import { Request, Response } from "express";
import { z } from "zod";
import { ErrorResponse } from "../engine/types";

export const querySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: "days must be a positive integer",
    }),
  hours: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: "hours must be a positive integer",
    }),
  date: z
    .string()
    .optional()
    .refine((v) => v === undefined || /Z$/.test(v), {
      message: "date must be ISO 8601 UTC ending with 'Z'",
    }),
});

export function badRequest(res: Response, message: string): Response {
  const payload: ErrorResponse = { error: "InvalidParameters", message };
  return res.status(400).type("application/json").send(JSON.stringify(payload));
}

export function upstreamUnavailable(res: Response, message: string): Response {
  const payload: ErrorResponse = { error: "UpstreamUnavailable", message };
  return res.status(503).type("application/json").send(JSON.stringify(payload));
}

export function internalError(res: Response, message: string): Response {
  const payload: ErrorResponse = { error: "InternalError", message };
  return res.status(500).type("application/json").send(JSON.stringify(payload));
}

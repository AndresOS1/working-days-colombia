export type IsoDateStr = string; // 'YYYY-MM-DD'
export type IsoUtcStr = string; // ISO 8601 con 'Z'

export interface WorkingRequest {
  days?: number;
  hours?: number;
  date?: IsoUtcStr;
}

export interface SuccessResponse {
  date: IsoUtcStr;
}

export interface ErrorResponse {
  error: "InvalidParameters" | "UpstreamUnavailable" | "InternalError";
  message: string;
}

export interface HolidaysProvider {
  getHolidays(): Promise<Set<IsoDateStr>>;
}

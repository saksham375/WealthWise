import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth-server";
import type { JWTPayload } from "@/types";

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiCreated<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function apiError(message: string, status = 400, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function apiUnauthorized(): NextResponse<ApiError> {
  return apiError("Unauthorized", 401);
}

export function apiNotFound(entity = "Resource"): NextResponse<ApiError> {
  return apiError(`${entity} not found`, 404);
}

export function apiServerError(error: unknown, context?: string): NextResponse<ApiError> {
  console.error(`[${context ?? "API"}]`, error);
  return apiError("Internal server error", 500);
}

export function requireAuth(): JWTPayload | NextResponse<ApiError> {
  const payload = getAuthPayload();
  if (!payload) return apiUnauthorized();
  return payload;
}

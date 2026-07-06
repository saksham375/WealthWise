import { cookies } from "next/headers";
import { verifyToken } from "./auth";
import type { JWTPayload } from "@/types";

export function getTokenFromCookie(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get("ww_token")?.value;
}

export function getAuthPayload(): JWTPayload | null {
  try {
    const token = getTokenFromCookie();
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

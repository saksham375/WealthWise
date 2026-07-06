import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { JWTPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Please set it in your .env file.");
}
const ACCESS_EXPIRY = "24h";
const REMEMBER_EXPIRY = "30d";

export function signToken(payload: JWTPayload, rememberMe = false): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? REMEMBER_EXPIRY : ACCESS_EXPIRY,
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function scorePassword(password: string): number {
  let score = 0;

  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  return Math.min(score, 100);
}

export function getPasswordStrengthLabel(score: number): string {
  if (score < 25) return "Weak";
  if (score < 50) return "Fair";
  if (score < 75) return "Good";
  return "Very Strong";
}

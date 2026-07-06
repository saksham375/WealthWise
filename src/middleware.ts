import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/check-email",
  "/api/auth/forgot-password",
];

const publicApiPrefixes = ["/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    publicRoutes.includes(pathname) ||
    publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("ww_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

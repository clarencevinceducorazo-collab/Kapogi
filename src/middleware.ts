/**
 * Next.js Middleware — CORS + Security Gate + NextAuth
 *
 * This middleware combines NextAuth route handling with critical CORS/Security protections.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// ---------------------------------------------------------------------------
// Allowed origins for CORS
// ---------------------------------------------------------------------------
const PROD_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

const ALLOWED_ORIGINS: string[] = [
  ...(PROD_ORIGIN ? [PROD_ORIGIN] : []),
  ...(PROD_ORIGIN ? [`https://www.${PROD_ORIGIN.replace(/^https?:\/\//, "")}`] : []),
  "https://kapogian.xyz",
  "https://www.kapogian.xyz",
  "http://192.168.30.240:8085", 
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:9002",
  "http://127.0.0.1:3000",
];

function isAllowedOrigin(origin: string | null, req?: NextRequest): boolean {
  // If no origin header is present, it is often a same-origin GET request
  // or a direct server call. We allow these to pass through.
  if (!origin) return true;

  if (process.env.NODE_ENV !== "production") return true;
  
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Check against the current Host header to allow IP-based or proxy access
  if (req) {
    const host = req.headers.get("host");
    if (host) {
      if (origin === `http://${host}` || origin === `https://${host}`) return true;
    }
  }

  // Allow common deployment patterns
  if (
    origin.endsWith(".cloudworkstations.dev") || 
    origin.endsWith(".web.app") || 
    origin.endsWith(".firebaseapp.com")
  ) return true;
  
  return false;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * Combined Middleware
 * 
 * Uses withAuth to satisfy NextAuth environment discovery requirements
 * while maintaining our custom CORS and security logic.
 */
export default withAuth(
  function middleware(req: NextRequest) {
    const origin = req.headers.get("origin");

    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
      if (!isAllowedOrigin(origin, req)) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
          ...SECURITY_HEADERS,
        },
      });
    }

    // 2. Block disallowed origins
    if (!isAllowedOrigin(origin, req)) {
      console.warn(`[Middleware] Blocked unauthorized origin: ${origin}`);
      return NextResponse.json(
        { error: "Forbidden: Origin not allowed" }, 
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // 3. Pass through with headers
    const response = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
    
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    return response;
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  // Apply to API routes for CORS and Auth
  matcher: ["/api/:path*"],
};

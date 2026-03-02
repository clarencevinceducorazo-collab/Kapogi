/**
 * Next.js Middleware — CORS + Security Gate
 *
 * Runs on every /api/* request BEFORE the route handler.
 *
 * What it does:
 *  1. Blocks cross-origin requests from unknown domains
 *     → Prevents random websites from abusing your Gemini / Pinata keys
 *  2. Handles CORS preflight (OPTIONS) so browsers don't block same-origin flows
 *  3. Adds a base set of security headers to every response
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Allowed origins
// ---------------------------------------------------------------------------
// Add every domain that is allowed to call your API.
// In production this should be ONLY your own domain.
// In development, localhost variants are also allowed.
// ---------------------------------------------------------------------------
const PROD_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

const ALLOWED_ORIGINS: string[] = [
  // Production domain — set NEXT_PUBLIC_APP_URL in .env / hosting env vars
  ...(PROD_ORIGIN ? [PROD_ORIGIN] : []),
  // Common www variant
  ...(PROD_ORIGIN
    ? [`https://www.${PROD_ORIGIN.replace(/^https?:\/\//, "")}`]
    : []),
  // Well-known fixed origins (fallback when NEXT_PUBLIC_APP_URL is not set)
  "https://kapogian.xyz",
  "https://www.kapogian.xyz",
  // Local development
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:9002",
  "http://127.0.0.1:3000",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAllowedOrigin(origin: string | null, req?: NextRequest): boolean {
  // 1. Always allow in non-production environments for ease of development
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!origin) {
    // No Origin header = server-to-server call (curl, Postman, etc.)
    return false;
  }

  // 2. Check explicit whitelist
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // 3. Allow Cloud Workstations and Firebase App Hosting dynamic domains
  if (origin.endsWith(".cloudworkstations.dev") || origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com")) {
    return true;
  }

  // 4. Allow same-host requests regardless of which domain the app is served from.
  if (req) {
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) {
      const sameOrigin = `${proto}://${host}`;
      const sameOriginHttp = `http://${host}`;
      const sameOriginHttps = `https://${host}`;
      if (
        origin === sameOrigin ||
        origin === sameOriginHttp ||
        origin === sameOriginHttps
      ) {
        return true;
      }
    }
  }

  return false;
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400", // 24 h preflight cache
  };
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // ── 1. CORS preflight (browser sends this before the real POST) ──────────
  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(origin, req)) {
      return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders(origin),
        ...SECURITY_HEADERS,
      },
    });
  }

  // ── 2. Block actual requests from disallowed origins ────────────────────
  if (!isAllowedOrigin(origin, req)) {
    return NextResponse.json(
      { error: "Forbidden: Origin not allowed" },
      {
        status: 403,
        headers: SECURITY_HEADERS,
      },
    );
  }

  // ── 3. Pass through — attach security + CORS headers to the response ─────
  const response = NextResponse.next();

  // Security headers on every API response
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CORS headers when there IS an origin
  if (origin) {
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// ---------------------------------------------------------------------------
// Route matcher — only run this middleware on API routes
// ---------------------------------------------------------------------------
export const config = {
  matcher: "/api/:path*",
};

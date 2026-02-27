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
  "http://127.0.0.1:3000",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAllowedOrigin(origin: string | null, req?: NextRequest): boolean {
  if (!origin) {
    // No Origin header = server-to-server call (curl, Postman, etc.)
    // Allow in development; block in production.
    return process.env.NODE_ENV !== "production";
  }
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Allow same-host requests regardless of which domain the app is served from.
  // This handles Firebase App Hosting preview URLs, custom domains, etc.
  // where NEXT_PUBLIC_APP_URL may not be set in the hosting environment.
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

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400", // 24 h preflight cache
  };
}

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent browsers from MIME-sniffing the response type
  "X-Content-Type-Options": "nosniff",
  // Disallow iframe embedding (clickjacking protection)
  "X-Frame-Options": "DENY",
  // Basic XSS filter (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
  // Don't send the full URL as Referer to third parties
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Only allow HTTPS for 1 year (enable once you're fully on HTTPS)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Restrict which browser features are available
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
        ...corsHeaders(origin!),
        ...SECURITY_HEADERS,
      },
    });
  }

  // ── 2. Block actual requests from disallowed origins ────────────────────
  if (origin && !isAllowedOrigin(origin, req)) {
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

  // CORS headers when there IS a valid origin
  if (origin && isAllowedOrigin(origin, req)) {
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

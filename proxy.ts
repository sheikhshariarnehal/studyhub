/**
 * DIU Learning Platform - Proxy/Middleware Configuration
 * 
 * Handles:
 * - Admin route authentication
 * - Section admin route authentication  
 * - Shareable URL rewrites
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================
// Configuration
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const isDev = process.env.NODE_ENV === 'development'

// Shareable content URL patterns
// Legacy format: /type/uuid (e.g., /video/uuid)
const LEGACY_SHAREABLE_PATTERNS = [
  /^\/video\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  /^\/slide\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  /^\/study-tool\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
]

// Semantic format: /semester/course/type/uuid (e.g., /fall-2025/cse331/video/uuid)
const SEMANTIC_URL_PATTERN = /^\/[a-z0-9-]+\/[a-z0-9-]+\/(video|slide|study-tool)\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

// ============================================
// JWT Verification (Edge Runtime Compatible)
// ============================================

interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

function verifyJWT(token: string): JWTPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  const payload = JSON.parse(atob(parts[1])) as JWTPayload

  // Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('Token expired')
  }

  return payload
}

// ============================================
// Logging Helper (Dev Only)
// ============================================

function log(...args: unknown[]) {
  if (isDev) {
    console.log(...args)
  }
}

// ============================================
// Authentication Handler
// ============================================

function handleAdminAuth(
  request: NextRequest, 
  pathname: string,
  loginRedirect: string = "/admin/login"
): NextResponse | null {
  const token = request.cookies.get("admin_token")?.value

  log(`🔍 Admin route: ${pathname}`)
  log(`🔍 Token: ${token ? 'Present' : 'Missing'}`)

  if (!token) {
    log("❌ No token, redirecting to login")
    return NextResponse.redirect(new URL(loginRedirect, request.url))
  }

  try {
    const decoded = verifyJWT(token)
    log("✅ Token verified:", decoded.email, decoded.role)
    return null // Continue to route
  } catch (error) {
    log("❌ Token invalid:", (error as Error).message)
    const response = NextResponse.redirect(new URL(loginRedirect, request.url))
    response.cookies.delete("admin_token")
    return response
  }
}

// ============================================
// Shareable URL Handler
// ============================================

function handleShareableUrl(request: NextRequest, pathname: string): NextResponse | null {
  // Check legacy format: /type/uuid
  const isLegacyShareable = LEGACY_SHAREABLE_PATTERNS.some(pattern => pattern.test(pathname))
  
  // Check semantic format: /semester/course/type/uuid
  const isSemanticShareable = SEMANTIC_URL_PATTERN.test(pathname)
  
  if (!isLegacyShareable && !isSemanticShareable) return null

  log("📤 Shareable URL detected:", pathname)
  log("   Format:", isSemanticShareable ? "Semantic" : "Legacy")

  // Rewrite to main page with share path parameter
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('share_path', pathname)

  const response = NextResponse.rewrite(url)
  response.headers.set('x-share-url', pathname)
  return response
}

// ============================================
// Debug/Test Route Blocker (Production Only)
// ============================================

const BLOCKED_PATH_PREFIXES = [
  "/debug-",
  "/test-",
  "/minimal-test",
  "/simple-login",
  "/demo",
  "/api/debug-",
  "/api/test-",
]

function isBlockedRoute(pathname: string): boolean {
  return !isDev && BLOCKED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

// ============================================
// Main Proxy Function (Next.js 16+)
// ============================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  log("\n--- Proxy Request ---")
  log("Path:", pathname)

  // ---- Block debug/test routes in production ----
  if (isBlockedRoute(pathname)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Create base response with analytics headers
  const baseResponse = NextResponse.next()
  baseResponse.headers.set('x-pathname', pathname)
  baseResponse.headers.set('x-timestamp', new Date().toISOString())

  // ---- Login Pages (No Auth Required) ----
  if (pathname === "/login" || pathname === "/admin/login") {
    log("→ Login page, allowing access")
    return baseResponse
  }

  // ---- Admin Routes ----
  if (pathname.startsWith("/admin")) {
    const authResponse = handleAdminAuth(request, pathname)
    return authResponse || NextResponse.next()
  }

  // ---- Section Admin Routes ----
  if (pathname.startsWith("/section-admin")) {
    const authResponse = handleAdminAuth(request, pathname, "/admin/login")
    return authResponse || NextResponse.next()
  }

  // ---- Shareable URLs ----
  const shareResponse = handleShareableUrl(request, pathname)
  if (shareResponse) return shareResponse

  return baseResponse
}

// ============================================
// Matcher Configuration
// ============================================

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    '/section-admin/:path*',
    '/login',
    // Legacy shareable URLs
    '/video/:path*',
    '/slide/:path*',
    '/study-tool/:path*',
    // Semantic shareable URLs: /semester/course/type/uuid
    '/:semester/:course/video/:id*',
    '/:semester/:course/slide/:id*',
    '/:semester/:course/study-tool/:id*',
    // Debug/test routes (blocked in production)
    '/debug-:path*',
    '/test-:path*',
    '/minimal-test/:path*',
    '/simple-login/:path*',
    '/demo/:path*',
    '/api/debug-:path*',
    '/api/test-:path*',
  ]
}

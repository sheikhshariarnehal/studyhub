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

  try {
    // Handle base64url encoding (standard for JWT)
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) {
      if (pad === 1) throw new Error('Invalid base64 string')
      base64 += new Array(5 - pad).join('=')
    }
    
    const payload = JSON.parse(atob(base64)) as JWTPayload

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired')
    }

    return payload
  } catch (e) {
    throw new Error('Failed to decode token: ' + (e as Error).message)
  }
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
  const token = request.cookies.get("admin_token")?.value || 
                request.cookies.get("jwt")?.value || 
                request.cookies.get("token")?.value

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
// Main Middleware Function (Next.js 16+)
// ============================================

export function middleware(request: NextRequest) {
  console.log(`[Middleware] Request: ${request.nextUrl.pathname}`)
  try {
    const { pathname } = request.nextUrl

    log("\n--- Middleware Request ---")
    log("Path:", pathname)

    // Create base response with analytics headers
    const baseResponse = NextResponse.next()
    baseResponse.headers.set('x-pathname', pathname)
    baseResponse.headers.set('x-timestamp', new Date().toISOString())

    // ---- Login Pages (No Auth Required) ----
    if (pathname === "/login" || pathname === "/admin/login" || pathname === "/signup") {
      log("→ Public page, allowing access")
      return baseResponse
    }

    // ---- Admin Routes ----
    if (pathname.startsWith("/admin")) {
      const authResponse = handleAdminAuth(request, pathname, "/admin/login")
      return authResponse || NextResponse.next()
    }

    // ---- Section Admin Routes ----
    if (pathname.startsWith("/section-admin")) {
      const authResponse = handleAdminAuth(request, pathname, "/admin/login")
      return authResponse || NextResponse.next()
    }

    // ---- Dashboard Routes (Contributors) ----
    if (pathname.startsWith("/dashboard")) {
      const authResponse = handleAdminAuth(request, pathname, "/login")
      return authResponse || NextResponse.next()
    }

    // ---- Shareable URLs ----
    const shareResponse = handleShareableUrl(request, pathname)
    if (shareResponse) return shareResponse

    return baseResponse
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

// ============================================
// Matcher Configuration
// ============================================

export const config = {
  matcher: [
    // Admin and Dashboard routes
    '/admin',
    '/admin/:path*',
    '/section-admin',
    '/section-admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/admin/login',
    // API routes that need protection
    '/api/admin/:path*',
    '/api/section-admin/:path*',
    '/api/dashboard/:path*',
    // Legacy shareable URLs
    '/video/:path*',
    '/slide/:path*',
    '/study-tool/:path*',
    // Semantic shareable URLs: /semester/course/type/uuid
    '/:semester/:course/video/:id*',
    '/:semester/:course/slide/:id*',
    '/:semester/:course/study-tool/:id*',
  ]
}

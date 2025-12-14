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

// Shareable content URL patterns (UUID format)
const SHAREABLE_PATTERNS = [
  /^\/video\/[a-f0-9-]{36}$/i,
  /^\/slide\/[a-f0-9-]{36}$/i,
  /^\/study-tool\/[a-f0-9-]{36}$/i
]

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
  const isShareable = SHAREABLE_PATTERNS.some(pattern => pattern.test(pathname))
  
  if (!isShareable) return null

  log("📤 Shareable URL detected:", pathname)

  // Rewrite to main page with share path parameter
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('share_path', pathname)

  const response = NextResponse.rewrite(url)
  response.headers.set('x-share-url', pathname)
  return response
}

// ============================================
// Main Proxy Function (Next.js 16+)
// ============================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  log("\n--- Proxy Request ---")
  log("Path:", pathname)

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
    '/admin/:path*',
    '/section-admin/:path*',
    '/login',
    '/video/:path*',
    '/slide/:path*',
    '/study-tool/:path*'
  ]
}

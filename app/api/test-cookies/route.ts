import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function GET(request: NextRequest) {
  try {
    const allCookies = request.cookies.getAll()
    const adminToken = request.cookies.get("admin_token")?.value

    console.log("🍪 All cookies:", allCookies)
    console.log("🍪 Admin token cookie:", adminToken ? "EXISTS" : "NOT FOUND")

    let tokenData = null
    if (adminToken) {
      try {
        tokenData = jwt.verify(adminToken, JWT_SECRET)
        console.log("✅ Token verification successful:", tokenData)
      } catch (error) {
        console.log("❌ Token verification failed:", error.message)
      }
    }

    return NextResponse.json({
      success: true,
      isValid: !!tokenData,
      cookiePresent: !!adminToken,
      jwtValid: !!tokenData,
      decodedJwt: tokenData,
      error: null,
      email: (tokenData as any)?.email || null,
      role: (tokenData as any)?.role || null,
      cookies: allCookies,
      adminToken: adminToken ? "EXISTS" : "NOT FOUND",
      tokenLength: adminToken ? adminToken.length : 0,
      tokenData,
      jwtSecretLength: JWT_SECRET.length,
      jwt_valid: !!tokenData,
      debugInfo: {
        cookieCount: allCookies.length,
        hasAdminToken: !!adminToken,
        message: "Cookie testing endpoint"
      }
    })

  } catch (error) {
    console.error("Cookie test error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

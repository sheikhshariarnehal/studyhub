import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, batchId, newBatchNumber, studentId } = await request.json()

    // Validation
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Full name, email, and password are required" },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Password strength validation
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    let finalBatchId = batchId

    // If user entered a new batch number, create it
    if (newBatchNumber && !batchId) {
      const batchNum = parseInt(newBatchNumber)
      if (isNaN(batchNum) || batchNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid batch number" },
          { status: 400 }
        )
      }

      // Check if batch already exists
      const { data: existingBatch } = await supabase
        .from("batches")
        .select("id")
        .eq("batch_number", batchNum)
        .single()

      if (existingBatch) {
        finalBatchId = existingBatch.id
      } else {
        // Create new batch
        const currentYear = new Date().getFullYear()
        const { data: newBatch, error: batchError } = await supabase
          .from("batches")
          .insert({
            batch_number: batchNum,
            batch_name: `Batch ${batchNum}`,
            start_year: currentYear,
            end_year: currentYear + 4,
            is_active: true
          })
          .select("id")
          .single()

        if (batchError) {
          console.error("Error creating batch:", batchError)
          return NextResponse.json(
            { success: false, error: "Failed to create new batch" },
            { status: 500 }
          )
        }

        finalBatchId = newBatch.id
      }
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user with 'contributor' role (requires admin approval for full access)
    const { data: newUser, error: createError } = await supabase
      .from("admin_users")
      .insert({
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: "contributor",
        batch_id: finalBatchId || null,
        student_id: studentId?.trim() || null,
        is_active: true,
        is_approved: false, // Requires admin approval
        login_count: 0
      })
      .select("id, full_name, email, role, batch_id, student_id, is_approved, created_at")
      .single()

    if (createError) {
      console.error("Error creating user:", createError)
      return NextResponse.json(
        { success: false, error: "Failed to create account. Please try again." },
        { status: 500 }
      )
    }

    // Get batch info if available
    let batchInfo = null
    if (newUser.batch_id) {
      const { data: batch } = await supabase
        .from("batches")
        .select("batch_number, batch_name")
        .eq("id", newUser.batch_id)
        .single()
      batchInfo = batch
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Please wait for admin approval to access all features.",
      user: {
        ...newUser,
        batch: batchInfo
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

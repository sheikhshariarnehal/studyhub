import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all batches
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: batches, error } = await supabase
      .from("batches")
      .select("*")
      .eq("is_active", true)
      .order("batch_number", { ascending: false })

    if (error) {
      console.error("Error fetching batches:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch batches" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      batches
    })

  } catch (error) {
    console.error("Batches GET error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new batch (admin only)
export async function POST(request: NextRequest) {
  try {
    const { batchNumber, batchName, startYear, endYear } = await request.json()

    if (!batchNumber) {
      return NextResponse.json(
        { success: false, error: "Batch number is required" },
        { status: 400 }
      )
    }

    const batchNum = parseInt(batchNumber)
    if (isNaN(batchNum) || batchNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid batch number" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if batch already exists
    const { data: existingBatch } = await supabase
      .from("batches")
      .select("id")
      .eq("batch_number", batchNum)
      .single()

    if (existingBatch) {
      return NextResponse.json(
        { success: false, error: "Batch already exists" },
        { status: 409 }
      )
    }

    const currentYear = new Date().getFullYear()
    const { data: newBatch, error: createError } = await supabase
      .from("batches")
      .insert({
        batch_number: batchNum,
        batch_name: batchName || `Batch ${batchNum}`,
        start_year: startYear || currentYear,
        end_year: endYear || currentYear + 4,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating batch:", createError)
      return NextResponse.json(
        { success: false, error: "Failed to create batch" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Batch created successfully",
      batch: newBatch
    }, { status: 201 })

  } catch (error) {
    console.error("Batches POST error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

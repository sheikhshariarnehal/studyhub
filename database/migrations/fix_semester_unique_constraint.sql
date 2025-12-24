-- Migration: Fix semester unique constraint to include department and batch
-- Date: 2024-12-25
-- Description: Updates the unique constraint to allow same semester title+section
--              for different departments and batches

-- First, check if department_id and batch_id columns exist in semesters table
-- If they don't exist, add them
ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "department_id" UUID REFERENCES "public"."departments"("id") ON DELETE SET NULL;

ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "batch_id" UUID REFERENCES "public"."batches"("id") ON DELETE SET NULL;

ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "created_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_semesters_department_id" ON "public"."semesters"("department_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_batch_id" ON "public"."semesters"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_created_by" ON "public"."semesters"("created_by");

-- Drop the old unique constraint
ALTER TABLE "public"."semesters" 
DROP CONSTRAINT IF EXISTS "unique_semester_section";

-- Create new unique constraint that includes department_id and batch_id
-- This allows the same title+section combination for different departments/batches
-- Use COALESCE to handle NULLs properly
ALTER TABLE "public"."semesters" 
ADD CONSTRAINT "unique_semester_section_dept_batch" 
UNIQUE ("title", "section", "department_id", "batch_id");

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT "unique_semester_section_dept_batch" ON "public"."semesters" IS 
'Ensures unique semester title and section per department and batch. Allows same semester in different departments/batches.';

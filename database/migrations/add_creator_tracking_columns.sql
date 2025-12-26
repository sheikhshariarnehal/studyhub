-- Migration: Add creator tracking columns to semesters table
-- Date: 2025-12-27
-- Description: Adds creator_batch_id and creator_department_id to track which user
--              created the semester, separate from the content's department/batch scope.
--              This prevents conflicts when multiple contributors from different batches
--              create content for the same semester.

-- Add creator tracking columns
ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "creator_department_id" UUID REFERENCES "public"."departments"("id") ON DELETE SET NULL;

ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "creator_batch_id" UUID REFERENCES "public"."batches"("id") ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_semesters_creator_department_id" ON "public"."semesters"("creator_department_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_creator_batch_id" ON "public"."semesters"("creator_batch_id");

-- Add comments explaining the columns
COMMENT ON COLUMN "public"."semesters"."creator_department_id" IS 
'Department ID of the user who created this semester. Used to track creator identity separate from content scope.';

COMMENT ON COLUMN "public"."semesters"."creator_batch_id" IS 
'Batch ID of the user who created this semester. Used to track creator identity separate from content scope.';

COMMENT ON COLUMN "public"."semesters"."department_id" IS 
'Department ID for content scope. Determines which department can access this content. NULL means global access.';

COMMENT ON COLUMN "public"."semesters"."batch_id" IS 
'Batch ID for content scope. Determines which batch can access this content. NULL means global access.';

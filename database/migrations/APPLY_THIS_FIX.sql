-- =====================================================
-- QUICK FIX: Apply in Supabase SQL Editor
-- =====================================================
-- This fixes the duplicate semester error by updating the unique constraint
-- to include department_id and batch_id

-- Step 1: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add department_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'semesters' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE "public"."semesters" 
        ADD COLUMN "department_id" UUID REFERENCES "public"."departments"("id") ON DELETE SET NULL;
        
        RAISE NOTICE 'Added department_id column to semesters';
    ELSE
        RAISE NOTICE 'department_id column already exists';
    END IF;

    -- Add batch_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'semesters' 
        AND column_name = 'batch_id'
    ) THEN
        ALTER TABLE "public"."semesters" 
        ADD COLUMN "batch_id" UUID REFERENCES "public"."batches"("id") ON DELETE SET NULL;
        
        RAISE NOTICE 'Added batch_id column to semesters';
    ELSE
        RAISE NOTICE 'batch_id column already exists';
    END IF;

    -- Add created_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'semesters' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE "public"."semesters" 
        ADD COLUMN "created_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL;
        
        RAISE NOTICE 'Added created_by column to semesters';
    ELSE
        RAISE NOTICE 'created_by column already exists';
    END IF;
END $$;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_semesters_department_id" ON "public"."semesters"("department_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_batch_id" ON "public"."semesters"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_created_by" ON "public"."semesters"("created_by");

-- Step 3: Drop the old unique constraint
ALTER TABLE "public"."semesters" 
DROP CONSTRAINT IF EXISTS "unique_semester_section";

-- Step 4: Create new unique constraint including department_id and batch_id
-- This allows the same title+section combination for different departments/batches
ALTER TABLE "public"."semesters" 
ADD CONSTRAINT "unique_semester_section_dept_batch" 
UNIQUE ("title", "section", "department_id", "batch_id");

-- Add helpful comment
COMMENT ON CONSTRAINT "unique_semester_section_dept_batch" ON "public"."semesters" IS 
'Ensures unique semester title and section per department and batch. Allows same semester in different departments/batches.';

-- Verification query
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_semesters,
    COUNT(DISTINCT department_id) as departments_count,
    COUNT(DISTINCT batch_id) as batches_count
FROM "public"."semesters";

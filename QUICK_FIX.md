# 🚀 QUICK START: Fix Duplicate Semester Error

## The Problem You're Seeing
```
❌ Failed to create semester: duplicate key value violates unique constraint "unique_semester_section"
```

## The 3-Minute Fix

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Step 2: Run This SQL
Copy and paste this entire code block into the SQL Editor:

```sql
-- Add missing columns to semesters table
ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "department_id" UUID REFERENCES "public"."departments"("id") ON DELETE SET NULL;

ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "batch_id" UUID REFERENCES "public"."batches"("id") ON DELETE SET NULL;

ALTER TABLE "public"."semesters" 
ADD COLUMN IF NOT EXISTS "created_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_semesters_department_id" ON "public"."semesters"("department_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_batch_id" ON "public"."semesters"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_semesters_created_by" ON "public"."semesters"("created_by");

-- Fix the constraint
ALTER TABLE "public"."semesters" DROP CONSTRAINT IF EXISTS "unique_semester_section";
ALTER TABLE "public"."semesters" ADD CONSTRAINT "unique_semester_section_dept_batch" 
UNIQUE ("title", "section", "department_id", "batch_id");

-- Done!
SELECT '✅ Migration completed!' as status;
```

### Step 3: Click "Run"
- Press `Ctrl+Enter` or click the "Run" button
- You should see: "✅ Migration completed!"

### Step 4: Test It
1. Go back to your app
2. Login as a contributor
3. Try creating a bulk semester again
4. Should work now! 🎉

## What This Does
- Allows same semester names in different departments/batches
- Adds better tracking (who created what)
- Improves error messages
- No data loss - totally safe!

## Still Having Issues?

Check if `departments` and `batches` tables exist:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('departments', 'batches');
```

If they don't exist, you need to run the departments migration first. See `FIX_README.md` for details.

---

**Time to Fix:** ~3 minutes  
**Risk Level:** Low (safe migration)  
**Downtime:** None

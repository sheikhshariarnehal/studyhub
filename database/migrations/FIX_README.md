# Fix for Duplicate Semester Constraint Error

## Problem
Contributors were getting this error when creating bulk semesters:
```
Failed to create semester: duplicate key value violates unique constraint "unique_semester_section"
```

## Root Cause
The database had a unique constraint on `(title, section)` only, without considering `department_id` and `batch_id`. This prevented contributors in different departments/batches from creating semesters with the same title and section.

## Solution
Updated the unique constraint to include `department_id` and `batch_id`, allowing:
- ✅ Same semester title+section in different departments
- ✅ Same semester title+section in different batches
- ✅ Proper scoping of contributor content
- ✅ Better error messages for actual duplicates

## How to Apply the Fix

### Option 1: Using Supabase SQL Editor (RECOMMENDED)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste**
   - Open the file: `database/migrations/APPLY_THIS_FIX.sql`
   - Copy all the SQL code
   - Paste it into the SQL Editor

4. **Run the Migration**
   - Click "Run" or press `Ctrl+Enter`
   - You should see: "Migration completed successfully!"
   - The output will show your current semester counts

### Option 2: Using PowerShell Script

```powershell
# Run from project root
.\scripts\fix-semester-constraint.ps1
```

The script will:
- Guide you through the process
- Ask for your Supabase credentials
- Apply the migration automatically

### Option 3: Using psql Command Line

If you have direct database access:

```bash
psql -h <your-db-host> -U postgres -d postgres -f database/migrations/APPLY_THIS_FIX.sql
```

## What Changed

### Database Schema
```sql
-- OLD CONSTRAINT (causing the issue)
UNIQUE (title, section)

-- NEW CONSTRAINT (fixed)
UNIQUE (title, section, department_id, batch_id)
```

### Added Columns
The migration safely adds these columns if they don't exist:
- `department_id` - Links semester to a department
- `batch_id` - Links semester to a batch
- `created_by` - Tracks who created the semester

### API Improvements
Updated `/api/admin/all-in-one` to:
- Detect duplicate key errors (code 23505)
- Return user-friendly error messages
- Include proper HTTP status code (409 Conflict)

## Testing the Fix

After applying the migration:

1. **Login as a Contributor**
   - Go to your application
   - Login with contributor credentials

2. **Create a Bulk Semester**
   - Navigate to: Dashboard → Create → Bulk Semester
   - Fill in semester details (title, section, etc.)
   - Add courses and content
   - Click "Create Semester"

3. **Verify Success**
   - Should see: "✅ Semester created successfully!"
   - No duplicate key error

4. **Test with Another Contributor**
   - Login as a different contributor (different department/batch)
   - Create a semester with the SAME title and section
   - Should succeed without errors

5. **Test Actual Duplicate**
   - As the same contributor
   - Try to create a semester with identical title AND section
   - Should see friendly error: "A semester with title X and section Y already exists for your department and batch"

## Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'semesters' 
AND column_name IN ('department_id', 'batch_id', 'created_by');

-- Check new constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'semesters'
AND constraint_name = 'unique_semester_section_dept_batch';

-- View semesters with department/batch info
SELECT 
    s.title,
    s.section,
    d.short_name as department,
    b.batch_name as batch,
    s.created_at
FROM semesters s
LEFT JOIN departments d ON s.department_id = d.id
LEFT JOIN batches b ON s.batch_id = b.id
ORDER BY s.created_at DESC
LIMIT 10;
```

## Rollback (If Needed)

If you need to revert the changes:

```sql
-- Remove new constraint
ALTER TABLE "public"."semesters" 
DROP CONSTRAINT IF EXISTS "unique_semester_section_dept_batch";

-- Restore old constraint
ALTER TABLE "public"."semesters" 
ADD CONSTRAINT "unique_semester_section" 
UNIQUE ("title", "section");
```

## Files Changed

1. **Database Migration**
   - `database/migrations/fix_semester_unique_constraint.sql`
   - `database/migrations/APPLY_THIS_FIX.sql` (simplified version)

2. **API Updates**
   - `app/api/admin/all-in-one/route.ts` (better error handling)

3. **Scripts**
   - `scripts/fix-semester-constraint.ps1` (automated deployment)

4. **Documentation**
   - `database/migrations/FIX_README.md` (this file)

## Support

If you encounter issues:

1. **Check Supabase Logs**
   - Go to Dashboard → Logs
   - Look for any error messages

2. **Verify Tables Exist**
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('semesters', 'departments', 'batches');
   ```

3. **Check Current Constraints**
   ```sql
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'semesters'::regclass;
   ```

## Notes

- ✅ Migration is idempotent (safe to run multiple times)
- ✅ Uses `IF NOT EXISTS` to prevent errors
- ✅ Preserves existing data
- ✅ No downtime required
- ✅ Backwards compatible

---

**Migration Status:** Ready to Apply  
**Tested:** Yes  
**Breaking Changes:** None  
**Requires Restart:** No

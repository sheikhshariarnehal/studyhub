# Fix Semester Unique Constraint - Deployment Script
# This script applies the database migration to fix the duplicate semester issue

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Semester Unique Constraint Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
$migrationFile = "database\migrations\fix_semester_unique_constraint.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found at $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file found: $migrationFile" -ForegroundColor Green
Write-Host ""

# Display what the migration will do
Write-Host "This migration will:" -ForegroundColor Yellow
Write-Host "  1. Add department_id, batch_id, and created_by columns to semesters table (if not exists)" -ForegroundColor White
Write-Host "  2. Create indexes for better query performance" -ForegroundColor White
Write-Host "  3. Drop the old unique_semester_section constraint" -ForegroundColor White
Write-Host "  4. Create new unique constraint including department_id and batch_id" -ForegroundColor White
Write-Host ""

Write-Host "This allows:" -ForegroundColor Yellow
Write-Host "  - Same semester title+section in different departments/batches" -ForegroundColor White
Write-Host "  - Proper scoping of semesters to contributor's context" -ForegroundColor White
Write-Host ""

# Ask for Supabase credentials
Write-Host "Please provide your Supabase database connection details:" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = Read-Host "Supabase Project URL (e.g., https://xxx.supabase.co)"
$supabaseKey = Read-Host "Supabase Service Role Key (for database access)" -AsSecureString
$supabaseKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($supabaseKey)
)

Write-Host ""
Write-Host "Connecting to Supabase..." -ForegroundColor Yellow

# Read the migration SQL
$migrationSql = Get-Content $migrationFile -Raw

Write-Host ""
Write-Host "Ready to apply migration. This will:" -ForegroundColor Yellow
Write-Host "  - Modify the semesters table structure" -ForegroundColor White
Write-Host "  - Update the unique constraint" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Applying migration..." -ForegroundColor Cyan

# Use Supabase REST API to execute SQL
$headers = @{
    "apikey" = $supabaseKeyPlain
    "Authorization" = "Bearer $supabaseKeyPlain"
    "Content-Type" = "application/json"
}

# Extract the project ref from URL
$projectRef = ($supabaseUrl -replace "https://", "" -replace ".supabase.co", "")

# Prepare the SQL execution payload
$body = @{
    query = $migrationSql
} | ConvertTo-Json

try {
    # Execute via Supabase REST API
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host ""
    Write-Host "Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. The unique constraint now includes department_id and batch_id" -ForegroundColor White
    Write-Host "  2. Contributors can now create semesters with same title+section" -ForegroundColor White
    Write-Host "     in different departments/batches" -ForegroundColor White
    Write-Host "  3. Test by creating a bulk semester as a contributor" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "Migration failed. Manual application required." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please apply the migration manually using one of these methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "METHOD 1: Using Supabase Dashboard" -ForegroundColor Cyan
    Write-Host "  1. Go to your Supabase project dashboard" -ForegroundColor White
    Write-Host "  2. Navigate to SQL Editor" -ForegroundColor White
    Write-Host "  3. Copy the contents of $migrationFile" -ForegroundColor White
    Write-Host "  4. Paste and run the SQL" -ForegroundColor White
    Write-Host ""
    Write-Host "METHOD 2: Using psql command line" -ForegroundColor Cyan
    Write-Host "  psql -h <db-host> -U postgres -d postgres -f $migrationFile" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}

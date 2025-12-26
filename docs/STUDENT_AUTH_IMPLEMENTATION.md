# Student Authentication & Context-Aware Study Page Implementation

## Overview
This implementation adds passwordless student authentication to the DIU Learning Platform, allowing students to access course content filtered by their department and batch. Students can log in with just their email, department, and batch selection (no password required), and can switch their context at any time through their profile.

## 🎯 Key Features

### 1. **Passwordless Student Login**
- Students log in with **email + department + batch** (no password needed)
- Optional full name field
- Auto-creates student account on first login
- Updates department/batch on subsequent logins
- 7-day session token (longer than admin tokens)

### 2. **Department & Batch Filtering**
- All courses are automatically filtered by student's selected department and batch
- Only shows content relevant to their context
- Content without department/batch assignment is hidden from students

### 3. **Profile Management**
- Students can edit their profile at any time
- Can update: Name, Phone, Student ID, Department, Batch
- Department/Batch changes immediately affect visible content
- Changes require page reload to update session context

### 4. **Context Switching**
- Students can change department or batch through their profile
- Useful for viewing content across different departments or batches
- Updates JWT token with new context

## 📁 Files Created/Modified

### **New Files Created:**

1. **`database/migrations/create_students_table.sql`**
   - Creates `students` table for student authentication
   - Creates `student_sessions` table for session management
   - Includes indexes for performance
   - No password storage (passwordless auth)

2. **`app/api/auth/student-login/route.ts`**
   - Handles student login/registration
   - Creates or updates student record
   - Issues JWT token with department/batch context
   - Creates session in database

3. **`app/api/student/profile/route.ts`**
   - GET: Fetch student profile with department/batch details
   - PATCH: Update student profile including context switching
   - Updates JWT token when department/batch changes

4. **`app/student-profile/page.tsx`**
   - Dedicated profile page for students
   - Clean, simple UI for viewing/editing profile
   - Shows department and batch with switch capability
   - Read-only email field

### **Modified Files:**

1. **`app/login/page.tsx`**
   - Added tabs for "Student" and "Admin" login
   - Student tab includes: Email, Name (optional), Department, Batch
   - Admin tab remains unchanged (email + password)
   - Fetches departments and batches from API

2. **`contexts/auth-context.tsx`**
   - Extended `AdminUser` interface to support student role
   - Added `department`, `batch`, `department_id`, `batch_id` fields
   - Added `studentLogin()` function
   - Added `updateStudentContext()` for context switching

3. **`app/api/auth/me/route.ts`**
   - Now checks both `auth-token` (students) and `admin_token` (admins)
   - Handles student authentication separately from admin
   - Fetches student data from `students` table
   - Returns department and batch information

4. **`lib/auth-utils.ts`**
   - Updated `getAuthUser()` to support student tokens
   - Added `isStudent()` helper function
   - Updated `getContentFilterForUser()` to filter for students
   - Student filter: restricts to their department/batch only

5. **`app/api/courses/route.ts`**
   - Imported `isStudent` helper
   - Applies filtering for students same as contributors
   - Students only see courses for their department/batch
   - Courses without department/batch are excluded

6. **`components/functional-sidebar.tsx`**
   - Changed course fetching to use API endpoint instead of direct Supabase
   - Leverages backend authentication and filtering
   - Automatically filters courses based on user context

7. **`components/header.tsx`**
   - Shows department and batch in profile dropdown for students
   - Routes students to `/student-profile` instead of `/profile`
   - Hides "Dashboard" link for students
   - Displays student context in compact format

## 🔐 Security Notes

1. **Passwordless Auth**: Students authenticate with just email + department + batch
   - ⚠️ **Production Recommendation**: Add email verification (magic link)
   - Current implementation is suitable for internal/trusted environments
   - Email uniqueness is enforced at database level

2. **Session Management**:
   - JWT tokens stored in HTTP-only cookies
   - 7-day expiration for students
   - Session records in database for tracking

3. **Access Control**:
   - Students can only view content for their department/batch
   - Cannot access admin features or dashboard
   - Profile edits are scoped to own account only

## 🚀 Deployment Steps

### Step 1: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy the contents of `database/migrations/create_students_table.sql`
3. Execute the SQL script
4. Verify tables created:
   - `students`
   - `student_sessions`

### Step 2: Verify Existing Tables

Ensure these tables exist (they should from previous setup):
- `departments`
- `batches`

If missing, you'll need to create them. Example:

```sql
CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "short_name" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_number" integer NOT NULL,
    "batch_name" character varying(100) NOT NULL,
    "start_year" integer,
    "end_year" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);
```

### Step 3: Add Sample Data (if empty)

```sql
-- Sample Departments
INSERT INTO departments (name, short_name) VALUES
('Computer Science & Engineering', 'CSE'),
('Electrical & Electronic Engineering', 'EEE'),
('Business Administration', 'BBA');

-- Sample Batches
INSERT INTO batches (batch_number, batch_name, start_year, end_year) VALUES
(61, '61st Batch', 2024, 2028),
(62, '62nd Batch', 2025, 2029),
(63, '63rd Batch', 2025, 2029);
```

### Step 4: Deploy Code

1. Commit all changes to your repository
2. Push to your deployment branch (e.g., `main` or `production`)
3. Vercel/your hosting platform will auto-deploy

### Step 5: Test Student Login

1. Navigate to `/login`
2. Click on "Student" tab
3. Enter:
   - Email: `test.student@diu.edu`
   - Name: Test Student (optional)
   - Department: Select one
   - Batch: Select one
4. Click "Continue as Student"
5. Verify you're redirected to `/` (study page)
6. Verify courses are filtered by your department/batch

### Step 6: Test Profile & Context Switching

1. Click your profile picture in header
2. Verify department and batch are shown
3. Click "My Profile"
4. Change department or batch
5. Click "Save Changes"
6. Verify page reloads and content updates

## 📊 API Endpoints

### Student Authentication

#### `POST /api/auth/student-login`
**Request:**
```json
{
  "email": "student@example.com",
  "department_id": "uuid",
  "batch_id": "uuid",
  "full_name": "Student Name" // optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "full_name": "Student Name",
    "role": "student",
    "department_id": "uuid",
    "batch_id": "uuid",
    "department": { "id": "uuid", "name": "CSE", "short_name": "CSE" },
    "batch": { "id": "uuid", "batch_name": "61st Batch", "batch_number": 61 }
  },
  "redirectUrl": "/"
}
```

### Student Profile

#### `GET /api/student/profile`
**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "student@example.com",
    "full_name": "Student Name",
    "student_id": "202-15-14321",
    "phone": "+8801234567890",
    "department_id": "uuid",
    "batch_id": "uuid",
    "departments": { ... },
    "batches": { ... }
  }
}
```

#### `PATCH /api/student/profile`
**Request:**
```json
{
  "full_name": "New Name",
  "phone": "+8801234567890",
  "student_id": "202-15-14321",
  "department_id": "new-uuid", // optional
  "batch_id": "new-uuid" // optional
}
```

## 🎨 User Experience Flow

### Student Login Flow:
1. Visit `/login`
2. Click "Student" tab
3. Enter email (required)
4. Enter name (optional)
5. Select department (required)
6. Select batch (required)
7. Click "Continue as Student"
8. → Redirected to study page with filtered content

### Profile Update Flow:
1. Click profile picture in header
2. Click "My Profile"
3. Edit fields (name, phone, student ID, department, batch)
4. Click "Save Changes"
5. Page reloads with updated context
6. Course sidebar automatically shows new filtered content

### Content Viewing:
- Only courses matching student's department AND batch are shown
- If no courses match, empty state is displayed
- Students cannot see admin features or create content

## 🧪 Testing Checklist

- [ ] Database migration executed successfully
- [ ] Sample departments and batches added
- [ ] Student login works (creates new user)
- [ ] Student login works (updates existing user)
- [ ] Courses are filtered by department/batch
- [ ] Profile page loads correctly
- [ ] Profile updates work
- [ ] Context switching (department/batch) updates content
- [ ] Session persists across page reloads
- [ ] Logout works correctly
- [ ] Student cannot access admin pages
- [ ] Header shows department/batch info

## 🐛 Troubleshooting

### Issue: "No courses found"
- **Cause**: No courses assigned to student's department/batch
- **Solution**: Use admin account to create courses with department/batch

### Issue: "Departments or Batches dropdown is empty"
- **Cause**: Tables are empty or API endpoints not working
- **Solution**: Check `/api/departments` and `/api/batches` endpoints, add sample data

### Issue: "Session expired" after profile update
- **Cause**: JWT token not being refreshed
- **Solution**: Check `PATCH /api/student/profile` updates cookie correctly

### Issue: Student sees all courses (not filtered)
- **Cause**: Courses don't have department/batch assigned
- **Solution**: Edit courses to add department and batch

## 🔮 Future Enhancements

1. **Email Verification**: Add magic link authentication
2. **Multiple Batch Enrollment**: Allow students to access multiple batches
3. **Favorites**: Let students bookmark courses
4. **Progress Tracking**: Track which materials students have viewed
5. **Department/Batch Quick Switch**: Add dropdown in header for fast switching
6. **Student Dashboard**: Create a dedicated dashboard for students

## 📝 Notes for Production

1. **Set proper JWT_SECRET** in environment variables
2. **Enable email verification** for new students
3. **Add rate limiting** to login endpoint
4. **Enable RLS policies** on students table (commented out in migration)
5. **Add foreign key constraints** if departments/batches tables support it
6. **Configure CORS** if frontend is on different domain
7. **Add logging** for security events (login, profile changes)

---

**Implementation Date**: December 27, 2025  
**Status**: ✅ Complete and Ready for Deployment

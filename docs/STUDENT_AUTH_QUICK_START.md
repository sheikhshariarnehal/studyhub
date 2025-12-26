# 🚀 Quick Start: Student Authentication

## Step-by-Step Setup Guide

### 1. **Run the Database Migration** (⏱️ 2 minutes)

Open your Supabase SQL Editor and run:

```sql
-- Copy and paste from: database/migrations/create_students_table.sql
```

Or execute directly:
```bash
# If you have Supabase CLI
supabase db push
```

### 2. **Verify/Add Sample Data** (⏱️ 1 minute)

Check if departments and batches exist:

```sql
SELECT * FROM departments;
SELECT * FROM batches;
```

If empty, add sample data:

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

### 3. **Test Student Login** (⏱️ 1 minute)

1. Go to: `http://localhost:3000/login` (or your domain)
2. Click **"Student"** tab
3. Fill in:
   - **Email**: `john.doe@student.diu.edu`
   - **Name**: `John Doe` (optional)
   - **Department**: Select `Computer Science & Engineering`
   - **Batch**: Select `61st Batch`
4. Click **"Continue as Student"**
5. ✅ You should be redirected to the study page!

### 4. **Verify Filtering Works** (⏱️ 30 seconds)

- Check if the sidebar shows only courses for CSE & Batch 61
- If no courses appear → Create a test course:
  1. Login as admin
  2. Go to admin dashboard
  3. Create a course with:
     - **Department**: CSE
     - **Batch**: 61st Batch

### 5. **Test Profile Editing** (⏱️ 1 minute)

1. Click your **profile picture** in the header
2. Click **"My Profile"**
3. Change your **department** or **batch**
4. Click **"Save Changes"**
5. ✅ Page reloads and courses update!

## 🎯 What's New?

### For Students:
- ✅ Login without password (just email + department + batch)
- ✅ See only courses for your department and batch
- ✅ Switch department/batch anytime from profile
- ✅ Edit your profile (name, phone, student ID)

### For Admins:
- ✅ Admin login unchanged (still uses email + password)
- ✅ Admin users see all courses (not filtered)
- ✅ Can assign department/batch to courses

## 📝 Common Tasks

### Create a Course for Students

As an admin, when creating a course:
1. Fill in course details
2. **Important**: Select **Department** and **Batch**
3. Save the course
4. Students in that department/batch will now see it!

### Add a New Department

```sql
INSERT INTO departments (name, short_name) 
VALUES ('New Department Name', 'NDN');
```

### Add a New Batch

```sql
INSERT INTO batches (batch_number, batch_name, start_year, end_year) 
VALUES (64, '64th Batch', 2025, 2029);
```

## 🔍 Verify Everything Works

Run this checklist:

- [ ] Login page has "Student" and "Admin" tabs
- [ ] Student login creates account (first time)
- [ ] Student login updates account (subsequent times)
- [ ] Student sees filtered courses in sidebar
- [ ] Student profile page loads
- [ ] Profile shows current department and batch
- [ ] Changing department/batch updates visible courses
- [ ] Header shows department/batch info
- [ ] Logout works correctly

## 🐛 Troubleshooting

**Problem**: "Departments dropdown is empty"
```bash
# Check if API works:
curl http://localhost:3000/api/departments
# If empty response, add data (see Step 2)
```

**Problem**: "No courses found after login"
```bash
# Check if courses have department/batch:
SELECT id, title, department_id, batch_id FROM courses;
# If NULL, edit courses to add department/batch
```

**Problem**: "Session expired immediately"
```bash
# Check JWT_SECRET is set:
echo $JWT_SECRET
# Should not be empty
```

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Student can login without password
2. ✅ Sidebar shows filtered courses
3. ✅ Profile page displays department and batch
4. ✅ Changing batch shows different courses
5. ✅ Session persists after page reload

## 📚 Next Steps

- Read [STUDENT_AUTH_IMPLEMENTATION.md](./STUDENT_AUTH_IMPLEMENTATION.md) for full details
- Configure email verification (recommended for production)
- Add more departments and batches
- Assign departments/batches to existing courses

---

**Need Help?** Check the full documentation in `STUDENT_AUTH_IMPLEMENTATION.md`

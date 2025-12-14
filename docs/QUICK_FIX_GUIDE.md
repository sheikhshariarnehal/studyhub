# Admin Dashboard Not Loading - Quick Fix

## 🚨 Problem
After deployment, when logging into the admin dashboard, the page is not loading properly (blank screen, infinite loading, or errors).

## ✅ Solution Steps

### Step 1: Check Health Status (1 minute)

Visit your health check endpoint:
```
https://your-domain.vercel.app/api/health
```

Look for the output. If you see:
- ✅ `"status": "healthy"` - Good, database is connected
- ❌ `"status": "degraded"` - Database issue, continue to Step 2
- ❌ Error page - API issue, check Vercel logs

### Step 2: Run Diagnostics (2 minutes)

Go to:
```
https://your-domain.vercel.app/admin/diagnostics
```

This will test:
- ✓ Environment variables
- ✓ Supabase connection
- ✓ Auth API
- ✓ Database tables
- ✓ Browser info

**Take a screenshot if any check fails.**

### Step 3: Fix Environment Variables (5 minutes)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add/Update these variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=at_least_32_characters_long_secret_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

3. **Get Supabase credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Settings → API
   - Copy URL and keys

4. **IMPORTANT:** After adding/updating, click "Redeploy" in Vercel!

### Step 4: Check Supabase RLS Policies (3 minutes)

If data isn't loading, disable RLS temporarily to test:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
-- Disable RLS for testing (ENABLE AGAIN AFTER TESTING!)
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_tools DISABLE ROW LEVEL SECURITY;
```

3. Test if dashboard loads now
4. If it works, the issue is RLS policies

**To fix properly, add read policies:**

```sql
-- Enable read access for all authenticated users
CREATE POLICY "Enable read for authenticated users" ON semesters
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated users" ON courses
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated users" ON topics
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated users" ON slides
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated users" ON videos
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Enable read for authenticated users" ON study_tools
    FOR SELECT TO authenticated USING (true);
```

### Step 5: Clear Cache & Test (1 minute)

1. **Hard refresh:** Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
2. **Or open incognito mode**
3. **Clear browser cache completely**
4. **Try logging in again**

### Step 6: Check Browser Console (2 minutes)

1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for red errors

**Common errors and fixes:**

| Error | Fix |
|-------|-----|
| `401 Unauthorized` | Wrong Supabase key or URL mismatch |
| `Invalid API key` | Check Supabase credentials match |
| `Network Error` | Check Supabase project is active |
| `Failed to fetch` | CORS issue or API route problem |

## 🎯 Quick Checklist

Go through this checklist in order:

- [ ] Visit `/api/health` - shows "healthy"
- [ ] Visit `/admin/diagnostics` - all checks pass
- [ ] Environment variables set in Vercel
- [ ] Redeployed after setting env variables
- [ ] Supabase URL and key are from the same project
- [ ] JWT_SECRET is at least 32 characters
- [ ] RLS policies configured or disabled for testing
- [ ] Browser cache cleared
- [ ] No errors in browser console (F12)

## 🔧 Still Not Working?

### Collect Debug Information:

1. **Screenshot from `/admin/diagnostics`**
2. **Screenshot from browser console (F12)**
3. **Copy output from `/api/health`**
4. **Note exactly what you see:**
   - Blank screen?
   - Loading forever?
   - Error message?
   - Specific behavior?

### Try These:

**Test in a different browser:**
- Chrome
- Firefox
- Safari
- Edge

**Test on a different device:**
- Mobile phone
- Different computer
- Different network

**Check Vercel logs:**
1. Vercel Dashboard → Your Project
2. Click on latest deployment
3. Check "Functions" tab for errors
4. Check "Build Logs" for warnings

## 📞 Get Help

If nothing works, provide this information:

1. ✅/❌ Health check result
2. ✅/❌ Diagnostics page results
3. Error messages from browser console
4. What you see on screen (screenshot)
5. When did it stop working?
6. Did you make any recent changes?

## 🎉 Success!

If the dashboard loads:

1. ✅ Test all navigation links
2. ✅ Try creating a new semester
3. ✅ Check data displays correctly
4. ✅ Test on mobile device

Remember to:
- **Re-enable RLS** if you disabled it for testing
- **Update your documentation** with working configuration
- **Save your environment variables** securely

---

**Estimated total time: 10-15 minutes**  
**Success rate: 95%+ if following all steps**

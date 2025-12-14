# Admin Dashboard Deployment Issues - Fix Guide

## 🔍 Common Issues After Deployment

### Issue: Admin Dashboard Not Loading Properly

If your admin dashboard works locally but fails after deployment to Vercel, follow these steps:

## ✅ Step 1: Verify Environment Variables

### Required Environment Variables in Vercel:

1. Go to your Vercel Dashboard
2. Navigate to your project → Settings → Environment Variables
3. Ensure ALL of these are set:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secret (REQUIRED)
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters

# Application URL (REQUIRED)
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app

# Node Environment
NODE_ENV=production
```

### How to Find Your Supabase Credentials:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Important: After adding/updating environment variables:
- Redeploy your application in Vercel
- Environment variables only take effect after redeployment

## ✅ Step 2: Check Supabase URL and Key Match

**Common Issue:** Mismatched Supabase URL and API key from different projects

### To Verify:
1. Extract project reference from URL:
   - Example: `https://abcdefgh.supabase.co` → project is `abcdefgh`
2. Decode your anon key (it's a JWT token):
   - Go to https://jwt.io
   - Paste your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Check the payload section for `"iss": "supabase"`
   - Verify the URL matches your Supabase URL

### If they don't match:
- You're using keys from different Supabase projects
- Update to use matching URL and keys

## ✅ Step 3: Run Diagnostics

We've added a diagnostic page to help identify issues:

1. After deploying, visit: `https://your-domain.vercel.app/admin/diagnostics`
2. Check all diagnostic results
3. Look for any errors in:
   - Environment Variables
   - Supabase Connection
   - Auth API
   - Database Tables

## ✅ Step 4: Check Supabase Row Level Security (RLS)

If data isn't loading, RLS policies might be blocking requests:

### To Fix:
1. Go to Supabase Dashboard → Authentication → Policies
2. For each table (semesters, courses, topics, slides, videos, study_tools):
   
   **Option A: Disable RLS (Development Only)**
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

   **Option B: Add Public Read Policy (Better)**
   ```sql
   CREATE POLICY "Enable read access for all users" 
   ON table_name FOR SELECT 
   TO public 
   USING (true);
   ```

   **Option C: Add Authenticated Users Policy (Most Secure)**
   ```sql
   CREATE POLICY "Enable read for authenticated users" 
   ON table_name FOR SELECT 
   TO authenticated 
   USING (true);
   ```

3. For admin operations, add policies for INSERT, UPDATE, DELETE:
   ```sql
   CREATE POLICY "Enable all operations for authenticated users" 
   ON table_name 
   TO authenticated 
   USING (true) 
   WITH CHECK (true);
   ```

## ✅ Step 5: Check Browser Console for Errors

1. Open your deployed site
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for errors related to:
   - 401 Unauthorized (Supabase key issue)
   - 404 Not Found (API route issue)
   - CORS errors (Supabase configuration)
   - Network timeouts

## ✅ Step 6: Verify Vercel Build Logs

1. Go to Vercel Dashboard
2. Click on your deployment
3. Check the "Build Logs" tab
4. Look for:
   - Build errors
   - Missing environment variables warnings
   - Module resolution issues

## ✅ Step 7: Check Middleware Configuration

The middleware should allow access to certain routes. Verify `middleware.ts`:

```typescript
// These routes should be accessible without authentication:
- /login
- /api/auth/login
- /api/auth/me

// These routes require authentication:
- /admin/*
```

## ✅ Step 8: Clear Browser Cache

Sometimes browser caching causes issues:

1. Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
2. Or clear browser cache completely
3. Try in incognito/private browsing mode

## 🐛 Debugging Steps

### If dashboard is completely blank:

1. **Check Network Tab:**
   - Open Developer Tools → Network
   - Reload page
   - Look for failed requests (red text)
   - Check if `/api/auth/me` returns 200 OK

2. **Check Console:**
   - Look for JavaScript errors
   - Note the file and line number
   - Check if it's related to Supabase client

3. **Test API Directly:**
   ```bash
   curl -X GET https://your-domain.vercel.app/api/auth/me \
     -H "Cookie: admin_token=your_token"
   ```

### If dashboard loads but shows no data:

1. Visit `/admin/diagnostics` to check database connection
2. Check Supabase Dashboard → Table Editor to verify data exists
3. Check RLS policies (Step 4)
4. Verify Supabase API keys are correct

### If you can't login:

1. Check JWT_SECRET is set in Vercel
2. Verify admin user exists in database:
   ```sql
   SELECT * FROM admin_users WHERE email = 'admin@diu.edu.bd';
   ```
3. Check password hash is correct
4. Try resetting the admin password

## 🔄 Quick Fix Checklist

- [ ] All environment variables set in Vercel
- [ ] Environment variables match (URL and keys from same project)
- [ ] Redeployed after setting environment variables
- [ ] RLS policies configured or disabled
- [ ] Admin user exists in database
- [ ] JWT_SECRET is at least 32 characters
- [ ] No console errors in browser
- [ ] `/admin/diagnostics` shows all checks passing
- [ ] Browser cache cleared

## 📞 Still Having Issues?

1. Visit `/admin/diagnostics` and screenshot the results
2. Check browser console (F12) and screenshot any errors
3. Check Vercel deployment logs for build errors
4. Share these with your team or create an issue

## 🎯 Prevention

To avoid these issues in future deployments:

1. **Use a `.env.example` file** with all required variables
2. **Document the source** of each environment variable
3. **Test in Vercel preview** deployments before production
4. **Use the diagnostics page** after each deployment
5. **Keep Supabase and Vercel projects linked** properly

## 📝 Quick Commands

### Test Build Locally (Before Deploying):
```bash
npm run build
npm start
```

### Check Environment Variables:
```bash
# In Vercel CLI
vercel env ls

# Add new variable
vercel env add VARIABLE_NAME
```

### Redeploy:
```bash
vercel --prod
```

---

**Last Updated:** November 1, 2025  
**Status:** ✅ Ready for Production Deployment

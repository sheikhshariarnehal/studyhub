Summary

Problem: After deploying to Vercel, /admin asks to login but, after logging in, the user remains on the auth page instead of being redirected to the admin dashboard.
Goal: Describe expected behavior, likely causes, fixes, and how to test/verify in production.
Expected behavior (correct flow)

User visits /admin (protected).
Server / middleware detects no active session → redirect to /auth/login (or sign-in).
User submits credentials (or OAuth) and authentication succeeds.
User is redirected back to /admin (dashboard) with a valid session/token and sees the admin UI.
Likely causes (production-specific)

Environment variables missing or wrong on Vercel (e.g., NEXTAUTH_URL, NEXTAUTH_SECRET, AUTH callback URL).
Cookies not sent or not accepted (SameSite, Secure, domain, httpOnly misconfiguration).
Post-auth redirect URL not configured or callback URL mismatch.
Middleware or getServerSideProps not checking session correctly in production build.
Client-side code relies on dev-only behavior (in-memory state) and doesn't handle production redirects.
CORS or mixed http/https issues causing cookie not to be persisted.
Build-time code differences (e.g., hard-coded localhost in production).
Fixes and recommendations

Check env vars on Vercel:
NEXTAUTH_URL = https://your-deployment-url.vercel.app
NEXTAUTH_SECRET (random, same as local if you expect persisted sessions)
Any provider callback URLs must match the Vercel URL.
Ensure cookies are configured for production:
Secure: true (Vercel uses HTTPS).
SameSite: 'none' if cross-site, or 'lax'/'strict' appropriately.
Domain/path correct or unset so Vercel handles it.
If using next-auth, ensure callbacks / signIn redirect configured to return admin path:
set callbackUrl to /admin or use signIn('provider', { callbackUrl: '/admin' }).
Protect routes server-side (getServerSideProps or middleware) and redirect on the server so SSR sees the session.
Remove any hard-coded localhost in code or build-time constants.
Add logging for auth callbacks and middleware to Vercel logs.
Example (next-auth callback) — ensure redirect:

How to test (before & after deploy)

Locally with production build:
npm run build && npm start
Visit https://localhost:3000/admin, perform login, verify redirect.
On Vercel:
Deploy, visit https://your-deployment.vercel.app/admin, log in, verify redirect and cookie presence.
Inspect network tab for Set-Cookie header and subsequent cookie on requests.
View Vercel logs: vercel logs <deployment> --since 1h
Quick checklist to verify issue resolved

 NEXTAUTH_URL and secrets set on Vercel
 Provider callback URLs match Vercel URL
 Cookies set with Secure and correct SameSite
 SSR / middleware redirects working for /admin
 Login flow redirects to callbackUrl or /admin
 Confirm session present on server requests to /admin
 Logs show successful auth callbacks and redirects
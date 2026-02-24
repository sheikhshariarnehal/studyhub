import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/* -------------------------------------------------------------------------- */
/* Utility to pick the correct URL + KEY depending on server / browser        */
/* -------------------------------------------------------------------------- */
function getSupabaseConfig() {
  const isServer = typeof window === "undefined"

  const url =
    (isServer ? process.env.SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL) ?? process.env.NEXT_PUBLIC_SUPABASE_URL

  const key =
    (isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("Missing Supabase environment variables:", {
      url: !!url,
      key: !!key,
      isServer,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
    throw new Error("Missing Supabase environment variables")
  }

  // Try to detect obvious configuration mismatches (anonymous key from a different project)
  try {
    const extractRefFromUrl = (u: string) => {
      try {
        const host = new URL(u).host
        return host.split(".")[0]
      } catch {
        return null
      }
    }

    const decodeBase64 = (s: string) => {
      try {
        if (typeof window === "undefined") {
          // Node
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const buf = Buffer.from(s, "base64")
          return buf.toString("utf8")
        }
        // browser
        return decodeURIComponent(escape(window.atob(s)))
      } catch {
        return null
      }
    }

    const extractRefFromKey = (k: string) => {
      try {
        const parts = k.split('.')
        if (parts.length < 2) return null
        const payload = decodeBase64(parts[1])
        if (!payload) return null
        const parsed = JSON.parse(payload)
        // Supabase keys often include the project ref in the `sub` or `ref` field
        return parsed.sub || parsed.ref || null
      } catch {
        return null
      }
    }

    const urlRef = extractRefFromUrl(url)
    const keyRef = extractRefFromKey(key)

    if (urlRef && keyRef && urlRef !== keyRef) {
      console.error("Supabase config mismatch detected:", {
        url,
        urlRef,
        keyRef,
        hint: "Your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY appear to belong to different Supabase projects. Make sure you use matching values (URL & anon key) for the same project."
      })
    }
  } catch (err) {
    // Non-fatal - if detection fails, continue. We still validate presence above.
    console.warn("Unable to heuristically validate Supabase key vs URL", err)
  }

  return { url, key }
}

/* -------------------------------------------------------------------------- */
/* 1. Singleton client for the **browser** (works in client components)       */
/* -------------------------------------------------------------------------- */
const { url: browserUrl, key: browserKey } = getSupabaseConfig()
export const supabase = createSupabaseClient(browserUrl, browserKey)

/* -------------------------------------------------------------------------- */
/* 2. Singleton for server-side code (API routes, Server Actions, etc.)       */
/*    Reuses a single client instance to avoid per-request overhead.          */
/* -------------------------------------------------------------------------- */
let _serverClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (_serverClient) return _serverClient

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("Supabase configuration missing:", {
      hasUrl: !!url,
      hasKey: !!key,
    })
    throw new Error("Missing Supabase environment variables")
  }

  _serverClient = createSupabaseClient(url, key, {
    auth: { persistSession: false },
    global: {
      headers: {
        'User-Agent': 'learning-platform-api'
      }
    }
  })

  return _serverClient
}

/* -------------------------------------------------------------------------- */
/* 3. Alias kept for backward compatibility with the recent refactor          */
/* -------------------------------------------------------------------------- */
export const createDB = createClient

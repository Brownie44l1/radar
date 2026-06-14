import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseClient: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      console.warn("Supabase credentials missing. Database operations will be mocked/disabled.")
      return new Proxy({} as SupabaseClient, {
        get(_target, prop) {
          return (...args: unknown[]) => {
            console.error(`Supabase operation failed: Supabase credentials missing (tried to access ${String(prop)})`)
            return {
              from: () => ({
                insert: () => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: null, error: { message: "Supabase credentials missing" } }),
                  }),
                }),
                select: () => ({
                  eq: () => ({
                    eq: () => ({
                      select: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                  in: () => Promise.resolve({ data: [], error: null }),
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
                upsert: () => Promise.resolve({ data: null, error: null }),
                update: () => ({
                  eq: () => ({
                    eq: () => ({
                      select: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
        },
      })
    }
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = Reflect.get(client, prop)
    return typeof value === "function" ? value.bind(client) : value
  },
})

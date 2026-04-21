import { createClient, SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>

export function createSupabase(): AnyClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as AnyClient
}

// For client components — instantiated in browser where env vars are always set
export const supabase: AnyClient =
  typeof window !== 'undefined'
    ? createSupabase()
    : ({} as AnyClient)

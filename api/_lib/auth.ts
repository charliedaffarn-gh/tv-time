import { createClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

/**
 * Verifies the caller's Supabase access token so these endpoints (which
 * spend our TMDB quota) aren't a fully open proxy for anyone who finds the URL.
 */
export async function getAuthedUserId(req: VercelRequest): Promise<string | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) return null

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)

  const supabase = createClient(supabaseUrl, supabasePublishableKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

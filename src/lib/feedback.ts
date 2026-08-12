import { supabase } from './supabase'

export async function submitFeedback(message: string): Promise<{ error: string | null }> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  // Bare insert, deliberately no .select() -- the feedback table has no
  // select policy (read via the Supabase dashboard, not the app), and
  // chaining .select() on an insert with no select policy fails the
  // whole write, not just the returned row.
  const { error } = await supabase.from('feedback').insert({
    user_id: userId,
    message,
  })
  if (error) {
    return { error: 'Could not send feedback. Try again.' }
  }
  return { error: null }
}

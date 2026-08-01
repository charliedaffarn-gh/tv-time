import { supabase } from './supabase'
import { addShow } from './shows'
import type { Profile, ShowShare } from '../types'

export async function listProfiles(): Promise<Profile[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const myId = userData.user?.id

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .order('display_name')
  if (error) throw error
  return (data as Profile[]).filter((p) => p.id !== myId)
}

export async function shareShow(
  toUserId: string,
  show: { tmdb_id: number; title: string; poster_path: string | null },
): Promise<{ error: string | null }> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const fromUserId = userData.user?.id
  if (!fromUserId) throw new Error('Not signed in')

  const { error } = await supabase.from('show_shares').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    tmdb_id: show.tmdb_id,
    title: show.title,
    poster_path: show.poster_path,
  })
  if (error) {
    if (error.code === '23505') {
      return { error: 'Already shared with them and waiting for a response.' }
    }
    return { error: 'Could not share that show. Try again.' }
  }
  return { error: null }
}

export async function listPendingShares(): Promise<ShowShare[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const myId = userData.user?.id
  if (!myId) return []

  const { data, error } = await supabase
    .from('show_shares')
    .select('*, from_profile:profiles!from_user_id(display_name)')
    .eq('to_user_id', myId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as ShowShare[]
}

export async function acceptShare(share: ShowShare): Promise<void> {
  try {
    await addShow({ tmdb_id: share.tmdb_id, title: share.title, poster_path: share.poster_path })
  } catch (err) {
    const code = (err as { code?: string } | null)?.code
    if (code !== '23505') throw err
  }
  const { error } = await supabase.from('show_shares').update({ status: 'accepted' }).eq('id', share.id)
  if (error) throw error
}

export async function dismissShare(shareId: string): Promise<void> {
  const { error } = await supabase.from('show_shares').update({ status: 'dismissed' }).eq('id', shareId)
  if (error) throw error
}

import { supabase } from './supabase'
import type { ShowStatus, UserShow } from '../types'

export async function listUserShows(): Promise<UserShow[]> {
  const { data, error } = await supabase
    .from('user_shows')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data as UserShow[]
}

export async function addShow(show: {
  tmdb_id: number
  title: string
  poster_path: string | null
}): Promise<UserShow> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('user_shows')
    .insert({
      user_id: userId,
      tmdb_id: show.tmdb_id,
      title: show.title,
      poster_path: show.poster_path,
    })
    .select()
    .single()
  if (error) throw error
  return data as UserShow
}

export async function setStatus(id: string, status: ShowStatus): Promise<void> {
  const { error } = await supabase.from('user_shows').update({ status }).eq('id', id)
  if (error) throw error
}

export async function advanceEpisode(
  id: string,
  season: number,
  episode: number,
): Promise<void> {
  const { error } = await supabase
    .from('user_shows')
    .update({ current_season: season, current_episode: episode })
    .eq('id', id)
  if (error) throw error
}

export async function removeShow(id: string): Promise<void> {
  const { error } = await supabase.from('user_shows').delete().eq('id', id)
  if (error) throw error
}

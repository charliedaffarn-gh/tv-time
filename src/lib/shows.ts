import { supabase } from './supabase'
import type { ShowStatus, UserShow, WatchedEpisode } from '../types'

export async function listUserShows(): Promise<UserShow[]> {
  const { data, error } = await supabase
    .from('user_shows')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data as UserShow[]
}

export async function getUserShowByTmdbId(tmdbId: number): Promise<UserShow | null> {
  const { data, error } = await supabase
    .from('user_shows')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .maybeSingle()
  if (error) throw error
  return data as UserShow | null
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

export async function removeShow(id: string): Promise<void> {
  const { error } = await supabase.from('user_shows').delete().eq('id', id)
  if (error) throw error
}

export async function listAllWatchedEpisodes(): Promise<WatchedEpisode[]> {
  const { data, error } = await supabase.from('watched_episodes').select('*')
  if (error) throw error
  return data as WatchedEpisode[]
}

export async function listWatchedEpisodesForShow(userShowId: string): Promise<WatchedEpisode[]> {
  const { data, error } = await supabase
    .from('watched_episodes')
    .select('*')
    .eq('user_show_id', userShowId)
  if (error) throw error
  return data as WatchedEpisode[]
}

export async function markEpisodeWatched(
  userShowId: string,
  season: number,
  episode: number,
): Promise<void> {
  const { error } = await supabase.from('watched_episodes').upsert(
    {
      user_show_id: userShowId,
      season_number: season,
      episode_number: episode,
    },
    { onConflict: 'user_show_id,season_number,episode_number', ignoreDuplicates: true },
  )
  if (error) throw error
}

export async function markSeasonWatched(
  userShowId: string,
  season: number,
  episodeCount: number,
): Promise<void> {
  const rows = Array.from({ length: episodeCount }, (_, i) => ({
    user_show_id: userShowId,
    season_number: season,
    episode_number: i + 1,
  }))
  const { error } = await supabase
    .from('watched_episodes')
    .upsert(rows, { onConflict: 'user_show_id,season_number,episode_number', ignoreDuplicates: true })
  if (error) throw error
}

export async function markEpisodeUnwatched(
  userShowId: string,
  season: number,
  episode: number,
): Promise<void> {
  const { error } = await supabase
    .from('watched_episodes')
    .delete()
    .eq('user_show_id', userShowId)
    .eq('season_number', season)
    .eq('episode_number', episode)
  if (error) throw error
}

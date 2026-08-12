import { supabase } from './supabase'
import type { FilmStatus, UserFilm } from '../types'

export async function listUserFilms(): Promise<UserFilm[]> {
  const { data, error } = await supabase
    .from('user_films')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data as UserFilm[]
}

export async function getUserFilmByTmdbId(tmdbId: number): Promise<UserFilm | null> {
  const { data, error } = await supabase
    .from('user_films')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .maybeSingle()
  if (error) throw error
  return data as UserFilm | null
}

export async function addFilm(film: {
  tmdb_id: number
  title: string
  poster_path: string | null
}): Promise<UserFilm> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('user_films')
    .insert({
      user_id: userId,
      tmdb_id: film.tmdb_id,
      title: film.title,
      poster_path: film.poster_path,
    })
    .select()
    .single()
  if (error) throw error
  return data as UserFilm
}

export async function setFilmStatus(id: string, status: FilmStatus): Promise<void> {
  const { error } = await supabase.from('user_films').update({ status }).eq('id', id)
  if (error) throw error
}

export async function removeFilm(id: string): Promise<void> {
  const { error } = await supabase.from('user_films').delete().eq('id', id)
  if (error) throw error
}

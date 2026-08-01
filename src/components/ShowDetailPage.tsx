import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getUserShowByTmdbId,
  listWatchedEpisodesForShow,
  markEpisodeUnwatched,
  markEpisodeWatched,
  markSeasonWatched,
  removeShow,
  setStatus,
} from '../lib/shows'
import { useShowDetails } from '../hooks/useShowDetails'
import { fetchSeasonEpisodesCached } from '../lib/tmdbCache'
import { episodeKey } from '../lib/nextEpisode'
import { posterUrl } from '../lib/tmdb'
import type { ShowStatus, TmdbEpisodeRef, UserShow } from '../types'

export function ShowDetailPage() {
  const { tmdbId } = useParams<{ tmdbId: string }>()
  const numericTmdbId = Number(tmdbId)
  const navigate = useNavigate()

  const [userShow, setUserShow] = useState<UserShow | null | undefined>(undefined)
  const [watched, setWatched] = useState<Set<string>>(new Set())
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  const [seasonEpisodes, setSeasonEpisodes] = useState<Map<number, TmdbEpisodeRef[]>>(new Map())
  const [seasonLoading, setSeasonLoading] = useState<number | null>(null)

  const { details } = useShowDetails(numericTmdbId)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const show = await getUserShowByTmdbId(numericTmdbId)
      if (cancelled) return
      setUserShow(show)
      if (show) {
        const rows = await listWatchedEpisodesForShow(show.id)
        if (!cancelled) {
          setWatched(new Set(rows.map((r) => episodeKey(r.season_number, r.episode_number))))
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [numericTmdbId])

  async function refreshWatched(userShowId: string) {
    const rows = await listWatchedEpisodesForShow(userShowId)
    setWatched(new Set(rows.map((r) => episodeKey(r.season_number, r.episode_number))))
  }

  /** Runs a "mark watched" mutation, then starts the show watching if it was still sitting in the library. */
  async function markWatchedAndMaybeStartWatching(mutate: () => Promise<void>) {
    if (!userShow) return
    await mutate()
    await refreshWatched(userShow.id)
    if (userShow.status === 'library') {
      await setStatus(userShow.id, 'watching')
      setUserShow((prev) => (prev ? { ...prev, status: 'watching' } : prev))
    }
  }

  async function toggleSeason(seasonNumber: number) {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null)
      return
    }
    setExpandedSeason(seasonNumber)
    if (!seasonEpisodes.has(seasonNumber)) {
      setSeasonLoading(seasonNumber)
      try {
        const data = await fetchSeasonEpisodesCached(numericTmdbId, seasonNumber)
        setSeasonEpisodes((prev) => new Map(prev).set(seasonNumber, data.episodes))
      } finally {
        setSeasonLoading(null)
      }
    }
  }

  async function toggleEpisode(seasonNumber: number, episodeNumber: number) {
    if (!userShow) return
    const key = episodeKey(seasonNumber, episodeNumber)
    if (watched.has(key)) {
      await markEpisodeUnwatched(userShow.id, seasonNumber, episodeNumber)
      await refreshWatched(userShow.id)
    } else {
      await markWatchedAndMaybeStartWatching(() =>
        markEpisodeWatched(userShow.id, seasonNumber, episodeNumber),
      )
    }
  }

  async function handleMarkSeasonWatched(seasonNumber: number, episodeCount: number) {
    if (!userShow) return
    await markWatchedAndMaybeStartWatching(() =>
      markSeasonWatched(userShow.id, seasonNumber, episodeCount),
    )
  }

  async function handleStatusChange(status: ShowStatus) {
    if (!userShow) return
    await setStatus(userShow.id, status)
    setUserShow({ ...userShow, status })
  }

  async function handleRemove() {
    if (!userShow) return
    await removeShow(userShow.id)
    navigate('/')
  }

  if (userShow === undefined || !details) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>
  }

  if (userShow === null) {
    return (
      <div className="p-8 text-center text-neutral-500">
        You haven't added this show yet.{' '}
        <Link to="/" className="text-indigo-400 hover:underline">
          Back to your library
        </Link>
      </div>
    )
  }

  const backdrop = posterUrl(details.backdrop_path, 'w500')
  const realSeasons = details.seasons
    .filter((s) => s.season_number >= 1 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number)
  const imdbId = details.external_ids?.imdb_id

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/" className="mb-4 inline-block text-sm text-neutral-400 hover:text-neutral-200">
        ← Back
      </Link>

      {backdrop && <img src={backdrop} alt="" className="mb-4 w-full rounded-xl object-cover" />}

      <h1 className="text-2xl font-semibold text-neutral-100">{details.name}</h1>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
        <span>{details.status}</span>
        {details.vote_average > 0 && (
          <span>
            ★ {details.vote_average.toFixed(1)}{' '}
            <span className="text-neutral-500">({details.vote_count.toLocaleString()} votes)</span>
          </span>
        )}
        {details.genres.length > 0 && <span>{details.genres.map((g) => g.name).join(', ')}</span>}
        {details.networks.length > 0 && (
          <span>{details.networks.map((n) => n.name).join(', ')}</span>
        )}
        {imdbId && (
          <a
            href={`https://www.imdb.com/title/${imdbId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            View on IMDb ↗
          </a>
        )}
      </div>

      {details.overview && <p className="mt-3 text-sm text-neutral-300">{details.overview}</p>}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {userShow.status !== 'watching' && (
          <button
            onClick={() => handleStatusChange('watching')}
            className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
          >
            {userShow.status === 'finished' ? 'Watch again' : 'Start watching'}
          </button>
        )}
        {userShow.status !== 'finished' && (
          <button
            onClick={() => handleStatusChange('finished')}
            className="rounded-md bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
          >
            Mark finished
          </button>
        )}
        {userShow.status !== 'library' && (
          <button
            onClick={() => handleStatusChange('library')}
            className="rounded-md bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
          >
            Back to library
          </button>
        )}
        <button
          onClick={handleRemove}
          className="rounded-md bg-neutral-800 px-3 py-1.5 text-red-400 hover:bg-neutral-700"
        >
          Remove
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {realSeasons.map((season) => (
          <SeasonRow
            key={season.season_number}
            seasonNumber={season.season_number}
            name={season.name}
            episodeCount={season.episode_count}
            watched={watched}
            expanded={expandedSeason === season.season_number}
            loading={seasonLoading === season.season_number}
            episodes={seasonEpisodes.get(season.season_number)}
            onToggleSeason={() => toggleSeason(season.season_number)}
            onToggleEpisode={toggleEpisode}
            onMarkAllWatched={handleMarkSeasonWatched}
          />
        ))}
      </div>
    </div>
  )
}

interface SeasonRowProps {
  seasonNumber: number
  name: string
  episodeCount: number
  watched: ReadonlySet<string>
  expanded: boolean
  loading: boolean
  episodes: TmdbEpisodeRef[] | undefined
  onToggleSeason: () => void
  onToggleEpisode: (season: number, episode: number) => void
  onMarkAllWatched: (season: number, episodeCount: number) => void
}

function SeasonRow({
  seasonNumber,
  name,
  episodeCount,
  watched,
  expanded,
  loading,
  episodes,
  onToggleSeason,
  onToggleEpisode,
  onMarkAllWatched,
}: SeasonRowProps) {
  let watchedCount = 0
  for (let e = 1; e <= episodeCount; e++) {
    if (watched.has(episodeKey(seasonNumber, e))) watchedCount++
  }

  return (
    <div className="rounded-lg bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onToggleSeason} className="flex-1 text-left font-medium text-neutral-100">
          {name}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">
            {watchedCount}/{episodeCount} watched
          </span>
          {watchedCount < episodeCount && (
            <button
              onClick={() => onMarkAllWatched(seasonNumber, episodeCount)}
              className="text-xs font-medium text-indigo-400 hover:underline"
            >
              Mark all watched
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-1 px-2 pb-2">
          {loading ? (
            <p className="px-2 py-2 text-sm text-neutral-500">Loading episodes…</p>
          ) : (
            (episodes ?? []).map((ep) => {
              const isWatched = watched.has(episodeKey(ep.season_number, ep.episode_number))
              const still = posterUrl(ep.still_path, 'w200')
              return (
                <button
                  key={ep.episode_number}
                  onClick={() => onToggleEpisode(ep.season_number, ep.episode_number)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-neutral-800"
                >
                  {still ? (
                    <img src={still} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-20 shrink-0 rounded bg-neutral-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-100">
                      {ep.episode_number}. {ep.name}
                    </p>
                    <p className="text-xs text-neutral-500">{ep.air_date ?? 'Unaired'}</p>
                  </div>
                  <div
                    className={`h-5 w-5 shrink-0 rounded-full border ${
                      isWatched ? 'border-indigo-500 bg-indigo-600' : 'border-neutral-600'
                    }`}
                    aria-hidden
                  />
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

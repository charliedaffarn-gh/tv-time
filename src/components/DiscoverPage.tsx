import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  getGenres,
  getMovieGenres,
  getMoviesByGenre,
  getPopular,
  getPopularMovies,
  getShowsByGenre,
  getTopRated,
  getTopRatedMovies,
  getTrending,
  getTrendingMovies,
} from '../lib/tmdb'
import { addShow, listUserShows } from '../lib/shows'
import { addFilm, listUserFilms } from '../lib/films'
import { ChartRow } from './ChartRow'
import { GenreChipRow } from './GenreChipRow'
import { GenreResultsList } from './GenreResultsList'
import type { MediaQuickAddState } from './MediaQuickAddItem'
import type { TmdbGenre, TmdbSearchResult } from '../types'

type MediaType = 'tv' | 'movie'

interface MediaConfig {
  fetchTrending: () => Promise<{ results: TmdbSearchResult[] }>
  fetchPopular: () => Promise<{ results: TmdbSearchResult[] }>
  fetchTopRated: () => Promise<{ results: TmdbSearchResult[] }>
  fetchGenres: () => Promise<{ genres: TmdbGenre[] }>
  fetchByGenre: (genreId: number) => Promise<{ results: TmdbSearchResult[] }>
  listExisting: () => Promise<{ tmdb_id: number }[]>
  addItem: (item: {
    tmdb_id: number
    title: string
    poster_path: string | null
  }) => Promise<unknown>
}

const MEDIA_CONFIG: Record<MediaType, MediaConfig> = {
  tv: {
    fetchTrending: getTrending,
    fetchPopular: getPopular,
    fetchTopRated: getTopRated,
    fetchGenres: getGenres,
    fetchByGenre: getShowsByGenre,
    listExisting: listUserShows,
    addItem: addShow,
  },
  movie: {
    fetchTrending: getTrendingMovies,
    fetchPopular: getPopularMovies,
    fetchTopRated: getTopRatedMovies,
    fetchGenres: getMovieGenres,
    fetchByGenre: getMoviesByGenre,
    listExisting: listUserFilms,
    addItem: addFilm,
  },
}

interface ChartState {
  items: TmdbSearchResult[]
  loading: boolean
  error: string | null
}

const EMPTY_CHART: ChartState = { items: [], loading: true, error: null }

function loadChart(
  fetcher: () => Promise<{ results: TmdbSearchResult[] }>,
  setState: Dispatch<SetStateAction<ChartState>>,
  errorMessage: string,
) {
  fetcher()
    .then((data) => setState({ items: data.results, loading: false, error: null }))
    .catch(() => setState({ items: [], loading: false, error: errorMessage }))
}

export function DiscoverPage() {
  const [mediaType, setMediaType] = useState<MediaType>('tv')

  const [trending, setTrending] = useState<ChartState>(EMPTY_CHART)
  const [popular, setPopular] = useState<ChartState>(EMPTY_CHART)
  const [topRated, setTopRated] = useState<ChartState>(EMPTY_CHART)
  const [genres, setGenres] = useState<TmdbGenre[]>([])
  const [genresError, setGenresError] = useState<string | null>(null)

  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)
  const [genreResults, setGenreResults] = useState<TmdbSearchResult[]>([])
  const [genreLoading, setGenreLoading] = useState(false)
  const [genreError, setGenreError] = useState<string | null>(null)

  const [existingTmdbIds, setExistingTmdbIds] = useState<Set<number>>(new Set())
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [addError, setAddError] = useState<string | null>(null)

  const config = MEDIA_CONFIG[mediaType]

  // Explicit resets here, on top of keying the effects below on [mediaType] --
  // belt and braces so a future edit to either can't serve one media type's
  // genre IDs or add-state against the other's disjoint namespace.
  function changeMediaType(next: MediaType) {
    if (next === mediaType) return
    setMediaType(next)
    setTrending(EMPTY_CHART)
    setPopular(EMPTY_CHART)
    setTopRated(EMPTY_CHART)
    setGenres([])
    setGenresError(null)
    setSelectedGenreId(null)
    setGenreResults([])
    setGenreLoading(false)
    setGenreError(null)
    setExistingTmdbIds(new Set())
    setAddingIds(new Set())
    setAddedIds(new Set())
    setAddError(null)
  }

  useEffect(() => {
    loadChart(config.fetchTrending, setTrending, 'Could not load trending titles.')
    loadChart(config.fetchPopular, setPopular, 'Could not load popular titles.')
    loadChart(config.fetchTopRated, setTopRated, 'Could not load top rated titles.')
    config
      .fetchGenres()
      .then((data) => setGenres(data.genres))
      .catch(() => setGenresError('Could not load genres.'))
    config
      .listExisting()
      .then((items) => setExistingTmdbIds(new Set(items.map((i) => i.tmdb_id))))
      .catch(() => {
        // Quietly degrade -- worst case, an already-added item shows an
        // Add button that fails gracefully instead of "Added".
      })
    // config is a pure function of mediaType (a lookup, not independent
    // state), so depending on mediaType alone is correct and avoids
    // re-running on every render (a fresh config object is created each
    // render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType])

  useEffect(() => {
    if (selectedGenreId === null) {
      setGenreResults([])
      return
    }
    let cancelled = false
    setGenreLoading(true)
    setGenreError(null)
    config
      .fetchByGenre(selectedGenreId)
      .then((data) => {
        if (!cancelled) setGenreResults(data.results)
      })
      .catch(() => {
        if (!cancelled) setGenreError('Could not load titles for this genre.')
      })
      .finally(() => {
        if (!cancelled) setGenreLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, selectedGenreId])

  function getItemState(tmdbId: number): MediaQuickAddState {
    if (existingTmdbIds.has(tmdbId) || addedIds.has(tmdbId)) return 'added'
    if (addingIds.has(tmdbId)) return 'adding'
    return 'idle'
  }

  async function handleAddItem(item: TmdbSearchResult) {
    setAddingIds((prev) => new Set(prev).add(item.id))
    setAddError(null)
    try {
      await config.addItem({ tmdb_id: item.id, title: item.name, poster_path: item.poster_path })
      setAddedIds((prev) => new Set(prev).add(item.id))
    } catch {
      setAddError('Could not add that. Try again.')
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const selectedGenreName = genres.find((g) => g.id === selectedGenreId)?.name ?? ''

  return (
    <div>
      <div className="mb-4 flex max-w-xs gap-1 rounded-lg bg-neutral-900 p-1">
        <button
          onClick={() => changeMediaType('tv')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mediaType === 'tv'
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          TV
        </button>
        <button
          onClick={() => changeMediaType('movie')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mediaType === 'movie'
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Films
        </button>
      </div>

      {addError && <p className="mb-4 text-sm text-red-400">{addError}</p>}

      {genresError && <p className="mb-2 text-sm text-red-400">{genresError}</p>}
      {genres.length > 0 && (
        <GenreChipRow genres={genres} selectedGenreId={selectedGenreId} onSelect={setSelectedGenreId} />
      )}

      {selectedGenreId === null ? (
        <>
          <ChartRow
            title="Trending this week"
            items={trending.items}
            loading={trending.loading}
            error={trending.error}
            getState={getItemState}
            onAdd={handleAddItem}
          />
          <ChartRow
            title="Popular"
            items={popular.items}
            loading={popular.loading}
            error={popular.error}
            getState={getItemState}
            onAdd={handleAddItem}
          />
          <ChartRow
            title="Top Rated"
            items={topRated.items}
            loading={topRated.loading}
            error={topRated.error}
            getState={getItemState}
            onAdd={handleAddItem}
          />
        </>
      ) : (
        <GenreResultsList
          genreName={selectedGenreName}
          items={genreResults}
          loading={genreLoading}
          error={genreError}
          getState={getItemState}
          onAdd={handleAddItem}
          onBack={() => setSelectedGenreId(null)}
        />
      )}
    </div>
  )
}

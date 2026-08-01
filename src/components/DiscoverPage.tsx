import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getGenres, getPopular, getShowsByGenre, getTopRated, getTrending } from '../lib/tmdb'
import { addShow, listUserShows } from '../lib/shows'
import { ChartRow } from './ChartRow'
import { GenreChipRow } from './GenreChipRow'
import { GenreResultsList } from './GenreResultsList'
import type { ShowQuickAddState } from './ShowQuickAddItem'
import type { TmdbGenre, TmdbSearchResult } from '../types'

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

  useEffect(() => {
    loadChart(getTrending, setTrending, 'Could not load trending shows.')
    loadChart(getPopular, setPopular, 'Could not load popular shows.')
    loadChart(getTopRated, setTopRated, 'Could not load top rated shows.')
    getGenres()
      .then((data) => setGenres(data.genres))
      .catch(() => setGenresError('Could not load genres.'))
    listUserShows()
      .then((shows) => setExistingTmdbIds(new Set(shows.map((s) => s.tmdb_id))))
      .catch(() => {
        // Quietly degrade -- worst case, an already-added show shows an
        // Add button that fails gracefully instead of "Added".
      })
  }, [])

  useEffect(() => {
    if (selectedGenreId === null) {
      setGenreResults([])
      return
    }
    let cancelled = false
    setGenreLoading(true)
    setGenreError(null)
    getShowsByGenre(selectedGenreId)
      .then((data) => {
        if (!cancelled) setGenreResults(data.results)
      })
      .catch(() => {
        if (!cancelled) setGenreError('Could not load shows for this genre.')
      })
      .finally(() => {
        if (!cancelled) setGenreLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedGenreId])

  function getItemState(tmdbId: number): ShowQuickAddState {
    if (existingTmdbIds.has(tmdbId) || addedIds.has(tmdbId)) return 'added'
    if (addingIds.has(tmdbId)) return 'adding'
    return 'idle'
  }

  async function handleAddShow(show: TmdbSearchResult) {
    setAddingIds((prev) => new Set(prev).add(show.id))
    setAddError(null)
    try {
      await addShow({ tmdb_id: show.id, title: show.name, poster_path: show.poster_path })
      setAddedIds((prev) => new Set(prev).add(show.id))
    } catch {
      setAddError('Could not add that show. Try again.')
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(show.id)
        return next
      })
    }
  }

  const selectedGenreName = genres.find((g) => g.id === selectedGenreId)?.name ?? ''

  return (
    <div>
      {addError && <p className="mb-4 text-sm text-red-400">{addError}</p>}

      {selectedGenreId === null ? (
        <>
          <ChartRow
            title="Trending this week"
            items={trending.items}
            loading={trending.loading}
            error={trending.error}
            getState={getItemState}
            onAdd={handleAddShow}
          />
          <ChartRow
            title="Popular"
            items={popular.items}
            loading={popular.loading}
            error={popular.error}
            getState={getItemState}
            onAdd={handleAddShow}
          />
          <ChartRow
            title="Top Rated"
            items={topRated.items}
            loading={topRated.loading}
            error={topRated.error}
            getState={getItemState}
            onAdd={handleAddShow}
          />
        </>
      ) : (
        <GenreResultsList
          genreName={selectedGenreName}
          items={genreResults}
          loading={genreLoading}
          error={genreError}
          getState={getItemState}
          onAdd={handleAddShow}
        />
      )}

      {genresError && <p className="mb-2 text-sm text-red-400">{genresError}</p>}
      {genres.length > 0 && (
        <GenreChipRow genres={genres} selectedGenreId={selectedGenreId} onSelect={setSelectedGenreId} />
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { addFilm, listUserFilms, removeFilm, setFilmStatus } from '../lib/films'
import { searchMovies } from '../lib/tmdb'
import { AddMediaModal } from './AddMediaModal'
import { FilmCard } from './FilmCard'
import { TabBar } from './TabBar'
import type { FilmStatus, MediaCardView, TmdbSearchResult, UserFilm } from '../types'

const VIEW_STORAGE_KEY = 'film-view-mode'

const FILM_TABS: { key: FilmStatus; label: string }[] = [
  { key: 'to_watch', label: 'To Watch' },
  { key: 'watched', label: 'Watched' },
]

export function MyFilmsPage() {
  const [films, setFilms] = useState<UserFilm[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilmStatus>('to_watch')
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<MediaCardView>(
    () => (localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid'),
  )

  function changeView(next: MediaCardView) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const refresh = useCallback(async () => {
    try {
      const filmsData = await listUserFilms()
      setFilms(filmsData)
      setError(null)
    } catch {
      setError('Could not load your films.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function runAction(action: () => Promise<void>) {
    try {
      await action()
      await refresh()
    } catch {
      setError('That action failed. Please try again.')
    }
  }

  async function handleAdd(result: TmdbSearchResult): Promise<{ error: string | null }> {
    try {
      await addFilm({ tmdb_id: result.id, title: result.name, poster_path: result.poster_path })
      setShowAddModal(false)
      await refresh()
      return { error: null }
    } catch {
      return { error: 'Could not add that film. Try again.' }
    }
  }

  const handleMarkWatched = (id: string) => runAction(() => setFilmStatus(id, 'watched'))
  const handleMoveToToWatch = (id: string) => runAction(() => setFilmStatus(id, 'to_watch'))
  const handleRemove = (id: string) => runAction(() => removeFilm(id))

  const counts: Record<FilmStatus, number> = {
    to_watch: films.filter((f) => f.status === 'to_watch').length,
    watched: films.filter((f) => f.status === 'watched').length,
  }
  const visibleFilms = films.filter((f) => f.status === activeTab)
  const existingTmdbIds = new Set(films.map((f) => f.tmdb_id))

  const emptyMessage: Record<FilmStatus, string> = {
    to_watch: "Nothing here yet — add a film you've heard about.",
    watched: 'Nothing watched yet.',
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <TabBar tabs={FILM_TABS} active={activeTab} counts={counts} onChange={setActiveTab} />
        </div>
        <div className="flex shrink-0 gap-1 text-xs">
          <button
            onClick={() => changeView('grid')}
            className={
              view === 'grid'
                ? 'rounded-md bg-neutral-800 px-2 py-1 text-neutral-100'
                : 'rounded-md px-2 py-1 text-neutral-500 hover:text-neutral-300'
            }
          >
            Grid
          </button>
          <button
            onClick={() => changeView('list')}
            className={
              view === 'list'
                ? 'rounded-md bg-neutral-800 px-2 py-1 text-neutral-100'
                : 'rounded-md px-2 py-1 text-neutral-500 hover:text-neutral-300'
            }
          >
            List
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : visibleFilms.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{emptyMessage[activeTab]}</p>
      ) : (
        <div
          className={`pb-24 ${
            view === 'grid'
              ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'flex flex-col gap-2'
          }`}
        >
          {visibleFilms.map((film) => (
            <FilmCard
              key={film.id}
              film={film}
              view={view}
              onMarkWatched={() => handleMarkWatched(film.id)}
              onMoveToToWatch={() => handleMoveToToWatch(film.id)}
              onRemove={() => handleRemove(film.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 1rem)' }}
        className="fixed right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg hover:bg-indigo-500"
        aria-label="Add a film"
      >
        +
      </button>

      {showAddModal && (
        <AddMediaModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          existingTmdbIds={existingTmdbIds}
          searchFn={searchMovies}
          title="Add a film"
          placeholder="Search for a film…"
        />
      )}
    </>
  )
}

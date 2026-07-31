import { useCallback, useEffect, useState } from 'react'
import {
  addShow,
  listAllWatchedEpisodes,
  listUserShows,
  markEpisodeWatched,
  removeShow,
  setStatus,
} from '../lib/shows'
import { episodeKey } from '../lib/nextEpisode'
import { useAuth } from '../contexts/useAuth'
import { AddShowModal } from './AddShowModal'
import { ShowCard } from './ShowCard'
import { TabBar } from './TabBar'
import { UpcomingStrip } from './UpcomingStrip'
import type { ShowStatus, TmdbSearchResult, UserShow, WatchedEpisode } from '../types'

export function Dashboard() {
  const { signOut } = useAuth()
  const [shows, setShows] = useState<UserShow[]>([])
  const [watchedByShow, setWatchedByShow] = useState<Map<string, Set<string>>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ShowStatus>('watching')
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [showsData, watchedData] = await Promise.all([
        listUserShows(),
        listAllWatchedEpisodes(),
      ])
      setShows(showsData)
      setWatchedByShow(groupWatchedByShow(watchedData))
      setError(null)
    } catch {
      setError('Could not load your shows.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleAdd(result: TmdbSearchResult) {
    setShowAddModal(false)
    await addShow({ tmdb_id: result.id, title: result.name, poster_path: result.poster_path })
    await refresh()
  }

  async function handleStartWatching(id: string) {
    await setStatus(id, 'watching')
    await refresh()
  }

  async function handleMarkWatched(id: string, season: number, episode: number) {
    await markEpisodeWatched(id, season, episode)
    await refresh()
  }

  async function handleMoveToLibrary(id: string) {
    await setStatus(id, 'library')
    await refresh()
  }

  async function handleMoveToFinished(id: string) {
    await setStatus(id, 'finished')
    await refresh()
  }

  async function handleRemove(id: string) {
    await removeShow(id)
    await refresh()
  }

  const counts: Record<ShowStatus, number> = {
    library: shows.filter((s) => s.status === 'library').length,
    watching: shows.filter((s) => s.status === 'watching').length,
    finished: shows.filter((s) => s.status === 'finished').length,
  }
  const visibleShows = shows.filter((s) => s.status === activeTab)
  const existingTmdbIds = new Set(shows.map((s) => s.tmdb_id))
  const emptySet: Set<string> = new Set()

  const emptyMessage: Record<ShowStatus, string> = {
    library: "Nothing here yet — add a show you've heard about.",
    watching: 'Nothing in progress. Start watching something from your library.',
    finished: 'Nothing finished yet.',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">TV Time</h1>
        <button onClick={signOut} className="text-sm text-neutral-500 hover:text-neutral-300">
          Sign out
        </button>
      </div>

      {activeTab === 'watching' && <UpcomingStrip shows={shows} />}

      <div className="mb-4">
        <TabBar active={activeTab} counts={counts} onChange={setActiveTab} />
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : visibleShows.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{emptyMessage[activeTab]}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleShows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              watched={watchedByShow.get(show.id) ?? emptySet}
              onStartWatching={() => handleStartWatching(show.id)}
              onMarkWatched={(season, episode) => handleMarkWatched(show.id, season, episode)}
              onMoveToLibrary={() => handleMoveToLibrary(show.id)}
              onMoveToFinished={() => handleMoveToFinished(show.id)}
              onRemove={() => handleRemove(show.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg hover:bg-indigo-500"
        aria-label="Add a show"
      >
        +
      </button>

      {showAddModal && (
        <AddShowModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          existingTmdbIds={existingTmdbIds}
        />
      )}
    </div>
  )
}

function groupWatchedByShow(rows: WatchedEpisode[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const row of rows) {
    const set = map.get(row.user_show_id) ?? new Set<string>()
    set.add(episodeKey(row.season_number, row.episode_number))
    map.set(row.user_show_id, set)
  }
  return map
}

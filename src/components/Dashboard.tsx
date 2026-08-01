import { useCallback, useEffect, useState } from 'react'
import {
  addShow,
  listAllWatchedEpisodes,
  listUserShows,
  listWatchedEpisodesForShow,
  markEpisodeWatched,
  removeShow,
  setStatus,
} from '../lib/shows'
import { computeNextEpisode, episodeKey } from '../lib/nextEpisode'
import { fetchShowDetailsCached } from '../lib/tmdbCache'
import { isShowConcluded } from '../lib/tmdb'
import { acceptShare, dismissShare, listPendingShares } from '../lib/shares'
import { useAuth } from '../contexts/useAuth'
import { AddShowModal } from './AddShowModal'
import { HelpModal } from './HelpModal'
import { PendingShares } from './PendingShares'
import { ShowCard, type ShowCardView } from './ShowCard'
import { TabBar } from './TabBar'
import { UpcomingStrip } from './UpcomingStrip'
import type { ShowShare, ShowStatus, TmdbSearchResult, UserShow, WatchedEpisode } from '../types'

const VIEW_STORAGE_KEY = 'show-view-mode'

export function Dashboard() {
  const { signOut } = useAuth()
  const [shows, setShows] = useState<UserShow[]>([])
  const [watchedByShow, setWatchedByShow] = useState<Map<string, Set<string>>>(new Map())
  const [watchingOrder, setWatchingOrder] = useState<Map<string, WatchingSortInfo>>(new Map())
  const [pendingShares, setPendingShares] = useState<ShowShare[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ShowStatus>('watching')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchedError, setWatchedError] = useState(false)
  const [view, setView] = useState<ShowCardView>(
    () => (localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid'),
  )

  function changeView(next: ShowCardView) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const refresh = useCallback(async () => {
    // Fetched independently on purpose: a failure loading watched-episode
    // progress (e.g. before the episode-ledger migration has been run)
    // must not blank out the shows list itself.
    try {
      const showsData = await listUserShows()
      setShows(showsData)
      setError(null)
    } catch {
      setError('Could not load your shows.')
      setLoading(false)
      return
    }

    try {
      const watchedData = await listAllWatchedEpisodes()
      setWatchedByShow(groupWatchedByShow(watchedData))
      setWatchedError(false)
    } catch {
      setWatchedError(true)
    }

    // Also independent: shares shouldn't have any bearing on whether the
    // shows list itself loads.
    try {
      setPendingShares(await listPendingShares())
    } catch {
      // Quietly retry on next refresh -- not worth a banner for this.
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Ranks Watching shows so ones with something to actually watch sort above
  // ones you're just caught up with, and among those, soonest air date first.
  useEffect(() => {
    const watchingShows = shows.filter((s) => s.status === 'watching')
    if (watchingShows.length === 0) {
      setWatchingOrder(new Map())
      return
    }
    let cancelled = false
    Promise.all(
      watchingShows.map(async (show) => {
        const watched = watchedByShow.get(show.id) ?? new Set<string>()
        try {
          const details = await fetchShowDetailsCached(show.tmdb_id)
          const hasNext = computeNextEpisode(watched, details.seasons) !== null
          const nextAirDate = details.next_episode_to_air?.air_date ?? null
          const rank: WatchingSortInfo = hasNext
            ? { tier: 0, nextAirDate: null }
            : { tier: nextAirDate ? 1 : 2, nextAirDate }
          return [show.id, rank] as const
        } catch {
          return [show.id, { tier: 0, nextAirDate: null } as WatchingSortInfo] as const
        }
      }),
    ).then((entries) => {
      if (!cancelled) setWatchingOrder(new Map(entries))
    })
    return () => {
      cancelled = true
    }
  }, [shows, watchedByShow])

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
      await addShow({ tmdb_id: result.id, title: result.name, poster_path: result.poster_path })
      setShowAddModal(false)
      await refresh()
      return { error: null }
    } catch {
      return { error: 'Could not add that show. Try again.' }
    }
  }

  const handleStartWatching = (id: string) => runAction(() => setStatus(id, 'watching'))

  const handleMarkWatched = (id: string, season: number, episode: number) =>
    runAction(async () => {
      await markEpisodeWatched(id, season, episode)

      const show = shows.find((s) => s.id === id)
      if (!show) return
      const [rows, tmdbDetails] = await Promise.all([
        listWatchedEpisodesForShow(id),
        fetchShowDetailsCached(show.tmdb_id),
      ])
      const freshWatched = new Set(rows.map((r) => episodeKey(r.season_number, r.episode_number)))
      const caughtUp = computeNextEpisode(freshWatched, tmdbDetails.seasons) === null
      if (caughtUp && isShowConcluded(tmdbDetails.status)) {
        await setStatus(id, 'finished')
      }
    })

  const handleMoveToLibrary = (id: string) => runAction(() => setStatus(id, 'library'))
  const handleRemove = (id: string) => runAction(() => removeShow(id))
  const handleAcceptShare = (share: ShowShare) => runAction(() => acceptShare(share))
  const handleDismissShare = (shareId: string) => runAction(() => dismissShare(shareId))

  const counts: Record<ShowStatus, number> = {
    library: shows.filter((s) => s.status === 'library').length,
    watching: shows.filter((s) => s.status === 'watching').length,
    finished: shows.filter((s) => s.status === 'finished').length,
  }
  const visibleShows = shows.filter((s) => s.status === activeTab)
  if (activeTab === 'watching') {
    visibleShows.sort((a, b) => {
      const rankA = watchingOrder.get(a.id)
      const rankB = watchingOrder.get(b.id)
      if (!rankA || !rankB) return 0
      if (rankA.tier !== rankB.tier) return rankA.tier - rankB.tier
      if (rankA.tier === 1) return (rankA.nextAirDate ?? '').localeCompare(rankB.nextAirDate ?? '')
      return 0
    })
  }
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHelpModal(true)}
            className="text-sm text-neutral-500 hover:text-neutral-300"
          >
            Help
          </button>
          <button onClick={signOut} className="text-sm text-neutral-500 hover:text-neutral-300">
            Sign out
          </button>
        </div>
      </div>

      <PendingShares
        shares={pendingShares}
        onAccept={handleAcceptShare}
        onDismiss={handleDismissShare}
      />

      {activeTab === 'watching' && <UpcomingStrip shows={shows} />}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <TabBar active={activeTab} counts={counts} onChange={setActiveTab} />
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
      {watchedError && (
        <p className="mb-4 text-sm text-amber-400">
          Couldn't load episode progress — "Up next" may be inaccurate until this loads. Try
          refreshing the page.
        </p>
      )}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : visibleShows.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{emptyMessage[activeTab]}</p>
      ) : (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'flex flex-col gap-2'
          }
        >
          {visibleShows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              view={view}
              watched={watchedByShow.get(show.id) ?? emptySet}
              onStartWatching={() => handleStartWatching(show.id)}
              onMarkWatched={(season, episode) => handleMarkWatched(show.id, season, episode)}
              onMoveToLibrary={() => handleMoveToLibrary(show.id)}
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

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  )
}

interface WatchingSortInfo {
  /** 0 = has an unwatched episode, 1 = caught up with a known next air date, 2 = caught up, no date yet */
  tier: 0 | 1 | 2
  nextAirDate: string | null
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

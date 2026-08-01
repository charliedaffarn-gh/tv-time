import { useEffect, useState } from 'react'
import { getRecommendations } from '../lib/tmdb'
import { listUserShows } from '../lib/shows'
import { ShowQuickAddItem, type ShowQuickAddState } from './ShowQuickAddItem'
import type { TmdbSearchResult } from '../types'

interface RecommendationsModalProps {
  onClose: () => void
  tmdbId: number
  title: string
  onAdd: (show: TmdbSearchResult) => Promise<{ error: string | null }>
}

export function RecommendationsModal({ onClose, tmdbId, title, onAdd }: RecommendationsModalProps) {
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [existingTmdbIds, setExistingTmdbIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([getRecommendations(tmdbId), listUserShows()])
      .then(([recs, shows]) => {
        setResults(recs.results)
        setExistingTmdbIds(new Set(shows.map((s) => s.tmdb_id)))
      })
      .catch(() => setError('Could not load recommendations.'))
      .finally(() => setLoading(false))
  }, [tmdbId])

  async function handleAddClick(show: TmdbSearchResult) {
    setAddingId(show.id)
    setError(null)
    const { error } = await onAdd(show)
    setAddingId(null)
    if (error) {
      setError(error)
    } else {
      setAddedIds((prev) => new Set(prev).add(show.id))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16">
      <div className="w-full max-w-lg rounded-xl bg-neutral-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Similar to "{title}"</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-neutral-500">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-neutral-500">No recommendations found for this show.</p>
        )}

        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {results.map((show) => {
            const state: ShowQuickAddState =
              existingTmdbIds.has(show.id) || addedIds.has(show.id)
                ? 'added'
                : addingId === show.id
                  ? 'adding'
                  : 'idle'
            return (
              <ShowQuickAddItem
                key={show.id}
                show={show}
                layout="row"
                state={state}
                onAdd={() => handleAddClick(show)}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}

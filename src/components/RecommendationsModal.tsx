import { useEffect, useState } from 'react'
import { MediaQuickAddItem, type MediaQuickAddState } from './MediaQuickAddItem'
import type { TmdbSearchResult } from '../types'

interface RecommendationsModalProps {
  onClose: () => void
  tmdbId: number
  title: string
  onAdd: (item: TmdbSearchResult) => Promise<{ error: string | null }>
  fetchRecommendations: (tmdbId: number) => Promise<{ results: TmdbSearchResult[] }>
  fetchExisting: () => Promise<{ tmdb_id: number }[]>
}

export function RecommendationsModal({
  onClose,
  tmdbId,
  title,
  onAdd,
  fetchRecommendations,
  fetchExisting,
}: RecommendationsModalProps) {
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [existingTmdbIds, setExistingTmdbIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([fetchRecommendations(tmdbId), fetchExisting()])
      .then(([recs, items]) => {
        setResults(recs.results)
        setExistingTmdbIds(new Set(items.map((i) => i.tmdb_id)))
      })
      .catch(() => setError('Could not load recommendations.'))
      .finally(() => setLoading(false))
  }, [tmdbId, fetchRecommendations, fetchExisting])

  async function handleAddClick(item: TmdbSearchResult) {
    setAddingId(item.id)
    setError(null)
    const { error } = await onAdd(item)
    setAddingId(null)
    if (error) {
      setError(error)
    } else {
      setAddedIds((prev) => new Set(prev).add(item.id))
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
          <p className="text-sm text-neutral-500">No recommendations found.</p>
        )}

        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {results.map((item) => {
            const state: MediaQuickAddState =
              existingTmdbIds.has(item.id) || addedIds.has(item.id)
                ? 'added'
                : addingId === item.id
                  ? 'adding'
                  : 'idle'
            return (
              <MediaQuickAddItem
                key={item.id}
                show={item}
                layout="row"
                state={state}
                onAdd={() => handleAddClick(item)}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}

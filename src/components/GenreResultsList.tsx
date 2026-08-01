import { ShowQuickAddItem, type ShowQuickAddState } from './ShowQuickAddItem'
import type { TmdbSearchResult } from '../types'

interface GenreResultsListProps {
  genreName: string
  items: TmdbSearchResult[]
  loading: boolean
  error: string | null
  getState: (tmdbId: number) => ShowQuickAddState
  onAdd: (show: TmdbSearchResult) => void
  onBack: () => void
}

export function GenreResultsList({
  genreName,
  items,
  loading,
  error,
  getState,
  onAdd,
  onBack,
}: GenreResultsListProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="mb-2 text-sm text-indigo-400 hover:underline"
      >
        ← Back to what to watch
      </button>
      <h2 className="mb-2 text-sm font-medium text-neutral-400">{genreName}</h2>
      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-neutral-500">No shows found in {genreName}.</p>
      )}
      <ul className="space-y-1">
        {items.map((show) => (
          <ShowQuickAddItem
            key={show.id}
            show={show}
            layout="row"
            state={getState(show.id)}
            onAdd={() => onAdd(show)}
          />
        ))}
      </ul>
    </div>
  )
}

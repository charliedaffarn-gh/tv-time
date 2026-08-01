import { useEdgeFade } from '../hooks/useEdgeFade'
import { ShowQuickAddItem, type ShowQuickAddState } from './ShowQuickAddItem'
import type { TmdbSearchResult } from '../types'

interface ChartRowProps {
  title: string
  items: TmdbSearchResult[]
  loading: boolean
  error: string | null
  getState: (tmdbId: number) => ShowQuickAddState
  onAdd: (show: TmdbSearchResult) => void
}

export function ChartRow({ title, items, loading, error, getState, onAdd }: ChartRowProps) {
  const { scrollRef, showFade } = useEdgeFade(items)

  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-medium text-neutral-400">{title}</h2>
      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-neutral-500">Nothing to show right now.</p>
      )}
      {items.length > 0 && (
        <div className="relative">
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1">
            {items.map((show) => (
              <ShowQuickAddItem
                key={show.id}
                show={show}
                layout="card"
                state={getState(show.id)}
                onAdd={() => onAdd(show)}
              />
            ))}
          </div>
          {showFade && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-r from-transparent to-neutral-950" />
          )}
        </div>
      )}
    </div>
  )
}

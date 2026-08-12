import { useEffect, useState } from 'react'
import { MediaQuickAddItem, type MediaQuickAddState } from './MediaQuickAddItem'
import type { TmdbSearchResult } from '../types'

interface AddMediaModalProps {
  onClose: () => void
  onAdd: (item: TmdbSearchResult) => Promise<{ error: string | null }>
  existingTmdbIds: Set<number>
  searchFn: (query: string) => Promise<{ results: TmdbSearchResult[] }>
  title: string
  placeholder: string
}

export function AddMediaModal({
  onClose,
  onAdd,
  existingTmdbIds,
  searchFn,
  title,
  placeholder,
}: AddMediaModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    const handle = setTimeout(() => {
      searchFn(trimmed)
        .then((data) => setResults(data.results.slice(0, 12)))
        .catch(() => setError('Search failed. Try again.'))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [query, searchFn])

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
          <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-indigo-500 focus:outline-none"
        />

        {loading && <p className="text-sm text-neutral-500">Searching…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

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

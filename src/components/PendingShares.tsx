import { posterUrl } from '../lib/tmdb'
import type { ShowShare } from '../types'

interface PendingSharesProps {
  shares: ShowShare[]
  onAccept: (share: ShowShare) => void
  onDismiss: (shareId: string) => void
}

export function PendingShares({ shares, onAccept, onDismiss }: PendingSharesProps) {
  if (shares.length === 0) return null

  return (
    <div className="mb-4">
      <h2 className="mb-2 text-sm font-medium text-neutral-400">Shared with you</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shares.map((share) => {
          const poster = posterUrl(share.poster_path, 'w200')
          return (
            <div
              key={share.id}
              className="flex shrink-0 items-center gap-3 rounded-lg bg-neutral-900 p-2 text-xs"
            >
              {poster ? (
                <img src={poster} alt="" className="h-16 w-11 rounded object-cover" />
              ) : (
                <div className="h-16 w-11 rounded bg-neutral-800" />
              )}
              <div>
                <p className="font-medium whitespace-nowrap text-neutral-100">{share.title}</p>
                <p className="whitespace-nowrap text-neutral-500">
                  from {share.from_profile?.display_name ?? 'someone'}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => onAccept(share)}
                    className="rounded-md bg-indigo-600 px-2 py-1 font-medium whitespace-nowrap text-white hover:bg-indigo-500"
                  >
                    Add to my library
                  </button>
                  <button
                    onClick={() => onDismiss(share.id)}
                    className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-400 hover:bg-neutral-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

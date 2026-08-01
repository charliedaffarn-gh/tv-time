import { useEffect, useState } from 'react'
import { listProfiles, shareShow } from '../lib/shares'
import type { Profile } from '../types'

interface ShareModalProps {
  onClose: () => void
  show: { tmdb_id: number; title: string; poster_path: string | null }
}

export function ShareModal({ onClose, show }: ShareModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [sharedWith, setSharedWith] = useState<Set<string>>(new Set())

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(() => setError('Could not load your contacts.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleShare(profile: Profile) {
    setSharingId(profile.id)
    setError(null)
    const { error } = await shareShow(profile.id, show)
    setSharingId(null)
    if (error) {
      setError(error)
    } else {
      setSharedWith((prev) => new Set(prev).add(profile.id))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16">
      <div className="w-full max-w-lg rounded-xl bg-neutral-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Share "{show.title}"</h2>
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
        {!loading && profiles.length === 0 && (
          <p className="text-sm text-neutral-500">
            No one else has an account here yet. Ask them to get set up first.
          </p>
        )}

        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {profiles.map((profile) => {
            const isSharing = sharingId === profile.id
            const isDone = sharedWith.has(profile.id)
            return (
              <li key={profile.id}>
                <button
                  disabled={isSharing || isDone}
                  onClick={() => handleShare(profile)}
                  className="flex w-full items-center justify-between rounded-lg p-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-neutral-100">{profile.display_name}</span>
                  {isDone && <span className="text-xs text-indigo-400">Shared ✓</span>}
                  {isSharing && <span className="text-xs text-neutral-500">Sharing…</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

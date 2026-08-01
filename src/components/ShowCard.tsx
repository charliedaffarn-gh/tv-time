import { Link } from 'react-router-dom'
import { isShowConcluded, posterUrl } from '../lib/tmdb'
import { useShowDetails } from '../hooks/useShowDetails'
import { useUpNext } from '../hooks/useUpNext'
import type { TmdbShowDetails, UserShow } from '../types'

interface ShowCardProps {
  show: UserShow
  watched: ReadonlySet<string>
  onStartWatching: () => void
  onMarkWatched: (season: number, episode: number) => void
  onMoveToLibrary: () => void
  onMoveToFinished: () => void
  onRemove: () => void
}

export function ShowCard({
  show,
  watched,
  onStartWatching,
  onMarkWatched,
  onMoveToLibrary,
  onMoveToFinished,
  onRemove,
}: ShowCardProps) {
  const { details } = useShowDetails(show.tmdb_id)
  const upNext = useUpNext(watched, show.status === 'watching' ? details : null)

  const poster = posterUrl(show.poster_path, 'w342')

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
      <Link to={`/show/${show.tmdb_id}`} className="block">
        <div className="aspect-[2/3] w-full bg-neutral-800">
          {poster ? (
            <img src={poster} alt={show.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-sm text-neutral-500">
              {show.title}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/show/${show.tmdb_id}`} className="line-clamp-2 font-medium text-neutral-100 hover:underline">
          {show.title}
        </Link>

        {show.status === 'watching' && (
          <div className="flex flex-1 flex-col justify-between gap-2">
            <p className="text-xs text-neutral-400">
              {upNext === undefined && 'Loading…'}
              {upNext === null && details && caughtUpMessage(details)}
              {upNext && (
                <>
                  Up next: S{upNext.season}E{upNext.episode}
                  {upNext.name ? ` — ${upNext.name}` : ''}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                disabled={!upNext}
                onClick={() => upNext && onMarkWatched(upNext.season, upNext.episode)}
                className="rounded-md bg-indigo-600 px-2 py-1 font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                Mark episode watched
              </button>
              <button
                onClick={onMoveToFinished}
                className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-300 hover:bg-neutral-700"
              >
                Move to finished
              </button>
            </div>
          </div>
        )}

        {show.status === 'library' && (
          <div className="mt-auto flex flex-wrap gap-2 text-xs">
            <button
              onClick={onStartWatching}
              className="rounded-md bg-indigo-600 px-2 py-1 font-medium text-white hover:bg-indigo-500"
            >
              Start watching
            </button>
            <button
              onClick={onRemove}
              className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300"
            >
              Remove
            </button>
          </div>
        )}

        {show.status === 'finished' && (
          <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-400">Finished</span>
            <button
              onClick={onMoveToLibrary}
              className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-300 hover:bg-neutral-700"
            >
              Watch again
            </button>
            <button
              onClick={onRemove}
              className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function caughtUpMessage(details: TmdbShowDetails): string {
  if (isShowConcluded(details.status)) return 'All caught up'
  const nextAirDate = details.next_episode_to_air?.air_date
  if (nextAirDate) {
    const date = new Date(nextAirDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    return `Caught up — next episode ${date}`
  }
  return 'Caught up — more coming'
}

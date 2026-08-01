import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isShowConcluded, posterUrl } from '../lib/tmdb'
import { useShowDetails } from '../hooks/useShowDetails'
import { useUpNext } from '../hooks/useUpNext'
import type { TmdbShowDetails, UserShow } from '../types'

export type ShowCardView = 'grid' | 'list'

interface ShowCardProps {
  show: UserShow
  watched: ReadonlySet<string>
  view: ShowCardView
  onStartWatching: () => void
  onMarkWatched: (season: number, episode: number) => void
  onMoveToLibrary: () => void
  onRemove: () => void
}

export function ShowCard({
  show,
  watched,
  view,
  onStartWatching,
  onMarkWatched,
  onMoveToLibrary,
  onRemove,
}: ShowCardProps) {
  const { details } = useShowDetails(show.tmdb_id)
  const upNext = useUpNext(watched, show.status === 'watching' ? details : null)
  const location = useLocation()
  const linkState = { from: location.pathname }

  const poster = posterUrl(show.poster_path, 'w342')

  let info: ReactNode = null
  let actions: ReactNode = null

  if (show.status === 'watching') {
    info = (
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
    )
    actions = (
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          disabled={!upNext}
          onClick={() => upNext && onMarkWatched(upNext.season, upNext.episode)}
          className="rounded-md bg-indigo-600 px-2 py-1 font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          Mark episode watched
        </button>
        <button
          onClick={onRemove}
          className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300"
        >
          Remove
        </button>
      </div>
    )
  } else if (show.status === 'library') {
    actions = (
      <div className="flex flex-wrap gap-2 text-xs">
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
    )
  } else {
    actions = (
      <div className="flex flex-wrap items-center gap-2 text-xs">
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
    )
  }

  if (view === 'list') {
    return (
      <div className="flex gap-3 rounded-lg bg-neutral-900 p-2">
        <Link to={`/show/${show.tmdb_id}`} state={linkState} className="shrink-0">
          {poster ? (
            <img src={poster} alt={show.title} className="h-16 w-11 rounded object-cover" />
          ) : (
            <div className="h-16 w-11 rounded bg-neutral-800" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/show/${show.tmdb_id}`}
            state={linkState}
            className="block truncate font-medium text-neutral-100 hover:underline"
          >
            {show.title}
          </Link>
          {info}
          <div className="mt-1">{actions}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
      <Link to={`/show/${show.tmdb_id}`} state={linkState} className="block">
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
        <Link
          to={`/show/${show.tmdb_id}`}
          state={linkState}
          className="line-clamp-2 font-medium text-neutral-100 hover:underline"
        >
          {show.title}
        </Link>

        {show.status === 'watching' ? (
          <div className="flex flex-1 flex-col justify-between gap-2">
            {info}
            {actions}
          </div>
        ) : (
          <div className="mt-auto">{actions}</div>
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

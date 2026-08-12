import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { posterUrl } from '../lib/tmdb'
import type { MediaCardView, UserFilm } from '../types'

interface FilmCardProps {
  film: UserFilm
  view: MediaCardView
  onMarkWatched: () => void
  onMoveToToWatch: () => void
  onRemove: () => void
}

export function FilmCard({ film, view, onMarkWatched, onMoveToToWatch, onRemove }: FilmCardProps) {
  const location = useLocation()
  const linkState = { from: location.pathname }
  const poster = posterUrl(film.poster_path, 'w342')

  let actions: ReactNode
  if (film.status === 'to_watch') {
    actions = (
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={onMarkWatched}
          className="rounded-md bg-indigo-600 px-2 py-1 font-medium text-white hover:bg-indigo-500"
        >
          Mark watched
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
        <span className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-400">Watched</span>
        <button
          onClick={onMoveToToWatch}
          className="rounded-md bg-neutral-800 px-2 py-1 text-neutral-300 hover:bg-neutral-700"
        >
          Move to To Watch
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
        <Link to={`/film/${film.tmdb_id}`} state={linkState} className="shrink-0">
          {poster ? (
            <img src={poster} alt={film.title} className="h-16 w-11 rounded object-cover" />
          ) : (
            <div className="h-16 w-11 rounded bg-neutral-800" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/film/${film.tmdb_id}`}
            state={linkState}
            className="block truncate font-medium text-neutral-100 hover:underline"
          >
            {film.title}
          </Link>
          <div className="mt-1">{actions}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
      <Link to={`/film/${film.tmdb_id}`} state={linkState} className="block">
        <div className="aspect-[2/3] w-full bg-neutral-800">
          {poster ? (
            <img src={poster} alt={film.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-sm text-neutral-500">
              {film.title}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          to={`/film/${film.tmdb_id}`}
          state={linkState}
          className="line-clamp-2 font-medium text-neutral-100 hover:underline"
        >
          {film.title}
        </Link>
        <div className="mt-auto">{actions}</div>
      </div>
    </div>
  )
}

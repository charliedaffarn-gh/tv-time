import { Link, useLocation } from 'react-router-dom'
import { posterUrl } from '../lib/tmdb'
import type { TmdbSearchResult } from '../types'

export type ShowQuickAddState = 'idle' | 'adding' | 'added'

interface ShowQuickAddItemProps {
  show: TmdbSearchResult
  layout: 'row' | 'card'
  state: ShowQuickAddState
  onAdd: () => void
}

const BUTTON_LABEL: Record<ShowQuickAddState, string> = {
  idle: 'Add',
  adding: 'Adding…',
  added: 'Added',
}

export function ShowQuickAddItem({ show, layout, state, onAdd }: ShowQuickAddItemProps) {
  const location = useLocation()
  const year = show.first_air_date?.slice(0, 4)
  const poster = posterUrl(show.poster_path, 'w200')
  const button = (
    <button
      disabled={state !== 'idle'}
      onClick={onAdd}
      className="shrink-0 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
    >
      {BUTTON_LABEL[state]}
    </button>
  )

  if (layout === 'card') {
    return (
      <div className="flex w-32 shrink-0 flex-col gap-2 sm:w-36">
        <Link to={`/show/${show.id}`} state={{ from: location.pathname }}>
          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-800">
            {poster ? (
              <img src={poster} alt={show.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-500">
                {show.name}
              </div>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-neutral-100">{show.name}</p>
        </Link>
        {button}
      </div>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded-lg p-2">
      <Link
        to={`/show/${show.id}`}
        state={{ from: location.pathname }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {poster ? (
          <img src={poster} alt="" className="h-16 w-11 shrink-0 rounded object-cover" />
        ) : (
          <div className="h-16 w-11 shrink-0 rounded bg-neutral-800" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-100">{show.name}</p>
          <p className="text-xs text-neutral-500">{year ?? 'Unknown year'}</p>
        </div>
      </Link>
      {button}
    </li>
  )
}

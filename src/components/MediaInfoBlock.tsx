import { posterUrl } from '../lib/tmdb'
import type { TmdbWatchProviderRegion } from '../types'

interface MediaInfoBlockProps {
  title: string
  backdropPath: string | null
  overview: string
  status: string
  voteAverage: number
  voteCount: number
  genres: { id: number; name: string }[]
  secondaryChips?: string[]
  imdbId: string | null
  watchProviders: TmdbWatchProviderRegion | undefined
}

export function MediaInfoBlock({
  title,
  backdropPath,
  overview,
  status,
  voteAverage,
  voteCount,
  genres,
  secondaryChips,
  imdbId,
  watchProviders,
}: MediaInfoBlockProps) {
  const backdrop = posterUrl(backdropPath, 'w500')

  return (
    <>
      {backdrop && <img src={backdrop} alt="" className="mb-4 w-full rounded-xl object-cover" />}

      <h1 className="text-2xl font-semibold text-neutral-100">{title}</h1>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
        <span>{status}</span>
        {voteAverage > 0 && (
          <span>
            ★ {voteAverage.toFixed(1)}{' '}
            <span className="text-neutral-500">({voteCount.toLocaleString()} votes)</span>
          </span>
        )}
        {genres.length > 0 && <span>{genres.map((g) => g.name).join(', ')}</span>}
        {secondaryChips && secondaryChips.length > 0 && <span>{secondaryChips.join(', ')}</span>}
        {imdbId && (
          <a
            href={`https://www.imdb.com/title/${imdbId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            View on IMDb ↗
          </a>
        )}
      </div>

      {overview && <p className="mt-3 text-sm text-neutral-300">{overview}</p>}

      {watchProviders && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(watchProviders.flatrate ?? []).map((provider) => {
            const logo = posterUrl(provider.logo_path, 'w92')
            return logo ? (
              <img
                key={provider.provider_name}
                src={logo}
                alt={provider.provider_name}
                title={provider.provider_name}
                className="h-8 w-8 rounded-md"
              />
            ) : null
          })}
          <a
            href={watchProviders.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:underline"
          >
            Where to watch ↗
          </a>
          <span className="text-xs text-neutral-600">(streaming data via JustWatch)</span>
        </div>
      )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { addFilm, getUserFilmByTmdbId, listUserFilms, removeFilm, setFilmStatus } from '../lib/films'
import { useMovieDetails } from '../hooks/useMovieDetails'
import { getMovieRecommendations, WATCH_REGION } from '../lib/tmdb'
import { MediaInfoBlock } from './MediaInfoBlock'
import { RecommendationsModal } from './RecommendationsModal'
import type { FilmStatus, TmdbSearchResult, UserFilm } from '../types'

export function FilmDetailPage() {
  const { tmdbId } = useParams<{ tmdbId: string }>()
  const numericTmdbId = Number(tmdbId)
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = (location.state as { from?: string } | null)?.from ?? '/films'

  const [userFilm, setUserFilm] = useState<UserFilm | null | undefined>(undefined)
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const { details } = useMovieDetails(numericTmdbId)

  useEffect(() => {
    let cancelled = false
    getUserFilmByTmdbId(numericTmdbId).then((film) => {
      if (!cancelled) setUserFilm(film)
    })
    return () => {
      cancelled = true
    }
  }, [numericTmdbId])

  async function handleAddRecommendation(
    item: TmdbSearchResult,
  ): Promise<{ error: string | null }> {
    try {
      await addFilm({ tmdb_id: item.id, title: item.name, poster_path: item.poster_path })
      return { error: null }
    } catch {
      return { error: 'Could not add that. Try again.' }
    }
  }

  async function handleAddToLibrary() {
    if (!details) return
    setAdding(true)
    setAddError(null)
    try {
      const newFilm = await addFilm({
        tmdb_id: numericTmdbId,
        title: details.title,
        poster_path: details.poster_path,
      })
      setUserFilm(newFilm)
    } catch {
      setAddError('Could not add that film. Try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(status: FilmStatus) {
    if (!userFilm) return
    await setFilmStatus(userFilm.id, status)
    setUserFilm({ ...userFilm, status })
  }

  async function handleRemove() {
    if (!userFilm) return
    await removeFilm(userFilm.id)
    navigate('/films')
  }

  if (userFilm === undefined || !details) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to={backTo} className="mb-4 inline-block text-sm text-neutral-400 hover:text-neutral-200">
        ← Back
      </Link>

      <MediaInfoBlock
        title={details.title}
        backdropPath={details.backdrop_path}
        overview={details.overview}
        status={details.status}
        voteAverage={details.vote_average}
        voteCount={details.vote_count}
        genres={details.genres}
        imdbId={details.imdb_id}
        watchProviders={details['watch/providers']?.results?.[WATCH_REGION]}
      />

      {userFilm === null ? (
        <div className="mt-4">
          {addError && <p className="mb-2 text-sm text-red-400">{addError}</p>}
          <button
            onClick={handleAddToLibrary}
            disabled={adding}
            className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add to My Films'}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {userFilm.status === 'to_watch' ? (
              <button
                onClick={() => handleStatusChange('watched')}
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
              >
                Mark watched
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('to_watch')}
                className="rounded-md bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
              >
                Move to To Watch
              </button>
            )}
            <button
              onClick={() => setShowRecommendationsModal(true)}
              className="rounded-md bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
            >
              Similar films
            </button>
            <button
              onClick={handleRemove}
              className="rounded-md bg-neutral-800 px-3 py-1.5 text-red-400 hover:bg-neutral-700"
            >
              Remove
            </button>
          </div>

          {showRecommendationsModal && (
            <RecommendationsModal
              onClose={() => setShowRecommendationsModal(false)}
              tmdbId={userFilm.tmdb_id}
              title={userFilm.title}
              onAdd={handleAddRecommendation}
              fetchRecommendations={getMovieRecommendations}
              fetchExisting={listUserFilms}
            />
          )}
        </>
      )}
    </div>
  )
}

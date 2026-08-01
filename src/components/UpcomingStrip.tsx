import { useEffect, useRef, useState } from 'react'
import { useUpcomingEpisodes } from '../hooks/useUpcomingEpisodes'
import type { UserShow } from '../types'

export function UpcomingStrip({ shows }: { shows: UserShow[] }) {
  const upcoming = useUpcomingEpisodes(shows)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showFade, setShowFade] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function updateFade() {
      if (!el) return
      setShowFade(el.scrollWidth - el.clientWidth - el.scrollLeft > 4)
    }

    updateFade()
    el.addEventListener('scroll', updateFade)
    window.addEventListener('resize', updateFade)
    return () => {
      el.removeEventListener('scroll', updateFade)
      window.removeEventListener('resize', updateFade)
    }
  }, [upcoming])

  if (upcoming.length === 0) return null

  return (
    <div className="mb-4">
      <h2 className="mb-2 text-sm font-medium text-neutral-400">Coming up</h2>
      <div className="relative">
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1">
          {upcoming.map(({ show, next }) => (
            <div
              key={show.id}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-xs"
            >
              <span className="font-medium text-neutral-100">{show.title}</span>
              <span className="text-neutral-500">
                S{next.season_number}E{next.episode_number} ·{' '}
                {new Date(next.air_date as string).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
        {showFade && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-r from-transparent to-neutral-950" />
        )}
      </div>
    </div>
  )
}

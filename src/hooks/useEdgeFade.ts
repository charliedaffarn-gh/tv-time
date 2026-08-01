import { useEffect, useRef, useState } from 'react'

/** Shows a right-edge fade on a horizontally-scrolling row exactly while there's more to scroll to. */
export function useEdgeFade<T>(dep: T) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep])

  return { scrollRef, showFade }
}

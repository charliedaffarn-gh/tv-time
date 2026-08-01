import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { BottomNav } from './BottomNav'
import { HelpModal } from './HelpModal'

export function AppLayout() {
  const { signOut } = useAuth()
  const [showHelpModal, setShowHelpModal] = useState(false)

  return (
    <>
      <div
        className="mx-auto max-w-5xl px-4 pt-6"
        style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h1 className="min-w-0 truncate text-base font-semibold text-neutral-100">
            What Am I Watching
          </h1>
          <div className="flex shrink-0 items-center gap-4">
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-sm text-neutral-500 hover:text-neutral-300"
            >
              Help
            </button>
            <button onClick={signOut} className="text-sm text-neutral-500 hover:text-neutral-300">
              Sign out
            </button>
          </div>
        </div>

        <Outlet />
      </div>

      <BottomNav />

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </>
  )
}

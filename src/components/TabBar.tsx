import type { ShowStatus } from '../types'

const TABS: { key: ShowStatus; label: string }[] = [
  { key: 'watching', label: 'Watching' },
  { key: 'library', label: 'Library' },
  { key: 'finished', label: 'Finished' },
]

interface TabBarProps {
  active: ShowStatus
  counts: Record<ShowStatus, number>
  onChange: (status: ShowStatus) => void
}

export function TabBar({ active, counts, onChange }: TabBarProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === tab.key
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {tab.label} <span className="opacity-60">{counts[tab.key]}</span>
        </button>
      ))}
    </div>
  )
}

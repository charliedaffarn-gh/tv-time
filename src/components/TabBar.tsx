interface Tab<T extends string> {
  key: T
  label: string
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  counts: Record<T, number>
  onChange: (key: T) => void
}

export function TabBar<T extends string>({ tabs, active, counts, onChange }: TabBarProps<T>) {
  return (
    <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex flex-1 flex-col items-center rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === tab.key
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>{tab.label}</span>
          <span className="opacity-60">{counts[tab.key]}</span>
        </button>
      ))}
    </div>
  )
}

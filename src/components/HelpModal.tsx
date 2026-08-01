interface HelpModalProps {
  onClose: () => void
}

interface Section {
  heading: string
  items: string[]
}

const SECTIONS: Section[] = [
  {
    heading: 'Tracking your shows',
    items: [
      'Three lists: Library (heard about it, not started), Watching, and Finished.',
      'Add a show by searching for it — poster art and details come in automatically.',
    ],
  },
  {
    heading: 'Keeping track of episodes',
    items: [
      'One tap on "Mark episode watched" moves you to the next episode.',
      'Tap into any show for the full episode list, season by season — check off any single episode, in any order.',
      '"Mark all watched" checks off a whole season in one go.',
    ],
  },
  {
    heading: 'It organizes itself',
    items: [
      'Marking an episode watched on a Library show moves it to Watching automatically.',
      'Finishing every episode of a show that has actually ended moves it to Finished automatically.',
      "Caught up on a show that's still airing? It stays in Watching and shows you when the next episode lands, instead of getting marked done too early.",
      'The Watching list sorts itself — shows with something new to watch float to the top.',
    ],
  },
  {
    heading: 'Show details',
    items: [
      "Tap a poster or title for a show's synopsis, rating, genres, network, and a direct link to IMDb.",
      '"Coming up" on the Watching tab shows upcoming air dates at a glance.',
      '"Where to watch" links out to streaming services carrying the show, when available.',
    ],
  },
  {
    heading: 'Sharing',
    items: [
      "Share any show with another account on the app — they'll see it waiting for them and can add it to their own list in one tap.",
      "Everyone's list stays private otherwise — nothing else is shared or synced.",
    ],
  },
  {
    heading: 'On your phone',
    items: ['Add it to your home screen from your browser menu — it opens full-screen, like a normal app.'],
  },
  {
    heading: 'Grid or list',
    items: [
      'Switch any tab between poster grid and a compact list using the toggle next to the tabs — whichever you pick is remembered next time.',
    ],
  },
]

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-16">
      <div className="w-full max-w-lg rounded-xl bg-neutral-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">How TV Time works</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="mb-1 text-sm font-medium text-indigo-400">{section.heading}</h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-neutral-300">
                    <span className="text-neutral-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

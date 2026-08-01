import type { TmdbGenre } from '../types'

interface GenreChipRowProps {
  genres: TmdbGenre[]
  selectedGenreId: number | null
  onSelect: (id: number | null) => void
}

export function GenreChipRow({ genres, selectedGenreId, onSelect }: GenreChipRowProps) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-neutral-400">Browse by genre</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {genres.map((genre) => {
          const selected = selectedGenreId === genre.id
          return (
            <button
              key={genre.id}
              onClick={() => onSelect(selected ? null : genre.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                selected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {genre.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

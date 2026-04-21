'use client'

import type { Reaction } from '@/lib/types'

interface Props {
  onReact: (r: Reaction) => void
}

const REACTIONS: { value: Reaction; emoji: string; label: string; color: string }[] = [
  { value: 'dislike', emoji: '👎', label: 'Dislike', color: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { value: 'meh', emoji: '😐', label: 'Meh', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { value: 'like', emoji: '👍', label: 'Like', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { value: 'love', emoji: '❤️', label: 'Love it', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
]

export default function ReactionButtons({ onReact }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
      {REACTIONS.map(r => (
        <button
          key={r.value}
          onClick={() => onReact(r.value)}
          className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all active:scale-95 ${r.color}`}
        >
          <span className="text-2xl">{r.emoji}</span>
          <span className="text-xs font-semibold text-gray-600">{r.label}</span>
        </button>
      ))}
    </div>
  )
}

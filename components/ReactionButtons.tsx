'use client'

import type { Reaction } from '@/lib/types'

interface Props {
  onReact: (r: Reaction) => void
}

const REACTIONS: { value: Reaction; emoji: string; label: string; accent: string }[] = [
  { value: 'dislike', emoji: '👎', label: 'Nope',    accent: 'border-red-500 hover:bg-red-500' },
  { value: 'meh',     emoji: '😐', label: 'Meh',     accent: 'border-ryobi-gray hover:bg-ryobi-gray' },
  { value: 'like',    emoji: '👍', label: 'Good',    accent: 'border-blue-500 hover:bg-blue-500' },
  { value: 'love',    emoji: '❤️', label: 'Love it', accent: 'border-ryobi-yellow hover:bg-ryobi-yellow hover:text-ryobi-black' },
]

export default function ReactionButtons({ onReact }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
      {REACTIONS.map(r => (
        <button
          key={r.value}
          onClick={() => onReact(r.value)}
          className={`flex flex-col items-center gap-1 py-3 bg-ryobi-dark border-2 text-white transition-all active:scale-95 ${r.accent}`}
        >
          <span className="text-2xl">{r.emoji}</span>
          <span className="ryobi-heading text-xs">{r.label}</span>
        </button>
      ))}
    </div>
  )
}

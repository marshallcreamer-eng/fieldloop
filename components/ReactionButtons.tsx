'use client'

import type { Reaction } from '@/lib/types'

interface Props {
  onReact: (r: Reaction) => void
}

const REACTIONS: { value: Reaction; label: string; sub: string; icon: string; style: string }[] = [
  { value: 'dislike', icon: '✕', label: 'PASS',     sub: 'Not for me',      style: 'border-red-500/40 hover:bg-red-500 hover:border-red-500 text-red-400 hover:text-white' },
  { value: 'meh',     icon: '—', label: 'NEUTRAL',  sub: 'It\'s okay',      style: 'border-white/20 hover:bg-white/10 hover:border-white/40 text-white/50 hover:text-white' },
  { value: 'like',    icon: '✓', label: 'GOOD',     sub: 'Works well',      style: 'border-blue-500/40 hover:bg-blue-500 hover:border-blue-500 text-blue-400 hover:text-white' },
  { value: 'love',    icon: '★', label: 'LOVE IT',  sub: 'Outstanding',     style: 'border-ryobi-yellow/60 hover:bg-ryobi-yellow hover:border-ryobi-yellow text-ryobi-yellow hover:text-ryobi-black' },
]

export default function ReactionButtons({ onReact }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
      {REACTIONS.map(r => (
        <button
          key={r.value}
          onClick={() => onReact(r.value)}
          className={`flex flex-col items-center justify-center gap-1 py-4 bg-ryobi-dark border-2 transition-all duration-150 active:scale-95 ${r.style}`}
        >
          <span className="text-xl font-black leading-none">{r.icon}</span>
          <span className="ryobi-heading text-xs tracking-widest">{r.label}</span>
          <span className="text-[9px] opacity-60 leading-none">{r.sub}</span>
        </button>
      ))}
    </div>
  )
}

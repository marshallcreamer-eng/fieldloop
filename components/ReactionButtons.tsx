'use client'

import type { Reaction } from '@/lib/types'

export interface ImpressionScore {
  score: number    // 1–5
  reaction: Reaction  // mapped for DB storage
}

const SCALE: {
  score: number
  label: string
  sub: string
  reaction: Reaction
  border: string
  hoverBg: string
  activeText: string
  activeBg: string
  dot: string
}[] = [
  {
    score: 1,
    label: 'Works Poorly',
    sub: 'Significant issues — failed to meet basic needs',
    reaction: 'dislike',
    border: 'border-red-500/40',
    hoverBg: 'hover:bg-red-500/15 hover:border-red-500',
    activeText: 'text-red-400',
    activeBg: 'bg-red-500/20 border-red-500 text-red-300',
    dot: 'bg-red-500',
  },
  {
    score: 2,
    label: 'Below Expectations',
    sub: 'Some value, but fell short in important areas',
    reaction: 'meh',
    border: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/10 hover:border-amber-500/60',
    activeText: 'text-amber-400',
    activeBg: 'bg-amber-500/15 border-amber-500/70 text-amber-300',
    dot: 'bg-amber-500',
  },
  {
    score: 3,
    label: 'Met Expectations',
    sub: 'Did what it was supposed to — nothing more',
    reaction: 'like',
    border: 'border-white/20',
    hoverBg: 'hover:bg-white/8 hover:border-white/40',
    activeText: 'text-white',
    activeBg: 'bg-white/10 border-white/50 text-white',
    dot: 'bg-white/60',
  },
  {
    score: 4,
    label: 'Exceeded Expectations',
    sub: 'Better than expected in at least one meaningful way',
    reaction: 'like',
    border: 'border-ryobi-yellow/30',
    hoverBg: 'hover:bg-ryobi-yellow/10 hover:border-ryobi-yellow/60',
    activeText: 'text-ryobi-yellow',
    activeBg: 'bg-ryobi-yellow/15 border-ryobi-yellow/70 text-ryobi-yellow',
    dot: 'bg-ryobi-yellow/80',
  },
  {
    score: 5,
    label: 'Outstanding',
    sub: 'Set a new standard — I\'d recommend this to colleagues',
    reaction: 'love',
    border: 'border-ryobi-yellow/50',
    hoverBg: 'hover:bg-ryobi-yellow hover:border-ryobi-yellow hover:text-ryobi-black',
    activeText: 'text-ryobi-black',
    activeBg: 'bg-ryobi-yellow border-ryobi-yellow text-ryobi-black',
    dot: 'bg-ryobi-yellow',
  },
]

interface Props {
  onReact: (impression: ImpressionScore) => void
  selected?: number | null
}

export default function ReactionButtons({ onReact, selected }: Props) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
      {SCALE.map(s => {
        const isSelected = selected === s.score
        return (
          <button
            key={s.score}
            onClick={() => onReact({ score: s.score, reaction: s.reaction })}
            className={`flex items-center gap-4 px-4 py-3 border-2 bg-ryobi-dark transition-all duration-150 active:scale-[0.98] text-left group
              ${isSelected ? s.activeBg : `${s.border} ${s.hoverBg} text-white/70`}`}
          >
            {/* Score number */}
            <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center border font-black text-sm transition-colors
              ${isSelected ? 'border-current bg-black/20' : 'border-white/20 text-white/50 group-hover:border-current'}`}>
              {s.score}
            </div>

            {/* Color dot */}
            <div className={`w-2 h-2 flex-shrink-0 rounded-full ${s.dot} opacity-80`} />

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <div className={`ryobi-heading text-sm tracking-wide transition-colors
                ${isSelected ? '' : 'text-white group-hover:text-white'}`}>
                {s.label}
              </div>
              <div className={`text-xs mt-0.5 leading-snug transition-colors
                ${isSelected ? 'opacity-80' : 'text-white/45 group-hover:text-white/65'}`}>
                {s.sub}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

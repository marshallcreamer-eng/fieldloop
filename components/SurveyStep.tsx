'use client'

import { useState } from 'react'
import type { SurveyQuestion } from '@/lib/types'

interface Props {
  question: SurveyQuestion
  onAnswer: (score: number, followUp?: string) => void
}

export default function SurveyStep({ question, onAnswer }: Props) {
  const [selected, setSelected]   = useState<number | null>(null)
  const [followUp, setFollowUp]   = useState('')
  const [showFollowUp, setShowFollowUp] = useState(false)

  const isNPS = question.scale === 'nps'

  function handleSelect(score: number) {
    setSelected(score)
    if (isNPS) {
      setShowFollowUp(true)
    } else {
      setTimeout(() => onAnswer(score), 280)
    }
  }

  function submitNPS() {
    if (selected === null) return
    onAnswer(selected, followUp || undefined)
  }

  function npsFollowUpPrompt(score: number): string {
    if (score >= 9) return 'What did you love most about this product?'
    if (score >= 7) return 'What would move your score one point higher?'
    return 'What was missing or disappointing?'
  }

  if (isNPS) {
    const scores = Array.from({ length: 11 }, (_, i) => i)
    return (
      <div className="w-full">
        <p className="text-white font-semibold text-lg mb-1 leading-snug text-center">{question.text}</p>
        <p className="text-white/35 text-xs text-center mb-6 uppercase tracking-widest">
          Tap to select — lower scores fill automatically
        </p>

        {/* NPS row: all 11 on one row */}
        <div className="grid grid-cols-11 gap-1 mb-2">
          {scores.map(s => {
            const filled = selected !== null && s <= selected
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={`aspect-square w-full flex items-center justify-center text-xs font-black transition-all duration-100 active:scale-90 border
                  ${filled
                    ? 'bg-ryobi-yellow border-ryobi-yellow text-ryobi-black'
                    : 'bg-ryobi-dark border-white/10 text-white/40 hover:border-white/30'
                  }`}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Anchor labels */}
        <div className="flex justify-between text-[10px] text-white/30 px-0.5 mb-5 uppercase tracking-widest">
          <span>{question.anchor_low}</span>
          <span>{question.anchor_high}</span>
        </div>

        {/* Conditional follow-up */}
        {showFollowUp && selected !== null && (
          <div className="border-t border-white/10 pt-5 space-y-3">
            <p className="text-white text-sm font-semibold leading-snug">{npsFollowUpPrompt(selected)}</p>
            <textarea
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              placeholder="Optional — your answer helps the engineering team..."
              className="w-full h-20 bg-black/40 border border-white/15 focus:border-ryobi-yellow text-white placeholder-white/20 p-3 text-sm resize-none focus:outline-none transition-colors"
            />
            <button
              onClick={submitNPS}
              className="w-full py-3 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-sm tracking-widest hover:bg-white transition-colors active:scale-[0.99]"
            >
              CONTINUE →
            </button>
          </div>
        )}
      </div>
    )
  }

  // 7-point Likert — horizontal battery-cell fill
  const scores = [1, 2, 3, 4, 5, 6, 7]

  function cellColor(s: number): { filled: string; empty: string } {
    const pct = (s - 1) / 6
    if (pct <= 0.28) return { filled: 'bg-red-500 border-red-500 text-white',    empty: 'border-red-500/20 text-red-500/40' }
    if (pct <= 0.55) return { filled: 'bg-amber-400 border-amber-400 text-black', empty: 'border-amber-400/20 text-amber-400/40' }
    return { filled: 'bg-ryobi-yellow border-ryobi-yellow text-ryobi-black',       empty: 'border-ryobi-yellow/20 text-ryobi-yellow/30' }
  }

  return (
    <div className="w-full">
      <p className="text-white font-semibold text-lg mb-1 leading-snug text-center">{question.text}</p>
      <p className="text-white/35 text-xs text-center mb-6 uppercase tracking-widest">
        {question.anchor_low} → {question.anchor_high}
      </p>

      {/* 7 cells in a row — all left of selected fill in */}
      <div className="grid grid-cols-7 gap-1.5">
        {scores.map(s => {
          const filled  = selected !== null && s <= selected
          const colors  = cellColor(s)
          const isSelected = selected === s
          return (
            <button
              key={s}
              onClick={() => {
                setSelected(s)
                setTimeout(() => onAnswer(s), 300)
              }}
              className={`relative aspect-square w-full flex items-center justify-center font-black text-sm transition-all duration-100 active:scale-90 border-2
                ${filled ? colors.filled : `bg-ryobi-dark ${colors.empty}`}
                ${isSelected ? 'scale-105 shadow-[0_0_12px_rgba(225,231,35,0.4)]' : ''}
              `}
            >
              {s}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between text-[10px] text-white/25 mt-3 px-0.5 uppercase tracking-widest">
        <span>{question.anchor_low}</span>
        <span>{question.anchor_high}</span>
      </div>
    </div>
  )
}

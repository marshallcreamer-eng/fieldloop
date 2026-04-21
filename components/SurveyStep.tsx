'use client'

import { useState } from 'react'
import type { SurveyQuestion } from '@/lib/types'

interface Props {
  question: SurveyQuestion
  onAnswer: (score: number) => void
}

export default function SurveyStep({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const isNPS = question.scale === 'nps'
  const max   = isNPS ? 10 : 7
  const scores = Array.from({ length: max + (isNPS ? 1 : 0) }, (_, i) => i + (isNPS ? 0 : 1))

  function handleSelect(score: number) {
    setSelected(score)
    setTimeout(() => onAnswer(score), 260)
  }

  // colour per position on scale
  function getColor(score: number): 'red' | 'amber' | 'green' {
    const pct = isNPS ? score / 10 : (score - 1) / 6
    if (pct <= 0.28) return 'red'
    if (pct <= 0.55) return 'amber'
    return 'green'
  }

  const colorStyles = {
    red:   { idle: 'border-red-500/30 text-red-400',   active: 'bg-red-500 border-red-500 text-white' },
    amber: { idle: 'border-amber-400/30 text-amber-400', active: 'bg-amber-400 border-amber-400 text-black' },
    green: { idle: 'border-ryobi-yellow/40 text-ryobi-yellow', active: 'bg-ryobi-yellow border-ryobi-yellow text-ryobi-black' },
  }

  return (
    <div className="w-full">
      <p className="text-white font-semibold text-lg mb-2 leading-snug text-center">
        {question.text}
      </p>
      <p className="text-white/40 text-xs text-center mb-6 uppercase tracking-widest">
        {isNPS ? '0 = not at all · 10 = extremely likely' : '1 = strongly disagree · 7 = strongly agree'}
      </p>

      {isNPS ? (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-1.5">
            {scores.slice(0, 6).map(s => <ScoreBtn key={s} score={s} selected={selected} onSelect={handleSelect} styles={colorStyles[getColor(s)]} />)}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {scores.slice(6).map(s => <ScoreBtn key={s} score={s} selected={selected} onSelect={handleSelect} styles={colorStyles[getColor(s)]} />)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {scores.map(s => <ScoreBtn key={s} score={s} selected={selected} onSelect={handleSelect} styles={colorStyles[getColor(s)]} />)}
        </div>
      )}

      <div className="flex justify-between text-xs text-white/30 mt-3 px-0.5">
        <span>{question.anchor_low}</span>
        <span>{question.anchor_high}</span>
      </div>
    </div>
  )
}

function ScoreBtn({ score, selected, onSelect, styles }: {
  score: number
  selected: number | null
  onSelect: (s: number) => void
  styles: { idle: string; active: string }
}) {
  const isActive = selected === score
  return (
    <button
      onClick={() => onSelect(score)}
      className={`aspect-square w-full border-2 font-black text-sm transition-all duration-150 active:scale-90 flex items-center justify-center
        ${isActive ? styles.active : `bg-ryobi-dark ${styles.idle} hover:border-opacity-60`}`}
    >
      {score}
    </button>
  )
}

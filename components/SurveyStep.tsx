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
  const max = isNPS ? 10 : 7
  const scores = Array.from({ length: max + (isNPS ? 1 : 0) }, (_, i) => i + (isNPS ? 0 : 1))

  function handleSelect(score: number) {
    setSelected(score)
    setTimeout(() => onAnswer(score), 280)
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <p className="text-center text-gray-800 font-semibold text-lg mb-6 leading-snug px-2">
        {question.text}
      </p>

      {isNPS ? (
        <div>
          <div className="grid grid-cols-6 gap-1.5">
            {scores.slice(0, 6).map(s => (
              <ScoreButton key={s} score={s} selected={selected} onSelect={handleSelect}
                color={s <= 6 ? 'red' : s <= 8 ? 'yellow' : 'green'} />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 mt-1.5">
            {scores.slice(6).map(s => (
              <ScoreButton key={s} score={s} selected={selected} onSelect={handleSelect}
                color={s <= 6 ? 'red' : s <= 8 ? 'yellow' : 'green'} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>{question.anchor_low}</span>
            <span>{question.anchor_high}</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex gap-2 justify-center">
            {scores.map(s => (
              <ScoreButton key={s} score={s} selected={selected} onSelect={handleSelect}
                color={s <= 2 ? 'red' : s <= 4 ? 'yellow' : s <= 5 ? 'blue' : 'green'} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>{question.anchor_low}</span>
            <span>{question.anchor_high}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreButton({
  score, selected, onSelect, color
}: {
  score: number
  selected: number | null
  onSelect: (s: number) => void
  color: 'red' | 'yellow' | 'blue' | 'green'
}) {
  const colorMap = {
    red: 'bg-red-100 text-red-700 border-red-200 data-[active=true]:bg-red-500 data-[active=true]:text-white data-[active=true]:border-red-500',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 data-[active=true]:bg-yellow-500 data-[active=true]:text-white data-[active=true]:border-yellow-500',
    blue: 'bg-blue-100 text-blue-700 border-blue-200 data-[active=true]:bg-blue-500 data-[active=true]:text-white data-[active=true]:border-blue-500',
    green: 'bg-green-100 text-green-700 border-green-200 data-[active=true]:bg-green-500 data-[active=true]:text-white data-[active=true]:border-green-500',
  }

  return (
    <button
      data-active={selected === score}
      onClick={() => onSelect(score)}
      className={`w-10 h-10 rounded-xl border-2 font-bold text-sm transition-all duration-150 active:scale-95 ${colorMap[color]}`}
    >
      {score}
    </button>
  )
}

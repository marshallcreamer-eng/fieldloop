'use client'

import { useState } from 'react'

interface Props {
  onComplete: (responses: string | null) => void
}

const QUESTIONS = [
  {
    key: 'task',
    prompt: 'What were you actually trying to accomplish — and did this tool help or hinder that?',
    sub: 'Focus on the job, not the tool. What were you building, cutting, or fixing?',
    placeholder: 'e.g. Cutting deck boards to length — tool kept up until the last section when the battery dropped off...',
  },
  {
    key: 'change',
    prompt: 'If you could change one thing about this tool, what would it be?',
    sub: 'Be as specific as possible. Small details matter.',
    placeholder: 'e.g. The chain tensioner is awkward to adjust with gloves on — needs a tool-free mechanism...',
  },
  {
    key: 'workaround',
    prompt: 'Did you work around any limitation of this tool today?',
    sub: 'Improvised solutions reveal unmet needs. Nothing is too small.',
    placeholder: 'e.g. Had to stop every 20 min to let it cool — would\'ve liked a heat warning light so I didn\'t lose track...',
  },
]

export default function FFEStep({ onComplete }: Props) {
  const [index, setIndex]       = useState(0)
  const [answers, setAnswers]   = useState<Record<string, string>>({})
  const current                 = QUESTIONS[index]

  function handleNext(answer: string) {
    const updated = { ...answers, [current.key]: answer }
    setAnswers(updated)

    if (index < QUESTIONS.length - 1) {
      setIndex(i => i + 1)
    } else {
      // Format all non-empty answers into a structured comment
      const parts = QUESTIONS
        .map(q => updated[q.key]?.trim())
        .filter(Boolean)
      onComplete(parts.length > 0 ? parts.join('\n\n') : null)
    }
  }

  function handleSkipAll() {
    onComplete(null)
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-sm mx-auto px-6 py-8 gap-5">

      {/* Header */}
      <div className="text-center">
        <div className="inline-block bg-ryobi-yellow/15 border border-ryobi-yellow/30 px-3 py-1 mb-3">
          <span className="text-ryobi-yellow text-xs font-bold uppercase tracking-widest">Research Questions</span>
        </div>
        <h2 className="ryobi-heading text-xl text-white tracking-widest leading-snug">
          {current.prompt}
        </h2>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">{current.sub}</p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`h-1.5 transition-all rounded-none ${
            i < index ? 'w-6 bg-ryobi-yellow' : i === index ? 'w-6 bg-ryobi-yellow' : 'w-3 bg-white/20'
          }`} />
        ))}
      </div>

      {/* Textarea */}
      <textarea
        key={current.key}
        defaultValue={answers[current.key] ?? ''}
        placeholder={current.placeholder}
        onChange={e => setAnswers(prev => ({ ...prev, [current.key]: e.target.value }))}
        className="w-full h-32 bg-ryobi-dark border-2 border-white/10 focus:border-ryobi-yellow text-white placeholder-white/20 p-4 text-sm resize-none focus:outline-none transition-colors leading-relaxed"
        autoFocus
      />

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => handleNext(answers[current.key] ?? '')}
          className="w-full py-4 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-sm tracking-widest hover:bg-white transition-colors active:scale-[0.99]">
          {index < QUESTIONS.length - 1 ? 'NEXT QUESTION →' : 'SUBMIT FEEDBACK'}
        </button>
        <button
          onClick={() => handleNext('')}
          className="w-full py-3 text-white/50 text-sm hover:text-white/75 transition-colors uppercase tracking-widest">
          Skip this question
        </button>
        {index === 0 && (
          <button onClick={handleSkipAll} className="w-full py-2 text-white/35 text-xs hover:text-white/55 transition-colors uppercase tracking-widest">
            Skip all research questions
          </button>
        )}
      </div>

    </div>
  )
}

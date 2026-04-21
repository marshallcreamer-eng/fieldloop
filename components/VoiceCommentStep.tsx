'use client'

import { useState, useRef, useEffect } from 'react'
import type { Reaction, FeedbackCategory } from '@/lib/types'

interface Props {
  comment: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSkip: () => void
  submitting: boolean
  reaction?: Reaction | null
  category?: FeedbackCategory | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

function getPrompt(reaction?: Reaction | null, category?: FeedbackCategory | null): { title: string; placeholder: string } {
  if (reaction === 'dislike' || reaction === 'meh') {
    const map: Partial<Record<FeedbackCategory, { title: string; placeholder: string }>> = {
      battery:     { title: 'What happened with the battery?',         placeholder: 'e.g. Runtime dropped sharply after about 20 minutes on the second cut...' },
      performance: { title: 'Where did performance fall short?',       placeholder: 'e.g. Motor felt sluggish cutting through 2× hardwood, had to slow down significantly...' },
      ergonomics:  { title: 'What felt uncomfortable or awkward?',     placeholder: 'e.g. Handle grip got slippery after 30 min in the heat, had to readjust grip constantly...' },
      safety:      { title: 'Describe the safety concern you saw.',    placeholder: 'e.g. Kickback guard released unexpectedly when repositioning, gave me a scare...' },
      design:      { title: 'What quality issue did you notice?',      placeholder: 'e.g. Chain tension loosened after about an hour — had to retighten twice mid-job...' },
    }
    return map[category ?? 'other'] ?? {
      title: 'What didn\'t work the way you expected?',
      placeholder: 'Describe the specific moment — the more detail, the more useful for the engineering team...',
    }
  }
  if (reaction === 'love') {
    return {
      title: 'What specifically impressed you?',
      placeholder: 'e.g. Startup was instant every time — no hesitation even in 90°F heat. Completely changed my workflow...',
    }
  }
  return {
    title: 'Anything specific to add?',
    placeholder: 'e.g. Describe a moment that stood out — good or bad. The more specific, the better...',
  }
}

export default function VoiceCommentStep({ comment, onChange, onSubmit, onSkip, submitting, reaction, category }: Props) {
  const [listening, setListening]   = useState(false)
  const [supported, setSupported]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const recognitionRef              = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    setSupported(!!SR)
  }, [])

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setError(null)
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    const base = comment

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' '
      }
      if (final) onChange((base + ' ' + final).trim() + ' ')
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') setError('Microphone access denied.')
      else if (event.error !== 'aborted') setError('Voice input error.')
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const prompt = getPrompt(reaction, category)

  return (
    <div className="flex-1 flex flex-col w-full max-w-sm mx-auto px-6 py-8 gap-5">

      <div className="text-center">
        <h2 className="ryobi-heading text-2xl text-white tracking-widest mb-2">{prompt.title}</h2>
        <p className="text-white/65 text-sm">Optional — type or hold the mic to speak</p>
      </div>

      <div className="relative flex-1 min-h-0">
        <textarea
          value={comment}
          onChange={e => onChange(e.target.value)}
          placeholder={prompt.placeholder}
          className="w-full h-36 bg-ryobi-dark border-2 border-white/10 focus:border-ryobi-yellow text-white placeholder-white/25 p-4 text-sm resize-none focus:outline-none transition-colors leading-relaxed"
        />
        {listening && (
          <div className="absolute inset-0 border-2 border-red-500 pointer-events-none animate-pulse" />
        )}
      </div>

      {supported && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onPointerDown={startListening}
            onPointerUp={stopListening}
            onPointerLeave={stopListening}
            className={`w-16 h-16 flex items-center justify-center transition-all active:scale-95
              ${listening
                ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                : 'bg-ryobi-dark border-2 border-white/20 hover:border-ryobi-yellow'
              }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={listening ? 'white' : '#77787B'}>
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
              <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z"/>
            </svg>
          </button>
          <span className="text-sm text-white/65 uppercase tracking-widest">
            {listening ? '● Recording — release to stop' : 'Hold to speak'}
          </span>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      )}

      <div className="space-y-2">
        <button onClick={onSubmit} disabled={submitting}
          className="w-full py-4 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-lg tracking-widest hover:bg-white transition-colors disabled:opacity-50 active:scale-[0.99]">
          {submitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
        </button>
        <button onClick={onSkip} disabled={submitting}
          className="w-full py-3 text-white/60 text-sm uppercase tracking-widest hover:text-white transition-colors">
          Skip and submit without comment
        </button>
      </div>

    </div>
  )
}

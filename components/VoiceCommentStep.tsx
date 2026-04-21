'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  comment: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSkip: () => void
  submitting: boolean
}

// Web Speech API types
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

export default function VoiceCommentStep({ comment, onChange, onSubmit, onSkip, submitting }: Props) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const interimRef = useRef('')

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

    const baseText = comment

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }
      interimRef.current = interim
      // Append finalized speech to whatever was already typed
      if (final) {
        onChange((baseText + ' ' + final).trim() + ' ')
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow access in your browser.')
      } else if (event.error !== 'aborted') {
        setError('Voice input error. Try again.')
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      interimRef.current = ''
    }

    recognition.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 w-full">
      <h2 className="text-xl font-bold text-gray-800 text-center">Anything else to add?</h2>
      <p className="text-gray-500 text-sm text-center">
        Type below, or tap the mic to speak your comment.
      </p>

      <div className="w-full max-w-sm relative">
        <textarea
          value={comment}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. Grip gets slippery after 30 min in humid conditions..."
          className="w-full h-32 p-4 pr-14 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none resize-none text-sm text-gray-700 transition-colors"
        />

        {/* Mic button inside the textarea */}
        {supported && (
          <button
            type="button"
            onPointerDown={startListening}
            onPointerUp={stopListening}
            onPointerLeave={stopListening}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95
              ${listening
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                : 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-500'
              }`}
            title="Hold to speak"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
              <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Status line */}
      <div className="h-5 flex items-center justify-center">
        {listening && (
          <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Listening... release to stop
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
        {!listening && !error && supported && (
          <span className="text-xs text-gray-400">Hold mic button to speak</span>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full max-w-sm py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
      <button
        onClick={onSkip}
        disabled={submitting}
        className="text-gray-400 text-sm underline"
      >
        Skip and submit
      </button>
    </div>
  )
}

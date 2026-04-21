'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeCard from '@/components/SwipeCard'
import ReactionButtons from '@/components/ReactionButtons'
import SurveyStep from '@/components/SurveyStep'
import VoiceCommentStep from '@/components/VoiceCommentStep'
import { SURVEY_QUESTIONS } from '@/lib/types'
import type { Product, Reaction, FeedbackCategory } from '@/lib/types'

type Step = 'swipe' | 'category' | 'comment' | 'survey' | 'done'

interface Props {
  product: Product
  assignmentId: string
  testerId: string
}

const CATEGORIES: { value: FeedbackCategory; label: string; icon: string }[] = [
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'ergonomics',  label: 'Ergonomics',  icon: '🤲' },
  { value: 'battery',     label: 'Battery',     icon: '🔋' },
  { value: 'safety',      label: 'Safety',      icon: '🦺' },
  { value: 'design',      label: 'Design',      icon: '✏️' },
  { value: 'other',       label: 'Other',       icon: '💬' },
]

export default function FeedbackFlow({ product, assignmentId, testerId }: Props) {
  const [step, setStep]               = useState<Step>('swipe')
  const [reaction, setReaction]       = useState<Reaction | null>(null)
  const [category, setCategory]       = useState<FeedbackCategory | null>(null)
  const [surveyIndex, setSurveyIndex] = useState(0)
  const [surveyScores, setSurveyScores] = useState<Record<string, number>>({})
  const [comment, setComment]         = useState('')
  const [submitting, setSubmitting]   = useState(false)

  function handleReaction(r: Reaction) {
    setReaction(r)
    setStep('category')
  }

  function handleCategory(c: FeedbackCategory) {
    setCategory(c)
    setSurveyIndex(0)
    setStep('survey')
  }

  function handleSurveyAnswer(score: number) {
    const q = SURVEY_QUESTIONS[surveyIndex]
    const updated = { ...surveyScores, [q.key]: score }
    setSurveyScores(updated)
    if (surveyIndex < SURVEY_QUESTIONS.length - 1) {
      setSurveyIndex(i => i + 1)
    } else {
      setStep('comment')
    }
  }

  async function handleSubmit() {
    if (!reaction || !category) return
    setSubmitting(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignmentId,
        tester_id: testerId,
        product_id: product.id,
        reaction,
        category,
        comment: comment || null,
        media_urls: [],
        session_date: new Date().toISOString().split('T')[0],
        survey_scores: surveyScores,
      }),
    })
    setStep('done')
    setSubmitting(false)
  }

  const stepLabels: Record<Step, string> = {
    swipe:    'Rate this product',
    category: 'What stood out?',
    survey:   `Survey ${surveyIndex + 1} of ${SURVEY_QUESTIONS.length}`,
    comment:  'Leave a comment',
    done:     'Done',
  }

  return (
    <div className="min-h-screen bg-ryobi-black flex flex-col">

      {/* Header */}
      <div className="bg-ryobi-black border-b-4 border-ryobi-yellow sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/tester" className="text-ryobi-gray text-lg leading-none hover:text-white transition-colors">‹</a>
          <div className="bg-ryobi-yellow px-2 py-0.5">
            <span className="ryobi-heading text-ryobi-black text-sm font-black tracking-widest">RYOBI</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-ryobi-gray text-xs uppercase tracking-widest">{stepLabels[step]}</div>
            <div className="text-white text-xs font-semibold truncate">{product.name}</div>
          </div>
          <a href="/dashboard" className="text-ryobi-gray text-xs uppercase tracking-widest hover:text-ryobi-yellow transition-colors font-semibold hidden sm:block">
            Dashboard
          </a>
        </div>

        {/* Progress bar */}
        {step !== 'done' && (
          <div className="h-0.5 bg-ryobi-muted">
            <div className="h-full bg-ryobi-yellow transition-all duration-500"
              style={{ width: step === 'swipe' ? '20%' : step === 'category' ? '40%' : step === 'survey' ? `${40 + ((surveyIndex + 1) / SURVEY_QUESTIONS.length) * 40}%` : '90%' }} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* SWIPE */}
        {step === 'swipe' && (
          <motion.div key="swipe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
            <p className="text-ryobi-gray text-sm text-center uppercase tracking-widest">Drag the card or tap a reaction</p>
            <SwipeCard product={product} onSwipe={handleReaction} />
            <div className="mt-10 w-full max-w-sm">
              <ReactionButtons onReact={handleReaction} />
            </div>
          </motion.div>
        )}

        {/* CATEGORY */}
        {step === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
            <h2 className="ryobi-heading text-2xl text-white text-center tracking-widest">What stood out most?</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => handleCategory(c.value)}
                  className="flex items-center gap-3 p-4 bg-ryobi-dark border-2 border-ryobi-muted hover:border-ryobi-yellow hover:bg-black transition-all active:scale-95 text-left">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="ryobi-heading text-sm text-white">{c.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* SURVEY */}
        {step === 'survey' && (
          <motion.div key={`survey-${surveyIndex}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
            <div className="w-full max-w-sm bg-ryobi-dark border border-ryobi-muted p-6">
              <SurveyStep question={SURVEY_QUESTIONS[surveyIndex]} onAnswer={handleSurveyAnswer} />
            </div>
            {/* Dot indicators */}
            <div className="flex gap-2">
              {SURVEY_QUESTIONS.map((_, i) => (
                <div key={i} className={`w-2 h-2 transition-all ${i < surveyIndex ? 'bg-ryobi-yellow' : i === surveyIndex ? 'bg-ryobi-yellow scale-125' : 'bg-ryobi-muted'}`} />
              ))}
            </div>
          </motion.div>
        )}

        {/* COMMENT */}
        {step === 'comment' && (
          <motion.div key="comment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center w-full">
            <VoiceCommentStep
              comment={comment}
              onChange={setComment}
              onSubmit={handleSubmit}
              onSkip={handleSubmit}
              submitting={submitting}
            />
          </motion.div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-5">
            <div className="bg-ryobi-yellow w-20 h-20 flex items-center justify-center text-4xl">✓</div>
            <div>
              <h2 className="ryobi-heading text-3xl text-white tracking-widest">Submitted</h2>
              <p className="text-ryobi-gray text-sm mt-2 max-w-xs leading-relaxed">
                Your feedback on the <span className="text-white font-semibold">{product.name}</span> has been recorded. The engineering team will review it.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <a href="/tester"
                className="py-3 px-6 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-sm uppercase tracking-widest hover:bg-white transition-colors text-center">
                Rate Another Product →
              </a>
              <a href="/dashboard"
                className="py-3 px-6 bg-ryobi-dark border border-ryobi-muted text-ryobi-gray font-semibold text-xs uppercase tracking-widest hover:border-ryobi-yellow hover:text-white transition-colors text-center">
                View Research Dashboard
              </a>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

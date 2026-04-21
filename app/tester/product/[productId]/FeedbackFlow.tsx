'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeCard from '@/components/SwipeCard'
import ReactionButtons from '@/components/ReactionButtons'
import SurveyStep from '@/components/SurveyStep'
import VoiceCommentStep from '@/components/VoiceCommentStep'
import { SURVEY_QUESTIONS } from '@/lib/types'
import type { Product, Reaction, FeedbackCategory } from '@/lib/types'

type Step = 'swipe' | 'category' | 'survey' | 'comment' | 'done'

interface Props {
  product: Product
  assignmentId: string
  testerId: string
}

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: 'performance', label: 'Performance', emoji: '⚡' },
  { value: 'ergonomics', label: 'Ergonomics', emoji: '🤲' },
  { value: 'battery', label: 'Battery', emoji: '🔋' },
  { value: 'safety', label: 'Safety', emoji: '🦺' },
  { value: 'design', label: 'Design', emoji: '✨' },
  { value: 'other', label: 'Other', emoji: '💬' },
]

export default function FeedbackFlow({ product, assignmentId, testerId }: Props) {
  const [step, setStep] = useState<Step>('swipe')
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const [category, setCategory] = useState<FeedbackCategory | null>(null)
  const [surveyIndex, setSurveyIndex] = useState(0)
  const [surveyScores, setSurveyScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">FL</div>
        <div>
          <div className="text-xs text-gray-400">Beta Testing</div>
          <div className="text-sm font-semibold text-gray-800">{product.name}</div>
        </div>
        {step === 'survey' && (
          <div className="ml-auto text-xs text-gray-400">{surveyIndex + 1} / {SURVEY_QUESTIONS.length}</div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'swipe' && (
          <motion.div key="swipe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
            <p className="text-gray-500 text-sm text-center">Drag the card or tap a reaction below</p>
            <SwipeCard product={product} onSwipe={handleReaction} />
            <div className="mt-10 w-full">
              <ReactionButtons onReact={handleReaction} />
            </div>
          </motion.div>
        )}

        {step === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <h2 className="text-xl font-bold text-gray-800 text-center">What stood out most?</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => handleCategory(c.value)}
                  className="flex items-center gap-2 p-4 bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all active:scale-95 text-left">
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="font-semibold text-sm text-gray-700">{c.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'survey' && (
          <motion.div key={`survey-${surveyIndex}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <SurveyStep question={SURVEY_QUESTIONS[surveyIndex]} onAnswer={handleSurveyAnswer} />
            </div>
            <div className="flex gap-1.5">
              {SURVEY_QUESTIONS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= surveyIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          </motion.div>
        )}

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

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="text-7xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800">Thanks, {testerId.split('@')[0]}!</h2>
            <p className="text-gray-500 max-w-xs">Your feedback on the <strong>{product.name}</strong> has been recorded. The product team will review it.</p>
            <a href="/tester" className="mt-4 py-3 px-8 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
              Back to Products
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Hand, Battery, ShieldCheck, Ruler, MessageSquare, type LucideIcon } from 'lucide-react'
import DemoNav from '@/components/DemoNav'
import SwipeCard from '@/components/SwipeCard'
import ReactionButtons from '@/components/ReactionButtons'
import SurveyStep from '@/components/SurveyStep'
import VoiceCommentStep from '@/components/VoiceCommentStep'
import { SURVEY_QUESTIONS } from '@/lib/types'
import { TASK_TYPES, CONDITIONS } from '@/lib/fieldContext'
import type { Product, Reaction, FeedbackCategory } from '@/lib/types'

type Step = 'swipe' | 'category' | 'context' | 'survey' | 'comment' | 'done'

interface Props {
  product: Product
  assignmentId: string
  testerId: string
}

const CATEGORIES: { value: FeedbackCategory; label: string; sub: string; Icon: LucideIcon }[] = [
  { value: 'performance', label: 'Performance',   sub: 'Power, speed & output',         Icon: Zap },
  { value: 'ergonomics',  label: 'Ergonomics',    sub: 'Grip, weight & handling',        Icon: Hand },
  { value: 'battery',     label: 'Battery Life',  sub: 'Runtime & charge time',          Icon: Battery },
  { value: 'safety',      label: 'Safety',        sub: 'Guards, warnings & kickback',    Icon: ShieldCheck },
  { value: 'design',      label: 'Build Quality', sub: 'Materials & construction',       Icon: Ruler },
  { value: 'other',       label: 'Other',         sub: 'Anything else',                  Icon: MessageSquare },
]

export default function FeedbackFlow({ product, assignmentId, testerId }: Props) {
  const [step, setStep]                 = useState<Step>('swipe')
  const [reaction, setReaction]         = useState<Reaction | null>(null)
  const [category, setCategory]         = useState<FeedbackCategory | null>(null)
  const [taskType, setTaskType]         = useState<number | null>(null)
  const [activeConditions, setActiveConditions] = useState<Set<string>>(new Set())
  const [surveyIndex, setSurveyIndex]   = useState(0)
  const [surveyScores, setSurveyScores] = useState<Record<string, number>>({})
  const [comment, setComment]           = useState('')
  const [npsFollowUp, setNpsFollowUp]   = useState('')
  const [submitting, setSubmitting]     = useState(false)

  function handleReaction(r: Reaction) {
    setReaction(r)
    setStep('category')
  }

  function handleCategory(c: FeedbackCategory) {
    setCategory(c)
    setStep('context')
  }

  function handleContextNext() {
    setSurveyIndex(0)
    setStep('survey')
  }

  function toggleCondition(key: string) {
    setActiveConditions(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSurveyAnswer(score: number, followUp?: string) {
    const q = SURVEY_QUESTIONS[surveyIndex]
    const updated = { ...surveyScores, [q.key]: score }
    setSurveyScores(updated)
    if (followUp) setNpsFollowUp(followUp)
    if (surveyIndex < SURVEY_QUESTIONS.length - 1) {
      setSurveyIndex(i => i + 1)
    } else {
      setStep('comment')
    }
  }

  async function handleSubmit() {
    if (!reaction || !category) return
    setSubmitting(true)

    // Encode task type + conditions as survey scores
    const contextScores: Record<string, number> = {}
    if (taskType !== null) contextScores['task_type'] = taskType
    activeConditions.forEach(k => { contextScores[k] = 1 })

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: assignmentId,
        tester_id: testerId,
        product_id: product.id,
        reaction,
        category,
        comment: comment || npsFollowUp || null,
        media_urls: [],
        session_date: new Date().toISOString().split('T')[0],
        survey_scores: { ...surveyScores, ...contextScores },
      }),
    })
    setStep('done')
    setSubmitting(false)
  }

  const totalSurveySteps = SURVEY_QUESTIONS.length
  const stepLabels: Record<Step, string> = {
    swipe:    'Rate this product',
    category: 'What stood out?',
    context:  'Field context',
    survey:   `Survey ${surveyIndex + 1} of ${totalSurveySteps}`,
    comment:  'Add a comment',
    done:     'Done',
  }

  function progressPct(): number {
    if (step === 'swipe')    return 15
    if (step === 'category') return 30
    if (step === 'context')  return 45
    if (step === 'survey')   return 45 + ((surveyIndex + 1) / totalSurveySteps) * 35
    if (step === 'comment')  return 88
    return 100
  }

  return (
    <div className="min-h-screen bg-ryobi-black flex flex-col">

      <DemoNav productName={product.name} />

      {/* Header */}
      <div className="bg-ryobi-black border-b-4 border-ryobi-yellow sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/tester" className="text-ryobi-gray text-lg leading-none hover:text-white transition-colors">‹</a>
          <div className="bg-ryobi-yellow px-2 py-0.5">
            <span className="ryobi-heading text-ryobi-black text-sm font-black tracking-widest">RYOBI</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/65 text-xs uppercase tracking-widest">{stepLabels[step]}</div>
            <div className="text-white text-sm font-semibold truncate">{product.name}</div>
          </div>
        </div>
        {step !== 'done' && (
          <div className="h-0.5 bg-ryobi-muted">
            <div className="h-full bg-ryobi-yellow transition-all duration-500"
              style={{ width: `${progressPct()}%` }} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* SWIPE */}
        {step === 'swipe' && (
          <motion.div key="swipe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8">
            <p className="text-white/65 text-sm text-center uppercase tracking-widest">Drag the card or tap a reaction</p>
            <SwipeCard product={product} onSwipe={handleReaction} />
            <div className="mt-10 w-full max-w-sm">
              <ReactionButtons onReact={handleReaction} />
            </div>
          </motion.div>
        )}

        {/* CATEGORY */}
        {step === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-5">
            <div className="text-center">
              <h2 className="ryobi-heading text-2xl text-white tracking-widest mb-1">What influenced your rating most?</h2>
              <p className="text-white/65 text-sm uppercase tracking-widest">Select the primary factor</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
              {CATEGORIES.map(c => {
                const { Icon } = c
                return (
                  <button key={c.value} onClick={() => handleCategory(c.value)}
                    className="flex flex-col gap-2 p-4 bg-ryobi-dark border border-white/10 hover:border-ryobi-yellow hover:bg-black/60 transition-all active:scale-95 text-left group">
                    <Icon size={18} className="text-ryobi-yellow/70 group-hover:text-ryobi-yellow transition-colors" />
                    <div>
                      <div className="ryobi-heading text-sm text-white tracking-wide">{c.label}</div>
                      <div className="text-white/60 text-xs mt-0.5 leading-snug">{c.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* CONTEXT */}
        {step === 'context' && (
          <motion.div key="context" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6 max-w-sm mx-auto w-full">

            {/* Task type */}
            <div className="w-full">
              <h2 className="ryobi-heading text-xl text-white tracking-widest mb-1 text-center">What were you doing?</h2>
              <p className="text-white/60 text-sm text-center mb-4">Select the task you were working on</p>
              <div className="grid grid-cols-2 gap-2">
                {TASK_TYPES.map(t => (
                  <button key={t.value} onClick={() => setTaskType(t.value)}
                    className={`py-3 px-4 text-sm font-semibold transition-all border active:scale-95 text-left
                      ${taskType === t.value
                        ? 'bg-ryobi-yellow text-ryobi-black border-ryobi-yellow'
                        : 'bg-ryobi-dark text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                      }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="w-full">
              <p className="text-white/65 text-sm font-semibold uppercase tracking-widest mb-3">Conditions <span className="font-normal text-white/40">(select all that apply)</span></p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map(c => (
                  <button key={c.key} onClick={() => toggleCondition(c.key)}
                    className={`px-3 py-2 text-sm font-semibold border transition-all active:scale-95
                      ${activeConditions.has(c.key)
                        ? 'bg-ryobi-yellow text-ryobi-black border-ryobi-yellow'
                        : 'bg-ryobi-dark text-white/65 border-white/15 hover:border-white/35 hover:text-white'
                      }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleContextNext}
              className="w-full py-4 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-sm tracking-widest hover:bg-white transition-colors active:scale-[0.99]">
              CONTINUE TO SURVEY →
            </button>
            <button onClick={handleContextNext} className="text-white/45 text-sm hover:text-white/70 transition-colors">
              Skip — proceed without context
            </button>
          </motion.div>
        )}

        {/* SURVEY */}
        {step === 'survey' && (
          <motion.div key={`survey-${surveyIndex}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
            <div className="w-full max-w-sm bg-ryobi-dark border border-ryobi-muted p-6">
              <SurveyStep question={SURVEY_QUESTIONS[surveyIndex]} onAnswer={handleSurveyAnswer} />
            </div>
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
              reaction={reaction}
              category={category}
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
              <p className="text-white/70 text-sm mt-2 max-w-xs leading-relaxed">
                Your feedback on the <span className="text-white font-semibold">{product.name}</span> has been recorded. The engineering team will review it.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <a href="/tester"
                className="py-3 px-6 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-sm uppercase tracking-widest hover:bg-white transition-colors text-center">
                Rate Another Product →
              </a>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

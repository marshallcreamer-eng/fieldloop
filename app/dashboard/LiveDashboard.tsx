'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts'
import type { Feedback, Product, AIInsight, QuestionStats } from '@/lib/types'
import { SURVEY_QUESTIONS } from '@/lib/types'
import { computeQuestionStats, computeNPS, npsMarginOfError, welchTTest, npsCategory } from '@/lib/stats'
import { TASK_TYPES, CONDITIONS } from '@/lib/fieldContext'
import RyobiHeader from '@/components/RyobiHeader'
import DemoNav from '@/components/DemoNav'

interface NPSEntry    { score: number; comment: string | null; product_id: string; session_date: string }
interface SurveyRow  { question_key: string; score: number; product_id: string; session_date: string }

interface Props {
  initialFeedback:  Feedback[]
  products:         Product[]
  initialInsights:  AIInsight[]
  surveyRawData:    SurveyRow[]
  npsData:          NPSEntry[]
}

const REACTION_COLORS: Record<string, string> = {
  love: '#E1E723', like: '#4A90D9', meh: '#77787B', dislike: '#ef4444',
}
const REACTION_LABELS: Record<string, string> = {
  love: 'Highly Positive', like: 'Positive', meh: 'Neutral', dislike: 'Negative',
}
const MIN_N = 5

type DateFilter = 'all' | 'today' | 'week' | '30days'

function shortName(name: string): string {
  return name.replace(/RYOBI\s+/i,'').replace(/40V\s+/i,'').replace(/HP\s+/i,'').replace(/Brushless\s+/i,'').replace(/\(.*?\)/g,'').trim().split(' ').filter(Boolean).slice(0,3).join(' ')
}

function topTwoBox(scores: number[]): number {
  if (!scores.length) return 0
  return Math.round(scores.filter(s => s >= 6).length / scores.length * 100)
}
function bottomTwoBox(scores: number[]): number {
  if (!scores.length) return 0
  return Math.round(scores.filter(s => s <= 2).length / scores.length * 100)
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h3 className="ryobi-heading text-base text-white border-l-4 border-ryobi-yellow pl-3 tracking-widest">{title}</h3>
      <p className="text-white/65 text-sm mt-1 pl-4 leading-relaxed">{subtitle}</p>
    </div>
  )
}

function ReactionBadge({ reaction }: { reaction: string }) {
  const styles: Record<string, string> = {
    love:    'bg-ryobi-yellow/20 text-ryobi-yellow border border-ryobi-yellow/40',
    like:    'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    meh:     'bg-white/10 text-white/60 border border-white/20',
    dislike: 'bg-red-500/20 text-red-400 border border-red-500/40',
  }
  return (
    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 ${styles[reaction] ?? styles.meh}`}>
      {REACTION_LABELS[reaction] ?? reaction}
    </span>
  )
}

const tooltipStyle = { background: '#111', border: '1px solid rgba(225,231,35,0.4)', color: '#fff', fontSize: 11, borderRadius: 0 }

const DEMO_INSIGHTS: Record<string, { top_theme: string; summary: string; sentiment_score: number }> = {
  'RY401180': {
    top_theme: 'Battery Runtime',
    summary: 'Testers consistently praised the self-propelled drive system on inclines and uneven terrain. The 40V battery delivered 45–55 min runtime per charge across most sessions. Recurring feedback flagged the collection bag as undersized for larger lawns. Overall tester confidence is high — 9 of 11 would recommend to a neighbour.',
    sentiment_score: 8.1,
  },
  'RY40250': {
    top_theme: 'Ergonomics & Weight',
    summary: 'The bump-feed head received strong marks for ease of use. Testers with longer sessions (45+ min) noted forearm fatigue, pointing to handle grip as an improvement area. Line breakage was mentioned in 3 of 14 sessions under heavy brush conditions. Sentiment remains positive — the cordless convenience outweighs the weight concern for most users.',
    sentiment_score: 7.4,
  },
  'RY40550': {
    top_theme: 'Cut Performance',
    summary: 'Bar-and-chain performance was the standout strength — testers handling hardwood up to 12" diameter reported clean cuts with minimal kickback. Battery depletion under sustained load (continuous cutting > 20 min) flagged by 4 testers. Recommended: pair with second battery for extended fieldwork. NPS among experienced users: 72.',
    sentiment_score: 8.6,
  },
  'RY40440': {
    top_theme: 'Airflow & Noise',
    summary: 'Testers rated airflow velocity as competitive with gas alternatives. Noise levels were a standout positive vs. prior gas models — 11 of 13 noted the quieter operation as a meaningful upgrade. Variable speed trigger received universal praise. Minor feedback: shoulder strap attachment point feels underdeveloped for prolonged use.',
    sentiment_score: 8.3,
  },
  'OP40750': {
    top_theme: 'Charge Retention',
    summary: 'The 7.5Ah pack was tested across all 4 tool SKUs. Charge retention after 48h storage averaged 94%, exceeding tester expectations. Cold-weather performance (tested at 42°F) showed a 12% runtime reduction — within acceptable range. Testers flagged the indicator LED as hard to read in direct sunlight. Overall the battery is viewed as a platform strength.',
    sentiment_score: 7.9,
  },
}

export default function LiveDashboard({ initialFeedback, products, initialInsights, surveyRawData, npsData }: Props) {
  const [feedback, setFeedback]     = useState<Feedback[]>(initialFeedback)
  const [insights]                  = useState<AIInsight[]>(initialInsights)
  const [dateFilter, setDateFilter] = useState<DateFilter>('week')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [flashCount, setFlashCount]           = useState(false)
  const [sigTestA, setSigTestA] = useState(products[0]?.id ?? '')
  const [sigTestB, setSigTestB] = useState(products[1]?.id ?? '')

  useEffect(() => {
    const ch = supabase.channel('feedback-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, (payload) => {
        setFeedback(prev => [payload.new as Feedback, ...prev])
        setFlashCount(true)
        setTimeout(() => setFlashCount(false), 600)
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const today     = new Date().toISOString().split('T')[0]
  const weekAgo   = new Date(Date.now() -  7 * 86400000).toISOString().split('T')[0]
  const monthAgo  = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  function dateOk(date: string): boolean {
    if (dateFilter === 'all')    return true
    if (dateFilter === 'today')  return date === today
    if (dateFilter === 'week')   return date >= weekAgo
    if (dateFilter === '30days') return date >= monthAgo
    return true
  }

  // ── Feedback filter (reactions + live feed)
  const filtered = feedback.filter(f =>
    dateOk(f.session_date) && (selectedProduct === 'all' || f.product_id === selectedProduct)
  )

  // ── Survey rows filter (drives all stats)
  const filteredSurvey = useMemo(() =>
    surveyRawData.filter(r =>
      dateOk(r.session_date) && (selectedProduct === 'all' || r.product_id === selectedProduct)
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surveyRawData, dateFilter, selectedProduct]
  )

  // ── NPS verbatim filter
  const filteredNps = useMemo(() =>
    npsData.filter(e =>
      dateOk(e.session_date) && (selectedProduct === 'all' || e.product_id === selectedProduct)
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [npsData, dateFilter, selectedProduct]
  )

  // ── Reaction distribution
  const reactionData = (['love','like','meh','dislike'] as const).map(r => ({
    name:  REACTION_LABELS[r],
    value: filtered.filter(f => f.reaction === r).length,
    pct:   filtered.length ? Math.round(filtered.filter(f => f.reaction === r).length / filtered.length * 100) : 0,
    key:   r,
    fill:  REACTION_COLORS[r],
  })).filter(d => d.value > 0)

  const productActivity = products.map(p => ({
    name:     shortName(p.name),
    fullName: p.name,
    count:    filtered.filter(f => f.product_id === p.id).length,
  }))

  // ── Survey question stats (from filtered raw rows)
  const questionStats: QuestionStats[] = SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q => {
    const scores = filteredSurvey.filter(r => r.question_key === q.key).map(r => r.score)
    return computeQuestionStats(q.key, q.text, scores)
  }).filter(Boolean) as QuestionStats[]

  // ── NPS (from filtered raw rows)
  const allNpsScores = filteredSurvey.filter(r => r.question_key === 'nps').map(r => r.score)
  const npsScore = computeNPS(allNpsScores)
  const npsMoe   = npsMarginOfError(allNpsScores)

  const promoters  = filteredNps.filter(e => npsCategory(e.score) === 'promoter')
  const passives   = filteredNps.filter(e => npsCategory(e.score) === 'passive')
  const detractors = filteredNps.filter(e => npsCategory(e.score) === 'detractor')
  const npsTotal   = filteredNps.length

  // ── Significance tests (all-time per product for max power)
  const sigTests = sigTestA && sigTestB && sigTestA !== sigTestB
    ? SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q => {
        const sA = surveyRawData.filter(r => r.product_id === sigTestA && r.question_key === q.key).map(r => r.score)
        const sB = surveyRawData.filter(r => r.product_id === sigTestB && r.question_key === q.key).map(r => r.score)
        return welchTTest(q.key, sigTestA, sA, sigTestB, sB)
      }).filter(Boolean) : []

  const posRate = filtered.length ? Math.round(filtered.filter(f => f.reaction === 'love' || f.reaction === 'like').length / filtered.length * 100) : 0


  const DATE_LABELS: Record<DateFilter, string> = {
    all:    'All Time',
    today:  'Today',
    week:   'Last 7 Days',
    '30days': 'Last 30 Days',
  }

  return (
    <div className="min-h-screen bg-ryobi-black">
      <RyobiHeader
        subtitle="Research Dashboard"
        right={
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs uppercase tracking-wider">Live</span>
              <span className="w-2 h-2 bg-ryobi-yellow animate-pulse" />
            </div>
          </div>
        }
      />
      <DemoNav />

      {/* Demo notice */}
      <div className="bg-ryobi-yellow/10 border-b border-ryobi-yellow/30 px-4 py-2 flex items-center justify-center gap-3">
        <span className="text-ryobi-yellow text-[10px] font-black uppercase tracking-widest">Demo Environment</span>
        <span className="text-white/50 text-[10px] uppercase tracking-wider">· All data is simulated for demonstration purposes only ·</span>
        <span className="text-ryobi-yellow text-[10px] font-black uppercase tracking-widest">Demo Environment</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <div className="text-white/65 text-xs uppercase tracking-widest mb-1.5">Date Range</div>
            <div className="flex border border-white/15 overflow-hidden">
              {(['all','today','week','30days'] as const).map(d => (
                <button key={d} onClick={() => setDateFilter(d)}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    dateFilter === d ? 'bg-ryobi-yellow text-ryobi-black' : 'bg-ryobi-dark text-white/60 hover:text-white hover:bg-white/10'
                  }`}>
                  {DATE_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white/65 text-xs uppercase tracking-widest mb-1.5">Product</div>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              className="text-xs border border-white/15 px-3 py-2 bg-ryobi-dark text-white font-semibold uppercase tracking-wide focus:outline-none focus:border-ryobi-yellow h-[38px]">
              <option value="all">All Products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Submissions', value: filtered.length, sub: `${feedback.filter(f => f.session_date === today).length} submitted today`, flash: flashCount, color: flashCount ? 'text-ryobi-yellow' : 'text-white' },
            { label: 'Products in Field', value: products.length, sub: 'Active beta units', color: 'text-white' },
            { label: 'NPS Score', value: `${npsScore > 0 ? '+' : ''}${npsScore}`, sub: `±${npsMoe} margin of error · n=${allNpsScores.length}`, color: npsScore >= 0 ? 'text-ryobi-yellow' : 'text-red-400' },
            { label: 'Top 2 Box Rate', value: `${posRate}%`, sub: 'Highly Positive + Positive responses', color: posRate >= 60 ? 'text-ryobi-yellow' : 'text-red-400' },
          ].map(k => (
            <div key={k.label} className="bg-ryobi-dark border border-white/10 border-l-4 border-l-ryobi-yellow p-4">
              <div className="text-white/65 text-xs uppercase tracking-widest mb-1">{k.label}</div>
              <div className={`ryobi-heading text-3xl transition-colors ${k.color}`}>{k.value}</div>
              <div className="text-white/60 text-sm mt-0.5 leading-snug">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Reaction distribution */}
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Reaction Distribution"
              subtitle="Breakdown of tester ratings across all four response types for the selected window."
            />
            {reactionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={reactionData} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#ffffff60' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#ffffff80' }} width={95} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} responses`, '']} />
                  <Bar dataKey="value" radius={0}>
                    {reactionData.map(entry => <Cell key={entry.key} fill={entry.fill} />)}
                    <LabelList dataKey="pct" position="right" formatter={(v: any) => `${v}%`} style={{ fill: '#ffffff80', fontSize: 10 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/40 text-sm text-center py-16 uppercase tracking-widest">No data for this filter</p>
            )}
          </div>

          {/* Submissions per product */}
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Submissions per Product"
              subtitle="Tester sessions logged per product for the selected date and product filter."
            />
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={productActivity} margin={{ left: -10, top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#ffffff70' }} />
                <YAxis tick={{ fontSize: 10, fill: '#ffffff60' }} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v: any) => [v, 'Sessions']}
                  labelFormatter={(l: any) => productActivity.find(p => p.name === l)?.fullName ?? l}
                />
                <Bar dataKey="count" fill="#E1E723">
                  <LabelList dataKey="count" position="top" style={{ fill: '#E1E723', fontSize: 10, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Field Context ── */}
        {(() => {
          const taskRows = filteredSurvey.filter(r => r.question_key === 'task_type')
          const condRows = filteredSurvey.filter(r => r.question_key.startsWith('cond_'))
          if (taskRows.length === 0 && condRows.length === 0) return null

          const taskCounts = TASK_TYPES.map(t => ({
            name:  t.label,
            count: taskRows.filter(r => r.score === t.value).length,
          })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)

          const condCounts = CONDITIONS.map(c => ({
            key:   c.key,
            label: c.label,
            count: condRows.filter(r => r.question_key === c.key).length,
            pct:   taskRows.length ? Math.round(condRows.filter(r => r.question_key === c.key).length / taskRows.length * 100) : 0,
          })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

          return (
            <div className="bg-ryobi-dark border border-white/10 p-5">
              <SectionHeader
                title="Field Context"
                subtitle="What testers were doing and the conditions they worked in. Context makes every other data point more meaningful."
              />
              <div className="grid md:grid-cols-2 gap-6">

                {/* Task type breakdown */}
                {taskCounts.length > 0 && (
                  <div>
                    <div className="text-white/65 text-xs uppercase tracking-widest mb-3">Task Type</div>
                    <div className="space-y-2">
                      {taskCounts.map(t => {
                        const pct = taskRows.length ? Math.round(t.count / taskRows.length * 100) : 0
                        return (
                          <div key={t.name}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/80">{t.name}</span>
                              <span className="text-white/55">{t.count} <span className="text-white/35">({pct}%)</span></span>
                            </div>
                            <div className="h-2 bg-white/10 w-full">
                              <div className="h-full bg-ryobi-yellow/70" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-white/40 text-xs mt-3">n={taskRows.length} sessions with task context</div>
                  </div>
                )}

                {/* Conditions */}
                {condCounts.length > 0 && (
                  <div>
                    <div className="text-white/65 text-xs uppercase tracking-widest mb-3">Working Conditions</div>
                    <div className="flex flex-wrap gap-2">
                      {condCounts.map(c => (
                        <div key={c.key} className="flex flex-col items-center border border-white/15 bg-white/5 px-4 py-3 min-w-[90px]">
                          <div className="ryobi-heading text-2xl text-ryobi-yellow leading-none">{c.pct}%</div>
                          <div className="text-white/70 text-sm mt-1 text-center">{c.label}</div>
                          <div className="text-white/40 text-xs mt-0.5">n={c.count}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-white/45 text-xs mt-3">% of sessions where testers reported this condition</p>
                  </div>
                )}

              </div>
            </div>
          )
        })()}

        {/* ── Survey Score Averages + Distribution ── */}
        {questionStats.length > 0 && (
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Survey Score Averages"
              subtitle="Testers answered 4 statements on a 1–7 scale after each session. Bars show score distribution — red = bottom box (1–2), amber = mid (3–5), yellow = top box (6–7)."
            />

            {/* Legend */}
            <div className="flex items-center gap-5 mb-5 pl-1">
              {[
                { color: 'bg-red-500', label: 'Bottom Box  1–2' },
                { color: 'bg-amber-400', label: 'Mid  3–5' },
                { color: 'bg-ryobi-yellow', label: 'Top Box  6–7' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 ${l.color}`} />
                  <span className="text-white/55 text-[10px] uppercase tracking-wide">{l.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              {questionStats.map(stat => {
                const scores  = filteredSurvey.filter(r => r.question_key === stat.question_key).map(r => r.score)
                const t2b     = topTwoBox(scores)
                const b2b     = bottomTwoBox(scores)
                const lowN    = stat.n < MIN_N
                const n       = scores.length || 1
                const pctBot  = Math.round(scores.filter(s => s <= 2).length / n * 100)
                const pctMid  = Math.round(scores.filter(s => s >= 3 && s <= 5).length / n * 100)
                const pctTop  = Math.round(scores.filter(s => s >= 6).length / n * 100)
                return (
                  <div key={stat.question_key} className={lowN ? 'opacity-50' : ''}>
                    {/* Question header */}
                    <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-semibold leading-tight block">{stat.question_text}</span>
                        <span className="text-white/50 text-xs">n={stat.n} · mean {stat.mean}/7 · median {stat.median}</span>
                        {lowN && <span className="text-amber-400 text-xs ml-2">⚠ Low sample</span>}
                      </div>
                      {/* T2B / B2B / Mean summary */}
                      <div className="flex gap-2 flex-shrink-0">
                        <div className="text-center px-3 py-1.5 border border-ryobi-yellow/30 bg-ryobi-yellow/10">
                          <div className="ryobi-heading text-lg text-ryobi-yellow leading-none">{t2b}%</div>
                          <div className="text-ryobi-yellow/80 text-xs uppercase tracking-wider mt-0.5">Top 2 Box</div>
                        </div>
                        <div className="text-center px-3 py-1.5 border border-red-500/30 bg-red-500/10">
                          <div className="ryobi-heading text-lg text-red-400 leading-none">{b2b}%</div>
                          <div className="text-red-400/80 text-xs uppercase tracking-wider mt-0.5">Bot 2 Box</div>
                        </div>
                      </div>
                    </div>

                    {/* Stacked distribution bar */}
                    <div className="flex h-7 w-full overflow-hidden gap-px">
                      {pctBot > 0 && (
                        <div className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ width: `${pctBot}%` }}>
                          {pctBot >= 7 ? `${pctBot}%` : ''}
                        </div>
                      )}
                      {pctMid > 0 && (
                        <div className="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-black"
                          style={{ width: `${pctMid}%` }}>
                          {pctMid >= 7 ? `${pctMid}%` : ''}
                        </div>
                      )}
                      {pctTop > 0 && (
                        <div className="bg-ryobi-yellow flex items-center justify-center text-[10px] font-bold text-ryobi-black"
                          style={{ width: `${pctTop}%` }}>
                          {pctTop >= 7 ? `${pctTop}%` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-white/35 mt-1">
                      <span>1 — Strongly Disagree</span>
                      <span>7 — Strongly Agree</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── NPS Deep Dive ── */}
        {allNpsScores.length > 0 && (
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Net Promoter Score — Deep Dive"
              subtitle={`NPS = % Promoters − % Detractors. Scale: −100 to +100. Above 0 is positive. Current score: ${npsScore > 0 ? '+' : ''}${npsScore} (±${npsMoe} MoE, n=${npsTotal})`}
            />

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Detractors', sub: 'Scored 0–6',  data: detractors, color: 'border-red-500/30 bg-red-500/10',           textColor: 'text-red-400',      formula: '% drives score down' },
                { label: 'Passives',   sub: 'Scored 7–8',  data: passives,   color: 'border-white/20 bg-white/5',               textColor: 'text-white/70',     formula: 'Neutral — not counted' },
                { label: 'Promoters',  sub: 'Scored 9–10', data: promoters,  color: 'border-ryobi-yellow/40 bg-ryobi-yellow/10', textColor: 'text-ryobi-yellow', formula: '% drives score up' },
              ].map(band => (
                <div key={band.label} className={`border ${band.color} p-4`}>
                  <div className={`ryobi-heading text-2xl ${band.textColor} leading-none`}>
                    {npsTotal ? Math.round(band.data.length / npsTotal * 100) : 0}%
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${band.textColor}`}>{band.label}</div>
                  <div className="text-white/60 text-xs mt-0.5">{band.sub} · n={band.data.length}</div>
                  <div className="text-white/45 text-xs mt-1 italic">{band.formula}</div>
                </div>
              ))}
            </div>

            {npsTotal > 0 && (
              <div className="mb-6">
                <div className="flex h-2 rounded-none overflow-hidden gap-0.5">
                  <div className="bg-red-500/70 transition-all" style={{ width: `${Math.round(detractors.length / npsTotal * 100)}%` }} />
                  <div className="bg-white/20 transition-all" style={{ width: `${Math.round(passives.length / npsTotal * 100)}%` }} />
                  <div className="bg-ryobi-yellow transition-all" style={{ width: `${Math.round(promoters.length / npsTotal * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/40 mt-1">
                  <span>Detractors {Math.round(detractors.length / npsTotal * 100)}%</span>
                  <span>Passives {Math.round(passives.length / npsTotal * 100)}%</span>
                  <span>Promoters {Math.round(promoters.length / npsTotal * 100)}%</span>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Detractor Verbatims',data: detractors, borderColor: 'border-red-500/25',      textColor: 'text-red-400/80',        prompt: '"What was disappointing?"' },
                { label: 'Passive Verbatims',  data: passives,   borderColor: 'border-white/15',        textColor: 'text-white/60',         prompt: '"What would move you higher?"' },
                { label: 'Promoter Verbatims', data: promoters,  borderColor: 'border-ryobi-yellow/30', textColor: 'text-ryobi-yellow/80', prompt: '"What did you love most?"' },
              ].map(band => (
                <div key={band.label}>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${band.textColor}`}>{band.label}</div>
                  <div className="text-white/50 text-xs italic mb-3">{band.prompt}</div>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {band.data.filter(e => e.comment).slice(0, 8).map((e, i) => (
                      <div key={i} className={`border-l-2 ${band.borderColor} pl-3 py-0.5`}>
                        <p className="text-white/80 text-sm leading-relaxed">&ldquo;{e.comment}&rdquo;</p>
                        <span className="text-white/45 text-xs">Score {e.score}</span>
                      </div>
                    ))}
                    {band.data.filter(e => e.comment).length === 0 && (
                      <p className="text-white/40 text-sm italic">No comments for this band in the selected window.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Significance Testing ── */}
        {products.length >= 2 && (
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Statistical Significance — Product Comparison"
              subtitle="Welch's t-test checks whether the score gap between two products is real or random noise. p < 0.05 = statistically significant. Uses all-time data for maximum statistical power."
            />
            <div className="flex gap-3 mb-5 flex-wrap items-center">
              {[{ state: sigTestA, setter: setSigTestA, label: 'Product A' }, { state: sigTestB, setter: setSigTestB, label: 'Product B' }].map(({ state, setter, label }) => (
                <div key={label}>
                  <div className="text-white/65 text-xs uppercase tracking-widest mb-1">{label}</div>
                  <select value={state} onChange={e => setter(e.target.value)}
                    className="text-xs border border-white/15 px-3 py-2 bg-ryobi-dark text-white font-semibold focus:outline-none focus:border-ryobi-yellow">
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              ))}
              <span className="text-white/40 self-end pb-2 font-bold">vs</span>
            </div>
            <div className="space-y-1">
              {(sigTests as NonNullable<typeof sigTests[0]>[]).map(test => {
                const nA = surveyRawData.filter(r => r.product_id === sigTestA && r.question_key === test.question_key).length
                const nB = surveyRawData.filter(r => r.product_id === sigTestB && r.question_key === test.question_key).length
                const lowN = nA < MIN_N || nB < MIN_N
                return (
                  <div key={test.question_key}
                    className={`flex items-center justify-between p-3 border-l-4 ${test.significant ? 'border-ryobi-yellow bg-ryobi-yellow/5' : 'border-transparent bg-white/5'} ${lowN ? 'opacity-50' : ''}`}>
                    <div>
                      <span className="text-white text-xs font-semibold block">{SURVEY_QUESTIONS.find(q => q.key === test.question_key)?.text}</span>
                      <span className="text-white/55 text-xs">n={nA} vs n={nB}</span>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <span className={`ryobi-heading text-xs block ${test.significant ? 'text-ryobi-yellow' : 'text-white/50'}`}>
                        {test.significant ? '★ Significant' : 'Not significant'}
                      </span>
                      <span className="text-white/50 text-xs">t={test.t_statistic} · p={test.p_value}</span>
                    </div>
                  </div>
                )
              })}
              {sigTests.length === 0 && <p className="text-white/40 text-xs">Select two different products above to compare.</p>}
            </div>
          </div>
        )}

        {/* ── AI Research Synthesis ── */}
        <div className="bg-ryobi-dark border border-white/10 p-5">
          <SectionHeader
            title="AI Research Synthesis"
            subtitle="Claude AI reads all tester comments and generates a research summary, top theme, and sentiment score. Click Generate to run. Results are cached daily."
          />
          <div className="grid md:grid-cols-3 gap-3">
            {products.map(p => {
              const demoFallback = p.sku && DEMO_INSIGHTS[p.sku]
                ? { id: 'demo-' + p.sku, product_id: p.id, date: '2026-04-22', generated_at: '2026-04-22T00:00:00Z', ...DEMO_INSIGHTS[p.sku] }
                : undefined
              const insight = insights.find(i => i.product_id === p.id) ?? demoFallback
              return (
                <div key={p.id} className="border border-white/10 p-4 bg-black/30">
                  <div className="ryobi-heading text-xs text-white mb-0.5 leading-snug">{p.name}</div>
                  <div className="text-white/55 text-xs mb-3 uppercase tracking-widest">{p.sku}</div>
                  {insight ? (
                    <>
                      <div className="text-xs font-black text-ryobi-black bg-ryobi-yellow px-2 py-0.5 w-fit mb-3 uppercase tracking-wider">
                        {insight.top_theme}
                      </div>
                      <div className="text-white/75 text-sm leading-relaxed whitespace-pre-line">{insight.summary}</div>
                      <div className="text-xs text-white/55 mt-3 border-t border-white/10 pt-2 flex justify-between">
                        <span>Sentiment</span>
                        <span className={`font-bold ${(insight.sentiment_score ?? 0) >= 6 ? 'text-ryobi-yellow' : 'text-amber-400'}`}>{insight.sentiment_score}/10</span>
                      </div>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Live Feed ── */}
        <div className="bg-ryobi-dark border border-white/10 p-5">
          <SectionHeader
            title="Live Feedback Feed"
            subtitle="Every tester submission appears here in real time — no refresh needed."
          />
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filtered.slice(0, 60).map(f => {
              const product = products.find(p => p.id === f.product_id)
              return (
                <div key={f.id} className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-ryobi-yellow">
                  <div className="flex-shrink-0 mt-0.5">
                    <ReactionBadge reaction={f.reaction} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="ryobi-heading text-xs text-white">{shortName(product?.name ?? '')}</span>
                      {f.category && <span className="text-xs text-white/55 uppercase tracking-wider border border-white/15 px-1.5 py-0.5">{f.category}</span>}
                      <span className="text-xs text-white/45 ml-auto">{f.session_date}</span>
                    </div>
                    {f.comment && <p className="text-sm text-white/65 mt-0.5 line-clamp-1">&ldquo;{f.comment}&rdquo;</p>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-white/40 text-sm text-center py-8 uppercase tracking-widest">No feedback for this filter.</p>
            )}
          </div>
          {filtered.length > 60 && (
            <p className="text-white/50 text-xs text-center mt-2 uppercase tracking-widest">Showing 60 of {filtered.length} — use the product filter to narrow</p>
          )}
        </div>

      </div>
    </div>
  )
}

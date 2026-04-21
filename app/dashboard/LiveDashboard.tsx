'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { Feedback, Product, AIInsight, QuestionStats } from '@/lib/types'
import { SURVEY_QUESTIONS } from '@/lib/types'
import { computeQuestionStats, computeNPS, welchTTest } from '@/lib/stats'
import RyobiHeader from '@/components/RyobiHeader'

interface Props {
  initialFeedback: Feedback[]
  products: Product[]
  initialInsights: AIInsight[]
  initialSurveyScores: Record<string, Record<string, number[]>>
}

const REACTION_COLORS: Record<string, string> = {
  love:    '#E1E723',
  like:    '#77787B',
  meh:     '#555',
  dislike: '#ef4444',
}

const REACTION_LABELS: Record<string, string> = {
  love: 'Highly Positive', like: 'Positive', meh: 'Neutral', dislike: 'Negative',
}

const MIN_N_FOR_STATS = 5

// Extract a short, unique label from a product name — strips "RYOBI 40V HP Brushless" prefix
function shortName(name: string): string {
  const cleaned = name
    .replace(/RYOBI\s+/i, '')
    .replace(/40V\s+/i, '')
    .replace(/HP\s+/i, '')
    .replace(/Brushless\s+/i, '')
    .replace(/\(.*?\)/g, '')
    .trim()
  const words = cleaned.split(' ').filter(Boolean)
  return words.slice(0, 3).join(' ')
}

function Pill({ text, tone }: { text: string; tone?: 'warn' | 'info' }) {
  const colors = tone === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
  return <span className={`text-xs px-2 py-0.5 font-semibold rounded ${colors}`}>{text}</span>
}

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="ryobi-heading text-base text-ryobi-dark border-l-4 border-ryobi-yellow pl-3">{title}</h3>
        {badge}
      </div>
      <p className="text-ryobi-gray text-xs mt-1 pl-4 leading-relaxed">{subtitle}</p>
    </div>
  )
}

export default function LiveDashboard({ initialFeedback, products, initialInsights, initialSurveyScores }: Props) {
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback)
  const [insights, setInsights] = useState<AIInsight[]>(initialInsights)
  const [surveyScores] = useState(initialSurveyScores)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('week')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null)
  const [flashCount, setFlashCount] = useState(false)
  const [sigTestProductA, setSigTestProductA] = useState(products[0]?.id ?? '')
  const [sigTestProductB, setSigTestProductB] = useState(products[1]?.id ?? '')

  useEffect(() => {
    const channel = supabase
      .channel('feedback-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, (payload) => {
        setFeedback(prev => [payload.new as Feedback, ...prev])
        setFlashCount(true)
        setTimeout(() => setFlashCount(false), 600)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const filtered = feedback.filter(f => {
    const dateOk = dateFilter === 'all'       ? true
      : dateFilter === 'today'     ? f.session_date === today
      : dateFilter === 'yesterday' ? f.session_date === yesterday
      : f.session_date >= weekAgo
    return dateOk && (selectedProduct === 'all' || f.product_id === selectedProduct)
  })

  const reactionData = (['love', 'like', 'meh', 'dislike'] as const).map(r => ({
    name: REACTION_LABELS[r],
    value: filtered.filter(f => f.reaction === r).length,
    key: r,
  })).filter(d => d.value > 0)

  const productActivity = products.map(p => ({
    name: shortName(p.name),
    fullName: p.name,
    count: feedback.filter(f => f.product_id === p.id).length,
  }))

  async function generateInsight(productId: string) {
    setLoadingInsight(productId)
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    const data = await res.json()
    if (data.id) setInsights(prev => [data, ...prev.filter(i => i.product_id !== productId)])
    setLoadingInsight(null)
  }

  const statsProductId = selectedProduct === 'all' ? null : selectedProduct
  const questionStats: QuestionStats[] = SURVEY_QUESTIONS.map(q => {
    const scores = statsProductId
      ? (surveyScores[statsProductId]?.[q.key] ?? [])
      : Object.values(surveyScores).flatMap(ps => ps[q.key] ?? [])
    return computeQuestionStats(q.key, q.text, scores)
  }).filter(Boolean) as QuestionStats[]

  const npsScores = statsProductId
    ? (surveyScores[statsProductId]?.['nps'] ?? [])
    : Object.values(surveyScores).flatMap(ps => ps['nps'] ?? [])
  const npsScore = computeNPS(npsScores)

  const sigTests = sigTestProductA && sigTestProductB && sigTestProductA !== sigTestProductB
    ? SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q => {
        const sA = surveyScores[sigTestProductA]?.[q.key] ?? []
        const sB = surveyScores[sigTestProductB]?.[q.key] ?? []
        return welchTTest(q.key, sigTestProductA, sA, sigTestProductB, sB)
      }).filter(Boolean)
    : []

  const posRate = filtered.length
    ? Math.round((filtered.filter(f => f.reaction === 'love' || f.reaction === 'like').length / filtered.length) * 100)
    : 0

  const tooltipStyle = { background: '#1A1A1A', border: '1px solid #E1E723', color: '#fff', fontSize: 12 }

  return (
    <div className="min-h-screen bg-ryobi-offwhite">
      <RyobiHeader
        subtitle="Advanced Engineering — Research Dashboard"
        right={
          <div className="flex items-center gap-4">
            <a href="/analytics" className="text-ryobi-gray text-xs uppercase tracking-widest font-semibold hover:text-ryobi-yellow transition-colors">
              Analytics
            </a>
            <a href="/admin/seed" className="text-ryobi-gray text-xs uppercase tracking-widest font-semibold hover:text-ryobi-yellow transition-colors">
              Seed Data
            </a>
            <div className="flex items-center gap-2">
              <span className="text-ryobi-gray text-xs uppercase tracking-wider">Live</span>
              <span className="w-2 h-2 rounded-full bg-ryobi-yellow animate-pulse" />
            </div>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <div className="text-xs text-ryobi-gray uppercase tracking-widest mb-1">Date range</div>
            <div className="flex border border-ryobi-dark overflow-hidden">
              {(['all', 'today', 'yesterday', 'week'] as const).map(d => (
                <button key={d} onClick={() => setDateFilter(d)}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    dateFilter === d ? 'bg-ryobi-yellow text-ryobi-black' : 'bg-white text-ryobi-gray hover:bg-ryobi-dark hover:text-white'
                  }`}>
                  {d === 'all' ? 'All Time' : d === 'week' ? 'Last 7 Days' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-ryobi-gray uppercase tracking-widest mb-1">Product filter</div>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              className="text-xs border border-ryobi-dark px-3 py-2 bg-white text-ryobi-dark font-semibold uppercase tracking-wide focus:outline-none focus:border-ryobi-yellow h-[38px]">
              <option value="all">All Products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
            <div className="text-ryobi-gray text-xs uppercase tracking-widest mb-1">Submissions</div>
            <div className={`ryobi-heading text-3xl transition-colors ${flashCount ? 'text-ryobi-yellow' : 'text-white'}`}>{filtered.length}</div>
            <div className="text-ryobi-gray text-xs mt-0.5">Total tester sessions in this window · {feedback.filter(f => f.session_date === today).length} today</div>
          </div>
          <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
            <div className="text-ryobi-gray text-xs uppercase tracking-widest mb-1">Products in Field</div>
            <div className="ryobi-heading text-3xl text-white">{products.length}</div>
            <div className="text-ryobi-gray text-xs mt-0.5">Active beta units being tested</div>
          </div>
          <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
            <div className="text-ryobi-gray text-xs uppercase tracking-widest mb-1">NPS Score</div>
            <div className={`ryobi-heading text-3xl ${npsScore >= 0 ? 'text-ryobi-yellow' : 'text-red-400'}`}>{npsScore > 0 ? '+' : ''}{npsScore}</div>
            <div className="text-ryobi-gray text-xs mt-0.5">
              Net Promoter Score (−100 to +100) · above 0 is positive · n={npsScores.length}
              {npsScores.length < MIN_N_FOR_STATS && <span className="text-amber-400 ml-1">⚠ too few responses</span>}
            </div>
          </div>
          <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
            <div className="text-ryobi-gray text-xs uppercase tracking-widest mb-1">Positive Rate</div>
            <div className={`ryobi-heading text-3xl ${posRate >= 60 ? 'text-ryobi-yellow' : 'text-red-400'}`}>{posRate}%</div>
            <div className="text-ryobi-gray text-xs mt-0.5">% of testers who reacted Love or Like</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 p-5">
            <SectionHeader
              title="How Testers Reacted"
              subtitle="Each tester swipes to rate a product. This shows the split across all four reaction types for the selected time window."
            />
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={reactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {reactionData.map(entry => (
                    <Cell key={entry.key} fill={REACTION_COLORS[entry.key] || '#444'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <SectionHeader
              title="Total Submissions per Product"
              subtitle="How many tester sessions have been logged for each product across all time — not filtered by date."
            />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productActivity} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#77787B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#77787B' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [val, 'Submissions']}
                  labelFormatter={(label: any) => {
                    const p = productActivity.find(p => p.name === label)
                    return p?.fullName ?? label
                  }}
                />
                <Bar dataKey="count" fill="#E1E723" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Survey stats */}
        {questionStats.length > 0 && (
          <div className="bg-white border border-gray-200 p-5">
            <SectionHeader
              title="Survey Score Averages"
              subtitle="After each swipe, testers answer 5 short questions. Scores are on a 1–7 scale (1 = strongly disagree, 7 = strongly agree) except NPS which uses 0–10. The shaded band shows the 95% confidence interval — the range where the true average likely falls."
              badge={questionStats.some(s => s.n < MIN_N_FOR_STATS) ? <Pill text="⚠ Low sample on some questions" tone="warn" /> : undefined}
            />
            <div className="space-y-5">
              {questionStats.map(stat => {
                const lowN = stat.n < MIN_N_FOR_STATS
                const scale = SURVEY_QUESTIONS.find(q => q.key === stat.question_key)?.scale === 'nps' ? 10 : 7
                return (
                  <div key={stat.question_key} className={lowN ? 'opacity-60' : ''}>
                    <div className="flex items-start justify-between mb-1.5 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-ryobi-dark leading-tight block">{stat.question_text}</span>
                        <span className="text-xs text-ryobi-gray">{scale === 10 ? '0–10 · 0=not at all, 10=extremely likely' : '1–7 · 1=strongly disagree, 7=strongly agree'}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="ryobi-heading text-xl text-ryobi-dark">{stat.mean}</span>
                        <span className="text-ryobi-gray text-xs ml-1">/ {scale}</span>
                        <div className="text-xs text-ryobi-gray">
                          95% CI [{stat.ci_lower}–{stat.ci_upper}] · {stat.n} responses
                          {lowN && <span className="text-amber-500 ml-1">⚠ unreliable at this n</span>}
                        </div>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 w-full">
                      <div className="absolute inset-y-0 bg-ryobi-yellow" style={{ width: `${(stat.mean / scale) * 100}%` }} />
                      <div className="absolute inset-y-0 bg-black/20"
                        style={{ left: `${(stat.ci_lower / scale) * 100}%`, width: `${((stat.ci_upper - stat.ci_lower) / scale) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-ryobi-gray mt-1">
                      <span>Std dev {stat.std_dev} <span className="font-normal opacity-70">(spread of answers)</span></span>
                      <span>Median {stat.median} <span className="font-normal opacity-70">(midpoint score)</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Significance testing */}
        {products.length >= 2 && (
          <div className="bg-white border border-gray-200 p-5">
            <SectionHeader
              title="Are These Products Actually Different? (Significance Test)"
              subtitle="A Welch's t-test checks whether the score gap between two products is real or just random chance. 'p < 0.05' means there's less than a 5% chance the difference happened by luck — it's statistically significant. 'n.s.' means not significant: the difference could just be noise."
              badge={
                (() => {
                  if (!sigTestProductA || !sigTestProductB) return undefined
                  const minN = Math.min(
                    ...SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q =>
                      Math.min(surveyScores[sigTestProductA]?.[q.key]?.length ?? 0, surveyScores[sigTestProductB]?.[q.key]?.length ?? 0)
                    )
                  )
                  return minN < MIN_N_FOR_STATS ? <Pill text={`⚠ Sample below ${MIN_N_FOR_STATS} — results unreliable`} tone="warn" /> : undefined
                })()
              }
            />
            <div className="flex gap-3 mb-5 flex-wrap items-center">
              <div>
                <div className="text-xs text-ryobi-gray uppercase tracking-widest mb-1">Product A</div>
                <select value={sigTestProductA} onChange={e => setSigTestProductA(e.target.value)}
                  className="text-xs border border-ryobi-dark px-3 py-2 bg-white font-semibold focus:outline-none focus:border-ryobi-yellow">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <span className="text-ryobi-gray self-end pb-2 font-bold">vs</span>
              <div>
                <div className="text-xs text-ryobi-gray uppercase tracking-widest mb-1">Product B</div>
                <select value={sigTestProductB} onChange={e => setSigTestProductB(e.target.value)}
                  className="text-xs border border-ryobi-dark px-3 py-2 bg-white font-semibold focus:outline-none focus:border-ryobi-yellow">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              {(sigTests as NonNullable<typeof sigTests[0]>[]).map(test => {
                const nA = surveyScores[sigTestProductA]?.[test.question_key]?.length ?? 0
                const nB = surveyScores[sigTestProductB]?.[test.question_key]?.length ?? 0
                const lowN = nA < MIN_N_FOR_STATS || nB < MIN_N_FOR_STATS
                return (
                  <div key={test.question_key}
                    className={`flex items-center justify-between p-3 text-sm border-l-4 ${
                      test.significant ? 'border-ryobi-yellow bg-amber-50' : 'border-transparent bg-gray-50'
                    } ${lowN ? 'opacity-50' : ''}`}>
                    <div>
                      <span className="text-ryobi-dark font-semibold text-xs block">{SURVEY_QUESTIONS.find(q => q.key === test.question_key)?.text}</span>
                      <span className="text-ryobi-gray text-xs">n={nA} vs n={nB}</span>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <span className={`ryobi-heading text-sm block ${test.significant ? 'text-ryobi-dark' : 'text-ryobi-gray'}`}>
                        {test.significant ? '★ Significant difference' : 'No significant difference'}
                      </span>
                      <span className="text-xs text-ryobi-gray">
                        t-stat={test.t_statistic} · p={test.p_value}
                        {lowN && <span className="text-amber-500 ml-1">⚠ low n</span>}
                      </span>
                    </div>
                  </div>
                )
              })}
              {sigTests.length === 0 && (
                <p className="text-sm text-ryobi-gray">Select two different products above to compare them.</p>
              )}
            </div>
          </div>
        )}

        {/* AI insights */}
        <div className="bg-ryobi-dark border border-ryobi-muted p-5">
          <SectionHeader
            title="AI Research Synthesis"
            subtitle="Click Generate on any product to have Claude AI read all tester comments and produce a 3-bullet research summary, top theme, and sentiment score. Results are cached daily — re-generate to refresh."
          />
          <div className="grid md:grid-cols-3 gap-3">
            {products.map(p => {
              const insight = insights.find(i => i.product_id === p.id)
              const isLoading = loadingInsight === p.id
              return (
                <div key={p.id} className="border border-ryobi-muted p-4 bg-black/30">
                  <div className="ryobi-heading text-sm text-white mb-1">{p.name}</div>
                  <div className="text-ryobi-gray text-xs mb-3">{p.sku}</div>
                  {insight ? (
                    <>
                      <div className="text-xs font-bold text-ryobi-black bg-ryobi-yellow px-2 py-0.5 w-fit mb-2 uppercase tracking-wide">
                        Top theme: {insight.top_theme}
                      </div>
                      <div className="text-xs text-ryobi-gray leading-relaxed whitespace-pre-line">{insight.summary}</div>
                      <div className="text-xs text-ryobi-gray mt-3 border-t border-ryobi-muted pt-2 flex justify-between">
                        <span>Sentiment score</span>
                        <span className={`font-bold ${(insight.sentiment_score ?? 0) >= 6 ? 'text-ryobi-yellow' : 'text-amber-400'}`}>
                          {insight.sentiment_score}/10
                        </span>
                      </div>
                      <button onClick={() => generateInsight(p.id)} disabled={isLoading}
                        className="text-xs text-ryobi-gray mt-2 underline hover:text-white transition-colors disabled:opacity-50">
                        {isLoading ? 'Regenerating...' : 'Regenerate'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => generateInsight(p.id)} disabled={isLoading}
                      className="text-xs text-ryobi-black bg-ryobi-yellow px-3 py-2 font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 w-full">
                      {isLoading ? 'Generating...' : '✦ Generate AI Summary'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Live feed */}
        <div className="bg-white border border-gray-200 p-5">
          <SectionHeader
            title="Live Feedback Feed"
            subtitle="Every submission from field testers appears here in real time. Updates instantly when a tester submits — no refresh needed."
          />
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filtered.slice(0, 50).map(f => {
              const product = products.find(p => p.id === f.product_id)
              const emoji = { love: '❤️', like: '👍', meh: '😐', dislike: '👎' }[f.reaction]
              const reactionLabel = REACTION_LABELS[f.reaction]
              return (
                <div key={f.id} className="flex items-start gap-3 p-3 hover:bg-ryobi-offwhite transition-colors border-l-2 border-transparent hover:border-ryobi-yellow">
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="ryobi-heading text-xs text-ryobi-dark">{shortName(product?.name ?? '')}</span>
                      <span className="text-xs font-bold text-ryobi-gray">{reactionLabel}</span>
                      {f.category && <span className="text-xs bg-ryobi-offwhite text-ryobi-gray px-1.5 py-0.5 capitalize">{f.category}</span>}
                      <span className="text-xs text-ryobi-gray ml-auto">{f.session_date}</span>
                    </div>
                    {f.comment && <p className="text-xs text-ryobi-gray mt-0.5 truncate">{f.comment}</p>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-ryobi-gray text-center py-8 uppercase tracking-widest">No feedback for this filter.</p>
            )}
          </div>
          {filtered.length > 50 && (
            <p className="text-xs text-ryobi-gray text-center mt-2">Showing 50 of {filtered.length} — use the product filter to narrow down</p>
          )}
        </div>

      </div>
    </div>
  )
}

'use client'

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

const MIN_N_FOR_STATS = 5  // warn below this

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

  const reactionData = Object.entries(
    filtered.reduce((acc: Record<string, number>, f) => {
      acc[f.reaction] = (acc[f.reaction] || 0) + 1; return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const productActivity = products.map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
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

  return (
    <div className="min-h-screen bg-ryobi-offwhite">
      <RyobiHeader
        subtitle="Advanced Engineering — Research Dashboard"
        right={
          <div className="flex items-center gap-2">
            <span className="text-ryobi-gray text-xs uppercase tracking-wider">Live</span>
            <span className="w-2 h-2 rounded-full bg-ryobi-yellow animate-pulse" />
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex border border-ryobi-dark overflow-hidden">
            {(['all', 'today', 'yesterday', 'week'] as const).map(d => (
              <button key={d} onClick={() => setDateFilter(d)}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  dateFilter === d ? 'bg-ryobi-yellow text-ryobi-black' : 'bg-white text-ryobi-gray hover:bg-ryobi-dark hover:text-white'
                }`}>
                {d === 'all' ? 'All' : d === 'week' ? '7 Days' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="text-xs border border-ryobi-dark px-3 py-2 bg-white text-ryobi-dark font-semibold uppercase tracking-wide focus:outline-none focus:border-ryobi-yellow">
            <option value="all">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Submissions',
              value: <span className={`transition-colors ${flashCount ? 'text-ryobi-yellow' : 'text-white'}`}>{filtered.length}</span>,
              sub: `${feedback.filter(f => f.session_date === today).length} today`,
            },
            { label: 'Products in Field', value: <span className="text-white">{products.length}</span>, sub: 'active beta units' },
            {
              label: 'NPS Score',
              value: <span className={npsScore >= 0 ? 'text-ryobi-yellow' : 'text-red-400'}>{npsScore > 0 ? '+' : ''}{npsScore}</span>,
              sub: `n = ${npsScores.length}${npsScores.length < MIN_N_FOR_STATS ? ' ⚠ low n' : ''}`,
            },
            {
              label: 'Positive Rate',
              value: <span className={posRate >= 60 ? 'text-ryobi-yellow' : 'text-red-400'}>{posRate}%</span>,
              sub: 'love + like',
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
              <div className="text-ryobi-gray text-xs uppercase tracking-widest mb-1">{kpi.label}</div>
              <div className="ryobi-heading text-3xl">{kpi.value}</div>
              <div className="text-ryobi-gray text-xs mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="ryobi-heading text-base text-ryobi-dark mb-4 border-l-4 border-ryobi-yellow pl-3">Reaction Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Pie data={reactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {reactionData.map(entry => (
                    <Cell key={entry.name} fill={REACTION_COLORS[entry.name] || '#444'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #E1E723', color: '#fff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <h3 className="ryobi-heading text-base text-ryobi-dark mb-4 border-l-4 border-ryobi-yellow pl-3">Submissions by Product</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productActivity} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#77787B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#77787B' }} />
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #E1E723', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="count" fill="#E1E723" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Survey stats */}
        {questionStats.length > 0 && (
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="ryobi-heading text-base text-ryobi-dark mb-1 border-l-4 border-ryobi-yellow pl-3">Validated Scale Scores</h3>
            <p className="text-ryobi-gray text-xs mb-5 pl-4">
              Likert 1–7. Error bars show 95% confidence intervals.
              {questionStats.some(s => s.n < MIN_N_FOR_STATS) && (
                <span className="text-amber-500 ml-2">⚠ Some questions have n &lt; {MIN_N_FOR_STATS} — interpret with caution.</span>
              )}
            </p>
            <div className="space-y-5">
              {questionStats.map(stat => {
                const lowN = stat.n < MIN_N_FOR_STATS
                const scale = SURVEY_QUESTIONS.find(q => q.key === stat.question_key)?.scale === 'nps' ? 10 : 7
                return (
                  <div key={stat.question_key} className={lowN ? 'opacity-60' : ''}>
                    <div className="flex items-start justify-between mb-1.5 gap-4">
                      <span className="text-sm text-ryobi-dark leading-tight max-w-xs">{stat.question_text}</span>
                      <div className="text-right flex-shrink-0">
                        <span className="ryobi-heading text-xl text-ryobi-dark">{stat.mean}</span>
                        <span className="text-ryobi-gray text-xs ml-1">/ {scale}</span>
                        <div className="text-xs text-ryobi-gray">
                          95% CI [{stat.ci_lower}, {stat.ci_upper}] · n={stat.n}
                          {lowN && <span className="text-amber-500 ml-1">⚠ low n</span>}
                        </div>
                      </div>
                    </div>
                    {/* Bar with CI overlay */}
                    <div className="relative h-2 bg-gray-100 w-full">
                      <div className="absolute inset-y-0 bg-ryobi-yellow"
                        style={{ width: `${(stat.mean / scale) * 100}%` }} />
                      <div className="absolute inset-y-0 bg-black/20"
                        style={{
                          left: `${(stat.ci_lower / scale) * 100}%`,
                          width: `${((stat.ci_upper - stat.ci_lower) / scale) * 100}%`,
                        }} />
                    </div>
                    <div className="flex justify-between text-xs text-ryobi-gray mt-1">
                      <span>SD: {stat.std_dev}</span>
                      <span>Median: {stat.median}</span>
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
            <h3 className="ryobi-heading text-base text-ryobi-dark mb-1 border-l-4 border-ryobi-yellow pl-3">Significance Testing</h3>
            <p className="text-ryobi-gray text-xs mb-4 pl-4">
              Welch&apos;s two-sample t-test (α = 0.05). Starred rows indicate statistically significant differences between products.
              {(sigTestProductA && sigTestProductB) && (() => {
                const minN = Math.min(
                  ...SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q =>
                    Math.min(surveyScores[sigTestProductA]?.[q.key]?.length ?? 0, surveyScores[sigTestProductB]?.[q.key]?.length ?? 0)
                  )
                )
                return minN < MIN_N_FOR_STATS
                  ? <span className="text-amber-500 ml-2">⚠ Sample size below {MIN_N_FOR_STATS} — significance results unreliable.</span>
                  : null
              })()}
            </p>
            <div className="flex gap-3 mb-4 flex-wrap">
              <select value={sigTestProductA} onChange={e => setSigTestProductA(e.target.value)}
                className="text-xs border border-ryobi-dark px-3 py-2 bg-white font-semibold uppercase tracking-wide focus:outline-none focus:border-ryobi-yellow">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <span className="text-ryobi-gray self-center text-sm font-bold">vs</span>
              <select value={sigTestProductB} onChange={e => setSigTestProductB(e.target.value)}
                className="text-xs border border-ryobi-dark px-3 py-2 bg-white font-semibold uppercase tracking-wide focus:outline-none focus:border-ryobi-yellow">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              {(sigTests as NonNullable<typeof sigTests[0]>[]).map(test => {
                const nA = surveyScores[sigTestProductA]?.[test.question_key]?.length ?? 0
                const nB = surveyScores[sigTestProductB]?.[test.question_key]?.length ?? 0
                const lowN = nA < MIN_N_FOR_STATS || nB < MIN_N_FOR_STATS
                return (
                  <div key={test.question_key}
                    className={`flex items-center justify-between p-3 text-sm border-l-4 ${
                      test.significant ? 'border-ryobi-yellow bg-black/5' : 'border-transparent bg-gray-50'
                    } ${lowN ? 'opacity-50' : ''}`}>
                    <span className="text-ryobi-dark max-w-xs leading-tight">
                      {SURVEY_QUESTIONS.find(q => q.key === test.question_key)?.text}
                    </span>
                    <div className="ml-4 text-right flex-shrink-0">
                      <span className={`ryobi-heading text-sm ${test.significant ? 'text-ryobi-dark' : 'text-ryobi-gray'}`}>
                        {test.significant ? '★ p < 0.05' : 'n.s.'}
                      </span>
                      <div className="text-xs text-ryobi-gray">
                        t={test.t_statistic}, p={test.p_value}
                        {lowN && <span className="text-amber-500 ml-1">⚠</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              {sigTests.length === 0 && (
                <p className="text-sm text-ryobi-gray">Select two different products to compare.</p>
              )}
            </div>
          </div>
        )}

        {/* AI insights */}
        <div className="bg-ryobi-dark border border-ryobi-muted p-5">
          <h3 className="ryobi-heading text-base text-white mb-1 border-l-4 border-ryobi-yellow pl-3">AI Research Synthesis</h3>
          <p className="text-ryobi-gray text-xs mb-4 pl-4">Generated by Claude — summarises tester comments into researcher-ready findings.</p>
          <div className="grid md:grid-cols-3 gap-3">
            {products.map(p => {
              const insight = insights.find(i => i.product_id === p.id)
              const isLoading = loadingInsight === p.id
              return (
                <div key={p.id} className="border border-ryobi-muted p-4 bg-black/30">
                  <div className="ryobi-heading text-sm text-white mb-2">{p.name}</div>
                  {insight ? (
                    <>
                      <div className="text-xs font-bold text-ryobi-black bg-ryobi-yellow px-2 py-0.5 w-fit mb-2 uppercase tracking-wide">
                        {insight.top_theme}
                      </div>
                      <div className="text-xs text-ryobi-gray leading-relaxed whitespace-pre-line">{insight.summary}</div>
                      <div className="text-xs text-ryobi-gray mt-2 border-t border-ryobi-muted pt-2">
                        Sentiment: <span className="text-ryobi-yellow font-bold">{insight.sentiment_score}/10</span>
                      </div>
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
          <h3 className="ryobi-heading text-base text-ryobi-dark mb-4 border-l-4 border-ryobi-yellow pl-3">Live Feedback Feed</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filtered.slice(0, 30).map(f => {
              const product = products.find(p => p.id === f.product_id)
              const emoji = { love: '❤️', like: '👍', meh: '😐', dislike: '👎' }[f.reaction]
              return (
                <div key={f.id} className="flex items-start gap-3 p-3 hover:bg-ryobi-offwhite transition-colors border-l-2 border-transparent hover:border-ryobi-yellow">
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="ryobi-heading text-xs text-ryobi-dark">{product?.name}</span>
                      <span className="text-xs bg-ryobi-offwhite text-ryobi-gray px-1.5 py-0.5 uppercase tracking-wide font-semibold">{f.category}</span>
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
        </div>

      </div>
    </div>
  )
}

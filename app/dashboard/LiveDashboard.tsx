'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { Feedback, Product, AIInsight, QuestionStats } from '@/lib/types'
import { SURVEY_QUESTIONS } from '@/lib/types'
import { computeQuestionStats, computeNPS, welchTTest } from '@/lib/stats'

interface Props {
  initialFeedback: Feedback[]
  products: Product[]
  initialInsights: AIInsight[]
  initialSurveyScores: Record<string, Record<string, number[]>>
}

const REACTION_COLORS: Record<string, string> = {
  love: '#22c55e',
  like: '#3b82f6',
  meh: '#f59e0b',
  dislike: '#ef4444',
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('feedback-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, async (payload) => {
        const newFb = payload.new as Feedback
        setFeedback(prev => [newFb, ...prev])
        setFlashCount(true)
        setTimeout(() => setFlashCount(false), 600)

        // Survey scores update handled on next full page load
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const filtered = feedback.filter(f => {
    const dateOk = dateFilter === 'all' ? true
      : dateFilter === 'today' ? f.session_date === today
      : dateFilter === 'yesterday' ? f.session_date === yesterday
      : f.session_date >= weekAgo
    const productOk = selectedProduct === 'all' || f.product_id === selectedProduct
    return dateOk && productOk
  })

  const reactionData = Object.entries(
    filtered.reduce((acc: Record<string, number>, f) => { acc[f.reaction] = (acc[f.reaction] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const productActivity = products.map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    count: feedback.filter(f => f.product_id === p.id).length,
  }))

  async function generateInsight(productId: string) {
    setLoadingInsight(productId)
    const res = await fetch('/api/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) })
    const data = await res.json()
    if (data.id) setInsights(prev => [data, ...prev.filter(i => i.product_id !== productId)])
    setLoadingInsight(null)
  }

  // Stats per question for selected product
  const statsProduct = selectedProduct === 'all' ? null : selectedProduct
  const questionStats: QuestionStats[] = SURVEY_QUESTIONS.map(q => {
    const scores = statsProduct
      ? (surveyScores[statsProduct]?.[q.key] ?? [])
      : Object.values(surveyScores).flatMap(ps => ps[q.key] ?? [])
    return computeQuestionStats(q.key, q.text, scores)
  }).filter(Boolean) as QuestionStats[]

  const npsScores = statsProduct
    ? (surveyScores[statsProduct]?.['nps'] ?? [])
    : Object.values(surveyScores).flatMap(ps => ps['nps'] ?? [])
  const npsScore = computeNPS(npsScores)

  const sigTests = sigTestProductA && sigTestProductB && sigTestProductA !== sigTestProductB
    ? SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q => {
        const sA = surveyScores[sigTestProductA]?.[q.key] ?? []
        const sB = surveyScores[sigTestProductB]?.[q.key] ?? []
        return welchTTest(q.key, sigTestProductA, sA, sigTestProductB, sB)
      }).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">FL</div>
          <div>
            <h1 className="font-bold text-gray-900">FieldLoop</h1>
            <div className="text-xs text-gray-400">Research Dashboard</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Live</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
            {(['all', 'today', 'yesterday', 'week'] as const).map(d => (
              <button key={d} onClick={() => setDateFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dateFilter === d ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                {d === 'all' ? 'All time' : d === 'week' ? 'Last 7 days' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700">
            <option value="all">All products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Submissions" value={
            <span className={`transition-colors ${flashCount ? 'text-orange-500' : 'text-gray-900'}`}>{filtered.length}</span>
          } sub={`${feedback.filter(f => f.session_date === today).length} today`} />
          <KPICard label="Products in Field" value={products.length} sub="active beta units" />
          <KPICard label="NPS Score" value={
            <span className={npsScore >= 0 ? 'text-green-600' : 'text-red-500'}>{npsScore > 0 ? '+' : ''}{npsScore}</span>
          } sub={`${npsScores.length} responses`} />
          <KPICard label="Positive Rate" value={
            (() => {
              const pos = filtered.filter(f => f.reaction === 'love' || f.reaction === 'like').length
              const pct = filtered.length ? Math.round((pos / filtered.length) * 100) : 0
              return <span className={pct >= 60 ? 'text-green-600' : 'text-yellow-600'}>{pct}%</span>
            })()
          } sub="love + like" />
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Reaction Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Pie data={reactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {reactionData.map((entry) => (
                    <Cell key={entry.name} fill={REACTION_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Submissions by Product</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productActivity} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Survey Stats */}
        {questionStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Survey Results — Validated Scale Scores</h3>
            <div className="space-y-4">
              {questionStats.map(stat => (
                <div key={stat.question_key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 truncate max-w-xs">{stat.question_text}</span>
                    <div className="text-right ml-4 flex-shrink-0">
                      <span className="font-bold text-gray-900 text-lg">{stat.mean}</span>
                      <span className="text-gray-400 text-xs ml-1">/ 7</span>
                      <div className="text-xs text-gray-400">95% CI [{stat.ci_lower}, {stat.ci_upper}] · n={stat.n}</div>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 bg-orange-500 rounded-full" style={{ width: `${(stat.mean / 7) * 100}%` }} />
                    {/* CI bounds */}
                    <div className="absolute inset-y-0 bg-orange-200" style={{ left: `${(stat.ci_lower / 7) * 100}%`, width: `${((stat.ci_upper - stat.ci_lower) / 7) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Significance Testing */}
        {products.length >= 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Statistical Significance Testing</h3>
            <p className="text-xs text-gray-400 mb-4">Welch&apos;s two-sample t-test (α = 0.05)</p>
            <div className="flex gap-3 mb-4 flex-wrap">
              <select value={sigTestProductA} onChange={e => setSigTestProductA(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <span className="text-gray-400 self-center text-sm">vs</span>
              <select value={sigTestProductB} onChange={e => setSigTestProductB(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {(sigTests as NonNullable<typeof sigTests[0]>[]).map(test => (
                <div key={test.question_key} className={`flex items-center justify-between p-3 rounded-xl text-sm ${test.significant ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                  <span className="text-gray-700">{SURVEY_QUESTIONS.find(q => q.key === test.question_key)?.text}</span>
                  <div className="ml-4 text-right flex-shrink-0">
                    <span className={`font-semibold ${test.significant ? 'text-orange-600' : 'text-gray-400'}`}>
                      {test.significant ? '★ Significant' : 'n.s.'}
                    </span>
                    <div className="text-xs text-gray-400">t={test.t_statistic}, p={test.p_value}</div>
                  </div>
                </div>
              ))}
              {sigTests.length === 0 && <p className="text-sm text-gray-400">Select two different products to compare.</p>}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">AI Research Synthesis</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {products.map(p => {
              const insight = insights.find(i => i.product_id === p.id)
              const isLoading = loadingInsight === p.id
              return (
                <div key={p.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="font-semibold text-sm text-gray-800">{p.name}</div>
                  {insight ? (
                    <>
                      <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit">
                        Top theme: {insight.top_theme}
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{insight.summary}</div>
                      <div className="text-xs text-gray-400">Sentiment: {insight.sentiment_score}/10</div>
                    </>
                  ) : (
                    <button onClick={() => generateInsight(p.id)} disabled={isLoading}
                      className="text-xs text-orange-600 border border-orange-200 rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors disabled:opacity-50">
                      {isLoading ? 'Generating...' : '✨ Generate AI summary'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Live Feedback Feed</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.slice(0, 30).map(f => {
              const product = products.find(p => p.id === f.product_id)
              const emoji = { love: '❤️', like: '👍', meh: '😐', dislike: '👎' }[f.reaction]
              return (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700">{product?.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{f.category}</span>
                      <span className="text-xs text-gray-400 ml-auto">{f.session_date}</span>
                    </div>
                    {f.comment && <p className="text-xs text-gray-500 mt-0.5 truncate">{f.comment}</p>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No feedback for this filter.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  )
}

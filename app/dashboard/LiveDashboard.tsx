'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts'
import type { Feedback, Product, AIInsight, QuestionStats } from '@/lib/types'
import { SURVEY_QUESTIONS } from '@/lib/types'
import { computeQuestionStats, computeNPS, npsMarginOfError, welchTTest, npsCategory } from '@/lib/stats'
import RyobiHeader from '@/components/RyobiHeader'
import DemoNav from '@/components/DemoNav'

interface NPSEntry { score: number; comment: string | null; product_id: string; session_date: string }

interface Props {
  initialFeedback: Feedback[]
  products: Product[]
  initialInsights: AIInsight[]
  initialSurveyScores: Record<string, Record<string, number[]>>
  npsData: NPSEntry[]
}

const REACTION_COLORS: Record<string, string> = {
  love: '#E1E723', like: '#4A90D9', meh: '#77787B', dislike: '#ef4444',
}
const REACTION_LABELS: Record<string, string> = {
  love: 'Highly Positive', like: 'Positive', meh: 'Neutral', dislike: 'Negative',
}
const MIN_N = 5

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
      <p className="text-white/55 text-xs mt-1 pl-4 leading-relaxed">{subtitle}</p>
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
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${styles[reaction] ?? styles.meh}`}>
      {REACTION_LABELS[reaction] ?? reaction}
    </span>
  )
}

const tooltipStyle = { background: '#111', border: '1px solid rgba(225,231,35,0.4)', color: '#fff', fontSize: 11, borderRadius: 0 }

export default function LiveDashboard({ initialFeedback, products, initialInsights, initialSurveyScores, npsData }: Props) {
  const [feedback, setFeedback]     = useState<Feedback[]>(initialFeedback)
  const [insights, setInsights]     = useState<AIInsight[]>(initialInsights)
  const [surveyScores]              = useState(initialSurveyScores)
  const [dateFilter, setDateFilter] = useState<'all'|'today'|'yesterday'|'week'>('week')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [loadingInsight, setLoadingInsight]   = useState<string|null>(null)
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
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const filtered = feedback.filter(f => {
    const dateOk = dateFilter === 'all' ? true : dateFilter === 'today' ? f.session_date === today : dateFilter === 'yesterday' ? f.session_date === yesterday : f.session_date >= weekAgo
    return dateOk && (selectedProduct === 'all' || f.product_id === selectedProduct)
  })

  // Reaction distribution
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
    count:    feedback.filter(f => f.product_id === p.id).length,
  }))

  // Survey stats
  const statsProductId = selectedProduct === 'all' ? null : selectedProduct
  const questionStats: QuestionStats[] = SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q => {
    const scores = statsProductId
      ? (surveyScores[statsProductId]?.[q.key] ?? [])
      : Object.values(surveyScores).flatMap(ps => ps[q.key] ?? [])
    return computeQuestionStats(q.key, q.text, scores)
  }).filter(Boolean) as QuestionStats[]

  // NPS
  const allNpsScores = statsProductId
    ? (surveyScores[statsProductId]?.['nps'] ?? [])
    : Object.values(surveyScores).flatMap(ps => ps['nps'] ?? [])
  const npsScore = computeNPS(allNpsScores)
  const npsMoe   = npsMarginOfError(allNpsScores)

  const filteredNps = npsData.filter(e =>
    (selectedProduct === 'all' || e.product_id === selectedProduct) && e.product_id
  )
  const promoters  = filteredNps.filter(e => npsCategory(e.score) === 'promoter')
  const passives   = filteredNps.filter(e => npsCategory(e.score) === 'passive')
  const detractors = filteredNps.filter(e => npsCategory(e.score) === 'detractor')
  const npsTotal   = filteredNps.length

  // Significance tests
  const sigTests = sigTestA && sigTestB && sigTestA !== sigTestB
    ? SURVEY_QUESTIONS.filter(q => q.scale !== 'nps').map(q => {
        const sA = surveyScores[sigTestA]?.[q.key] ?? []
        const sB = surveyScores[sigTestB]?.[q.key] ?? []
        return welchTTest(q.key, sigTestA, sA, sigTestB, sB)
      }).filter(Boolean) : []

  const posRate = filtered.length ? Math.round(filtered.filter(f => f.reaction === 'love' || f.reaction === 'like').length / filtered.length * 100) : 0

  async function generateInsight(productId: string) {
    setLoadingInsight(productId)
    const res  = await fetch('/api/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) })
    const data = await res.json()
    if (data.id) setInsights(prev => [data, ...prev.filter(i => i.product_id !== productId)])
    setLoadingInsight(null)
  }

  return (
    <div className="min-h-screen bg-ryobi-black">
      <RyobiHeader
        subtitle="Research Dashboard"
        right={
          <div className="flex items-center gap-5">
            <a href="/admin/seed" className="text-white/50 text-xs uppercase tracking-widest hover:text-ryobi-yellow transition-colors">Seed Data</a>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs uppercase tracking-wider">Live</span>
              <span className="w-2 h-2 bg-ryobi-yellow animate-pulse" />
            </div>
          </div>
        }
      />
      <DemoNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <div className="text-white/55 text-[10px] uppercase tracking-widest mb-1.5">Date Range</div>
            <div className="flex border border-white/15 overflow-hidden">
              {(['all','today','yesterday','week'] as const).map(d => (
                <button key={d} onClick={() => setDateFilter(d)}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    dateFilter === d ? 'bg-ryobi-yellow text-ryobi-black' : 'bg-ryobi-dark text-white/60 hover:text-white hover:bg-white/10'
                  }`}>
                  {d === 'all' ? 'All Time' : d === 'week' ? 'Last 7 Days' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white/55 text-[10px] uppercase tracking-widest mb-1.5">Product</div>
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
              <div className="text-white/55 text-[10px] uppercase tracking-widest mb-1">{k.label}</div>
              <div className={`ryobi-heading text-3xl transition-colors ${k.color}`}>{k.value}</div>
              <div className="text-white/45 text-xs mt-0.5 leading-snug">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Reaction distribution */}
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Reaction Distribution"
              subtitle="Breakdown of how testers rated products across all four response types for the selected window."
            />
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
          </div>

          {/* Submissions per product */}
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Submissions per Product"
              subtitle="Total tester sessions logged per product across all time — independent of the date filter above."
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

        {/* ── Survey Score Averages + Top/Bottom 2 Box ── */}
        {questionStats.length > 0 && (
          <div className="bg-ryobi-dark border border-white/10 p-5">
            <SectionHeader
              title="Survey Score Averages"
              subtitle="Testers answered 4 statements on a 1–7 scale after each product session. Top 2 Box = % scoring 6 or 7 (strongly favorable). Bottom 2 Box = % scoring 1 or 2."
            />
            <div className="space-y-6">
              {questionStats.map(stat => {
                const scores  = statsProductId ? (surveyScores[statsProductId]?.[stat.question_key] ?? []) : Object.values(surveyScores).flatMap(ps => ps[stat.question_key] ?? [])
                const t2b     = topTwoBox(scores)
                const b2b     = bottomTwoBox(scores)
                const lowN    = stat.n < MIN_N
                return (
                  <div key={stat.question_key} className={lowN ? 'opacity-50' : ''}>
                    <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-semibold leading-tight block">{stat.question_text}</span>
                        <span className="text-white/50 text-xs">1 = strongly disagree · 7 = strongly agree · n={stat.n}</span>
                        {lowN && <span className="text-amber-400 text-xs ml-2">⚠ Low sample — directional only</span>}
                      </div>
                      {/* Top/Bottom 2 Box callouts */}
                      <div className="flex gap-2 flex-shrink-0">
                        <div className="text-center px-3 py-1.5 border border-ryobi-yellow/30 bg-ryobi-yellow/10">
                          <div className="ryobi-heading text-lg text-ryobi-yellow leading-none">{t2b}%</div>
                          <div className="text-ryobi-yellow/70 text-[9px] uppercase tracking-wider mt-0.5">Top 2 Box</div>
                        </div>
                        <div className="text-center px-3 py-1.5 border border-red-500/30 bg-red-500/10">
                          <div className="ryobi-heading text-lg text-red-400 leading-none">{b2b}%</div>
                          <div className="text-red-400/70 text-[9px] uppercase tracking-wider mt-0.5">Bottom 2 Box</div>
                        </div>
                        <div className="text-center px-3 py-1.5 border border-white/10 bg-white/5">
                          <div className="ryobi-heading text-lg text-white leading-none">{stat.mean}<span className="text-white/40 text-xs">/7</span></div>
                          <div className="text-white/50 text-[9px] uppercase tracking-wider mt-0.5">Mean</div>
                        </div>
                      </div>
                    </div>

                    {/* Score bar with CI */}
                    <div className="relative h-2 bg-white/10 w-full">
                      <div className="absolute inset-y-0 bg-ryobi-yellow/30"
                        style={{ left: `${(stat.ci_lower / 7) * 100}%`, width: `${((stat.ci_upper - stat.ci_lower) / 7) * 100}%` }} />
                      <div className="absolute inset-y-0 bg-ryobi-yellow"
                        style={{ width: `${(stat.mean / 7) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                      <span>95% CI [{stat.ci_lower}–{stat.ci_upper}]</span>
                      <span>Median {stat.median} · Std dev {stat.std_dev}</span>
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

            {/* Band summary bar */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Promoters', sub: 'Scored 9–10', data: promoters, color: 'border-ryobi-yellow/40 bg-ryobi-yellow/10', textColor: 'text-ryobi-yellow', formula: '% drives score up' },
                { label: 'Passives',  sub: 'Scored 7–8',  data: passives,  color: 'border-white/20 bg-white/5',              textColor: 'text-white/70',      formula: 'Neutral — not counted' },
                { label: 'Detractors',sub: 'Scored 0–6',  data: detractors,color: 'border-red-500/30 bg-red-500/10',          textColor: 'text-red-400',       formula: '% drives score down' },
              ].map(band => (
                <div key={band.label} className={`border ${band.color} p-4`}>
                  <div className={`ryobi-heading text-2xl ${band.textColor} leading-none`}>
                    {npsTotal ? Math.round(band.data.length / npsTotal * 100) : 0}%
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${band.textColor}`}>{band.label}</div>
                  <div className="text-white/45 text-[10px] mt-0.5">{band.sub} · n={band.data.length}</div>
                  <div className="text-white/30 text-[9px] mt-1 italic">{band.formula}</div>
                </div>
              ))}
            </div>

            {/* Visual score bar */}
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

            {/* Verbatim quotes per band */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Promoter Verbatims', data: promoters, borderColor: 'border-ryobi-yellow/30', textColor: 'text-ryobi-yellow/80', prompt: '"What did you love most?"' },
                { label: 'Passive Verbatims',  data: passives,  borderColor: 'border-white/15',        textColor: 'text-white/60',         prompt: '"What would move you higher?"' },
                { label: 'Detractor Verbatims',data: detractors,borderColor: 'border-red-500/25',      textColor: 'text-red-400/80',        prompt: '"What was disappointing?"' },
              ].map(band => (
                <div key={band.label}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${band.textColor}`}>{band.label}</div>
                  <div className={`text-white/30 text-[9px] italic mb-2`}>{band.prompt}</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {band.data.filter(e => e.comment).slice(0, 8).map((e, i) => (
                      <div key={i} className={`border-l-2 ${band.borderColor} pl-2 py-0.5`}>
                        <p className="text-white/70 text-xs leading-snug">&ldquo;{e.comment}&rdquo;</p>
                        <span className="text-white/30 text-[9px]">Score {e.score}</span>
                      </div>
                    ))}
                    {band.data.filter(e => e.comment).length === 0 && (
                      <p className="text-white/30 text-xs italic">No comments submitted yet for this band.</p>
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
              subtitle="Welch's t-test checks whether the score gap between two products is real or random noise. p < 0.05 means statistically significant. Select two products to compare."
            />
            <div className="flex gap-3 mb-5 flex-wrap items-center">
              {[{ state: sigTestA, setter: setSigTestA, label: 'Product A' }, { state: sigTestB, setter: setSigTestB, label: 'Product B' }].map(({ state, setter, label }) => (
                <div key={label}>
                  <div className="text-white/55 text-[10px] uppercase tracking-widest mb-1">{label}</div>
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
                const nA = surveyScores[sigTestA]?.[test.question_key]?.length ?? 0
                const nB = surveyScores[sigTestB]?.[test.question_key]?.length ?? 0
                const lowN = nA < MIN_N || nB < MIN_N
                return (
                  <div key={test.question_key}
                    className={`flex items-center justify-between p-3 border-l-4 ${test.significant ? 'border-ryobi-yellow bg-ryobi-yellow/5' : 'border-transparent bg-white/5'} ${lowN ? 'opacity-50' : ''}`}>
                    <div>
                      <span className="text-white text-xs font-semibold block">{SURVEY_QUESTIONS.find(q => q.key === test.question_key)?.text}</span>
                      <span className="text-white/45 text-[10px]">n={nA} vs n={nB}</span>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <span className={`ryobi-heading text-xs block ${test.significant ? 'text-ryobi-yellow' : 'text-white/50'}`}>
                        {test.significant ? '★ Significant' : 'Not significant'}
                      </span>
                      <span className="text-white/40 text-[10px]">t={test.t_statistic} · p={test.p_value}</span>
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
              const insight   = insights.find(i => i.product_id === p.id)
              const isLoading = loadingInsight === p.id
              return (
                <div key={p.id} className="border border-white/10 p-4 bg-black/30">
                  <div className="ryobi-heading text-xs text-white mb-0.5 leading-snug">{p.name}</div>
                  <div className="text-white/40 text-[10px] mb-3 uppercase tracking-widest">{p.sku}</div>
                  {insight ? (
                    <>
                      <div className="text-[10px] font-black text-ryobi-black bg-ryobi-yellow px-2 py-0.5 w-fit mb-3 uppercase tracking-wider">
                        {insight.top_theme}
                      </div>
                      <div className="text-white/65 text-xs leading-relaxed whitespace-pre-line">{insight.summary}</div>
                      <div className="text-[10px] text-white/40 mt-3 border-t border-white/10 pt-2 flex justify-between">
                        <span>Sentiment</span>
                        <span className={`font-bold ${(insight.sentiment_score ?? 0) >= 6 ? 'text-ryobi-yellow' : 'text-amber-400'}`}>{insight.sentiment_score}/10</span>
                      </div>
                      <button onClick={() => generateInsight(p.id)} disabled={isLoading}
                        className="text-[10px] text-white/40 mt-2 hover:text-white transition-colors disabled:opacity-50">
                        {isLoading ? 'Regenerating...' : '↻ Regenerate'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => generateInsight(p.id)} disabled={isLoading}
                      className="text-xs text-ryobi-black bg-ryobi-yellow px-3 py-2 font-black ryobi-heading uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 w-full">
                      {isLoading ? 'Generating...' : '✦ Generate AI Summary'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Live Feed ── */}
        <div className="bg-ryobi-dark border border-white/10 p-5">
          <SectionHeader
            title="Live Feedback Feed"
            subtitle="Every tester submission appears here in real time — no refresh needed. Updates instantly."
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
                      {f.category && <span className="text-[10px] text-white/45 uppercase tracking-wider border border-white/15 px-1.5 py-0.5">{f.category}</span>}
                      <span className="text-[10px] text-white/35 ml-auto">{f.session_date}</span>
                    </div>
                    {f.comment && <p className="text-xs text-white/55 mt-0.5 line-clamp-1">&ldquo;{f.comment}&rdquo;</p>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-white/40 text-sm text-center py-8 uppercase tracking-widest">No feedback for this filter.</p>
            )}
          </div>
          {filtered.length > 60 && (
            <p className="text-white/35 text-[10px] text-center mt-2 uppercase tracking-widest">Showing 60 of {filtered.length} — use the product filter to narrow</p>
          )}
        </div>

      </div>
    </div>
  )
}

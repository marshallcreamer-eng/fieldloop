'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ReferenceLine,
} from 'recharts'
import type { Product } from '@/lib/types'
import { TIER_LABELS, TIER_NOTES, type SampleTier } from '@/lib/stats'
import RyobiHeader from '@/components/RyobiHeader'

interface Props { products: Product[] }

const TIER_COLORS: Record<SampleTier, string> = {
  small:  'border-amber-400 text-amber-600 bg-amber-50',
  medium: 'border-blue-400 text-blue-700 bg-blue-50',
  large:  'border-ryobi-yellow text-ryobi-dark bg-ryobi-yellow/10',
}

const TIER_BADGE: Record<SampleTier, string> = {
  small:  'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  large:  'bg-ryobi-yellow text-ryobi-black',
}

export default function AnalyticsView({ products }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id ?? '')
  const [compareProduct,  setCompareProduct]  = useState<string>('')
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!selectedProduct) return
    setLoading(true)
    const url = mode === 'compare' && compareProduct && compareProduct !== selectedProduct
      ? `/api/analytics?product_id=${selectedProduct}&compare_id=${compareProduct}`
      : `/api/analytics?product_id=${selectedProduct}`
    const res = await fetch(url)
    setData(await res.json())
    setLoading(false)
  }, [selectedProduct, compareProduct, mode])

  useEffect(() => { fetchData() }, [fetchData])

  const primary = mode === 'compare' ? data?.productA : data
  const tier: SampleTier = primary?.tier ?? 'small'

  return (
    <div className="min-h-screen bg-ryobi-offwhite">
      <RyobiHeader subtitle="Advanced Engineering — Analytics" />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <div className="text-xs text-ryobi-gray uppercase tracking-widest mb-1">Product</div>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              className="border-2 border-ryobi-dark px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:border-ryobi-yellow">
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex border border-ryobi-dark overflow-hidden">
            {(['single', 'compare'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === m ? 'bg-ryobi-yellow text-ryobi-black' : 'bg-white text-ryobi-gray hover:bg-ryobi-dark hover:text-white'
                }`}>
                {m === 'single' ? 'Single Product' : 'Compare Products'}
              </button>
            ))}
          </div>

          {mode === 'compare' && (
            <div>
              <div className="text-xs text-ryobi-gray uppercase tracking-widest mb-1">Compare with</div>
              <select value={compareProduct} onChange={e => setCompareProduct(e.target.value)}
                className="border-2 border-ryobi-dark px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:border-ryobi-yellow">
                <option value="">Select product...</option>
                {products.filter(p => p.id !== selectedProduct).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-16 text-ryobi-gray uppercase tracking-widest text-sm animate-pulse">
            Loading analytics...
          </div>
        )}

        {!loading && primary && (
          <>
            {/* Tier banner */}
            <div className={`border-l-4 p-4 ${TIER_COLORS[tier]}`}>
              <div className="flex items-center gap-3">
                <span className={`ryobi-heading text-xs px-2 py-1 font-black ${TIER_BADGE[tier]}`}>
                  {TIER_LABELS[tier]}
                </span>
                <span className="text-sm font-semibold">n = {primary.n} feedback responses</span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-80">{TIER_NOTES[tier]}</p>
            </div>

            {mode === 'single' ? (
              <SingleProductView data={data} tier={tier} />
            ) : (
              data?.comparisons && <CompareView data={data} products={products} />
            )}
          </>
        )}

        {!loading && !primary && !data && (
          <div className="text-center py-16 text-ryobi-gray uppercase tracking-widest text-sm">
            Select a product to begin
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Single product view ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SingleProductView({ data, tier }: { data: any; tier: SampleTier }) {
  const reactionData = Object.entries(data.reactionCounts as Record<string, number>).map(([name, value]) => ({ name, value }))
  const REACTION_COLORS: Record<string, string> = { love: '#E1E723', like: '#77787B', meh: '#555', dislike: '#ef4444' }

  return (
    <div className="space-y-5">
      {/* Overview row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Responses" value={data.n} sub="total feedback" />
        <KPI label="Positive Rate" value={`${data.positiveRate}%`} sub="love + like" accent />
        <KPI label="Sample Tier" value={TIER_LABELS[tier].split(' ')[0]} sub={`n = ${data.n}`} />
        <KPI label="Comments" value={data.surveyStats?.length ?? 0} sub="survey questions" />
      </div>

      {/* Reaction distribution — all tiers */}
      <Section title="Reaction Distribution" tier={tier} minTier="small">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={reactionData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#77787B' }} />
            <YAxis tick={{ fontSize: 11, fill: '#77787B' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0,0,0,0]}>
              {reactionData.map(entry => (
                <rect key={entry.name} fill={REACTION_COLORS[entry.name] || '#888'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-ryobi-gray mt-2">
          Frequency counts only. At n={data.n}, percentages are descriptive — not inferential.
        </p>
      </Section>

      {/* Survey descriptives — all tiers */}
      <Section title="Survey Descriptives" tier={tier} minTier="small">
        <div className="space-y-4">
          {data.surveyStats?.map((stat: any) => (
            <SurveyStatRow key={stat.question_key} stat={stat} tier={tier} />
          ))}
        </div>
      </Section>

      {/* Frequency distributions — small+ */}
      <Section title="Response Distributions" tier={tier} minTier="small">
        <p className="text-xs text-ryobi-gray mb-4">
          Raw frequency of each score. Useful for spotting bimodal or skewed patterns regardless of sample size.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {data.surveyStats?.filter((s: any) => s.scale !== 10).slice(0, 4).map((stat: any) => (
            <div key={stat.question_key}>
              <div className="text-xs font-semibold text-ryobi-dark mb-2 line-clamp-1">{stat.question_text}</div>
              <div className="flex items-end gap-1 h-20">
                {stat.distribution?.map((d: any) => (
                  <div key={d.score} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full bg-ryobi-yellow transition-all"
                      style={{ height: `${Math.max(4, d.pct)}%` }} />
                    <span className="text-xs text-ryobi-gray">{d.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Trend over time — medium+ */}
      <Section title="Positive Rate Trend" tier={tier} minTier="medium"
        locked={tier === 'small'} lockedNote="Trend analysis requires n ≥ 10 to be meaningful.">
        {data.trend && (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.trend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#77787B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#77787B' }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Positive rate']} />
                <ReferenceLine y={50} stroke="#77787B" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="positive_rate" stroke="#E1E723" strokeWidth={2} dot={{ fill: '#E1E723', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-ryobi-gray mt-2">
              {tier === 'medium' && '⚠ Medium sample — trend shape is indicative but may fluctuate significantly with more data.'}
              {tier === 'large' && 'Large sample — trend is stable and reliable.'}
            </p>
          </>
        )}
      </Section>

      {/* Regional breakdown — medium+ */}
      <Section title="Regional Breakdown" tier={tier} minTier="medium"
        locked={tier === 'small'} lockedNote="Regional analysis requires n ≥ 10.">
        {data.regional && (
          <div className="space-y-2">
            {data.regional.map((r: any) => (
              <div key={r.region} className="flex items-center gap-3">
                <span className="text-sm text-ryobi-dark w-24 flex-shrink-0">{r.region}</span>
                <div className="flex-1 bg-gray-100 h-5 relative">
                  <div className="absolute inset-y-0 bg-ryobi-yellow transition-all" style={{ width: `${r.positive_rate}%` }} />
                </div>
                <span className="text-sm font-bold text-ryobi-dark w-16 text-right">{r.positive_rate}%</span>
                <span className="text-xs text-ryobi-gray w-12">n={r.n}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Spider / radar — large only */}
      <Section title="Survey Profile (Radar)" tier={tier} minTier="large"
        locked={tier !== 'large'} lockedNote="Radar chart requires n ≥ 30 for reliable mean estimates.">
        {tier === 'large' && data.surveyStats && (
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data.surveyStats.filter((s: any) => s.scale === 7).map((s: any) => ({
              subject: s.question_text.split(' ').slice(0, 3).join(' ') + '…',
              value: parseFloat(((s.mean / 7) * 100).toFixed(0)),
            }))}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#77787B' }} />
              <Radar dataKey="value" stroke="#E1E723" fill="#E1E723" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </Section>
    </div>
  )
}

// ─── Compare view ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CompareView({ data, products }: { data: any; products: Product[] }) {
  const { productA, productB, comparisons } = data
  const tierA: SampleTier = productA.tier
  const tierB: SampleTier = productB.tier
  const effectiveTier: SampleTier = tierA === 'large' && tierB === 'large' ? 'large'
    : tierA === 'small' || tierB === 'small' ? 'small' : 'medium'

  const nameA = products.find(p => p.id === productA.product_id)?.name ?? 'Product A'
  const nameB = products.find(p => p.id === productB.product_id)?.name ?? 'Product B'

  return (
    <div className="space-y-5">
      {/* Side-by-side overview */}
      <div className="grid grid-cols-2 gap-3">
        {[{ label: nameA, d: productA, tier: tierA }, { label: nameB, d: productB, tier: tierB }].map(({ label, d, tier }) => (
          <div key={label} className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
            <div className="ryobi-heading text-sm text-white line-clamp-1">{label}</div>
            <div className={`text-xs mt-1 px-1.5 py-0.5 w-fit font-bold ${TIER_BADGE[tier as SampleTier]}`}>{TIER_LABELS[tier as SampleTier]}</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><div className="text-ryobi-gray text-xs">Responses</div><div className="ryobi-heading text-2xl text-white">{d.n}</div></div>
              <div><div className="text-ryobi-gray text-xs">Positive</div><div className="ryobi-heading text-2xl text-ryobi-yellow">{d.positiveRate}%</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Mean comparison bars */}
      <Section title="Mean Score Comparison" tier={effectiveTier} minTier="small">
        <div className="space-y-4">
          {comparisons?.map((c: any) => (
            <div key={c.question_key}>
              <div className="text-xs font-semibold text-ryobi-dark mb-1 leading-tight">{c.question_text}</div>
              <div className="space-y-1">
                {[{ label: nameA, mean: c.mean_a, n: c.n_a }, { label: nameB, mean: c.mean_b, n: c.n_b }].map(({ label, mean, n }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-ryobi-gray w-28 truncate">{label}</span>
                    <div className="flex-1 bg-gray-100 h-4 relative">
                      <div className="absolute inset-y-0 bg-ryobi-yellow" style={{ width: `${(mean / 7) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-ryobi-dark w-10 text-right">{mean}</span>
                    <span className="text-xs text-ryobi-gray w-12">n={n}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Significance table — medium+ */}
      <Section title="Statistical Significance" tier={effectiveTier} minTier="medium"
        locked={effectiveTier === 'small'}
        lockedNote="Both products need n ≥ 10 for t-tests.">
        <p className="text-xs text-ryobi-gray mb-4">
          Welch&apos;s two-sample t-test (α = 0.05). Starred rows are statistically significant.
          {effectiveTier === 'medium' && ' Power may be low at this sample size — treat with caution.'}
        </p>
        <div className="space-y-1">
          {comparisons?.map((c: any) => (
            <div key={c.question_key}
              className={`flex items-center justify-between p-3 text-sm border-l-4 ${
                c.significant ? 'border-ryobi-yellow bg-black/5' : 'border-transparent bg-gray-50'
              }`}>
              <span className="text-ryobi-dark max-w-xs leading-tight text-xs">{c.question_text}</span>
              <div className="text-right ml-4 flex-shrink-0">
                <span className={`ryobi-heading text-sm ${c.significant ? 'text-ryobi-dark' : 'text-ryobi-gray'}`}>
                  {c.significant ? '★ p < 0.05' : 'n.s.'}
                </span>
                <div className="text-xs text-ryobi-gray">t={c.t_statistic}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Effect sizes + power — large only */}
      <Section title="Effect Sizes & Statistical Power" tier={effectiveTier} minTier="large"
        locked={effectiveTier !== 'large'}
        lockedNote="Effect sizes and power estimates require n ≥ 30 per product to be reliable.">
        <p className="text-xs text-ryobi-gray mb-4">
          Cohen&apos;s d effect size. Power ≥ 0.80 (80%) is the conventional threshold for adequate power.
          Low-power tests risk missing real differences (Type II error).
        </p>
        <div className="space-y-2">
          {comparisons?.map((c: any) => {
            if (c.cohens_d === null) return null
            const powerPct = c.power !== null ? Math.round(c.power * 100) : null
            return (
              <div key={c.question_key} className="bg-gray-50 p-3 grid grid-cols-4 gap-2 text-xs">
                <div className="col-span-2 text-ryobi-dark leading-tight">{c.question_text}</div>
                <div>
                  <div className="text-ryobi-gray">Effect (d)</div>
                  <div className="font-bold text-ryobi-dark">{c.cohens_d} <span className="font-normal text-ryobi-gray">({c.effect_size})</span></div>
                </div>
                <div>
                  <div className="text-ryobi-gray">Power</div>
                  <div className={`font-bold ${c.power_adequate ? 'text-green-600' : 'text-amber-500'}`}>
                    {powerPct !== null ? `${powerPct}%` : '—'}
                    {!c.power_adequate && powerPct !== null && <span className="font-normal text-amber-500 ml-1">⚠ low</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────
function KPI({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent?: boolean }) {
  return (
    <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-4">
      <div className="text-ryobi-gray text-xs uppercase tracking-widest mb-1">{label}</div>
      <div className={`ryobi-heading text-3xl ${accent ? 'text-ryobi-yellow' : 'text-white'}`}>{value}</div>
      <div className="text-ryobi-gray text-xs mt-0.5">{sub}</div>
    </div>
  )
}

function Section({ title, tier, minTier, locked, lockedNote, children }: {
  title: string
  tier: SampleTier
  minTier: SampleTier
  locked?: boolean
  lockedNote?: string
  children: React.ReactNode
}) {
  const tierOrder: SampleTier[] = ['small', 'medium', 'large']
  const isUnlocked = tierOrder.indexOf(tier) >= tierOrder.indexOf(minTier)

  return (
    <div className={`bg-white border border-gray-200 p-5 ${locked || !isUnlocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="ryobi-heading text-base text-ryobi-dark border-l-4 border-ryobi-yellow pl-3">{title}</h3>
        <span className={`text-xs px-1.5 py-0.5 font-bold ${TIER_BADGE[minTier as SampleTier]}`}>
          {minTier === 'small' ? 'All tiers' : minTier === 'medium' ? 'Medium+' : 'Large only'}
        </span>
      </div>
      {locked || !isUnlocked ? (
        <div className="flex items-center gap-2 py-4 text-ryobi-gray">
          <span className="text-xl">🔒</span>
          <span className="text-sm">{lockedNote ?? `Requires ${TIER_LABELS[minTier]} or larger.`}</span>
        </div>
      ) : children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SurveyStatRow({ stat, tier }: { stat: any; tier: SampleTier }) {
  const scale = stat.scale
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <span className="text-sm text-ryobi-dark leading-tight max-w-xs">{stat.question_text}</span>
        <div className="text-right flex-shrink-0">
          <span className="ryobi-heading text-xl text-ryobi-dark">{stat.mean}</span>
          <span className="text-ryobi-gray text-xs ml-1">/ {scale}</span>
          {tier !== 'small' && (
            <div className="text-xs text-ryobi-gray">
              95% CI [{stat.ci_lower}, {stat.ci_upper}] · n={stat.n}
            </div>
          )}
          {tier === 'small' && (
            <div className="text-xs text-amber-500">n={stat.n} — CI not shown</div>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-gray-100">
        <div className="absolute inset-y-0 bg-ryobi-yellow" style={{ width: `${(stat.mean / scale) * 100}%` }} />
        {tier !== 'small' && (
          <div className="absolute inset-y-0 bg-black/15"
            style={{ left: `${(stat.ci_lower / scale) * 100}%`, width: `${((stat.ci_upper - stat.ci_lower) / scale) * 100}%` }} />
        )}
      </div>
      {stat.nps_score !== undefined && (
        <div className="text-xs text-ryobi-gray mt-1">
          NPS: <span className="font-bold text-ryobi-dark">{stat.nps_score > 0 ? '+' : ''}{stat.nps_score}</span>
          {tier !== 'small' && <span className="ml-2"> ± {stat.nps_moe} MoE</span>}
        </div>
      )}
    </div>
  )
}

const tooltipStyle = { background: '#1A1A1A', border: '1px solid #E1E723', color: '#fff', fontSize: 12 }

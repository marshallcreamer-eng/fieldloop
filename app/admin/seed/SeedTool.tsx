'use client'

import { useState } from 'react'
import RyobiHeader from '@/components/RyobiHeader'

interface SeedResult {
  products: number
  testers: number
  feedback: number
  survey_responses: number
}

const PRESETS = [
  { label: 'Small pilot',     testers: 5,  products: 3, days: 7,  description: '5 testers · 3 products · 7 days' },
  { label: 'Mid-size test',   testers: 10, products: 4, days: 14, description: '10 testers · 4 products · 14 days' },
  { label: 'Full field run',  testers: 15, products: 5, days: 30, description: '15 testers · 5 products · 30 days' },
]

export default function SeedTool() {
  const [numTesters,  setNumTesters]  = useState(5)
  const [numProducts, setNumProducts] = useState(3)
  const [numDays,     setNumDays]     = useState(7)
  const [clearFirst,  setClearFirst]  = useState(true)
  const [loading, setLoading]   = useState(false)
  const [result,  setResult]    = useState<SeedResult | null>(null)
  const [error,   setError]     = useState<string | null>(null)

  function applyPreset(p: typeof PRESETS[0]) {
    setNumTesters(p.testers)
    setNumProducts(p.products)
    setNumDays(p.days)
    setResult(null)
    setError(null)
  }

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    setError(null)

    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numTesters, numProducts, numDays, clearFirst }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setResult(data.stats)
    }
    setLoading(false)
  }

  const estimatedRows = Math.round(numTesters * numProducts * numDays * 0.72)

  return (
    <div className="min-h-screen bg-ryobi-offwhite">
      <RyobiHeader subtitle="Admin — Data Seed Tool" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Explainer */}
        <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-5">
          <h2 className="ryobi-heading text-xl text-white mb-1">Generate Demo Data</h2>
          <p className="text-ryobi-gray text-sm">
            Populates the database with realistic field tester feedback using Ryobi OPE products.
            Use this to load up the dashboard before a demo or presentation.
          </p>
        </div>

        {/* Presets */}
        <div>
          <div className="text-xs text-ryobi-gray uppercase tracking-widest font-semibold mb-3">Quick Presets</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className="p-3 bg-white border-2 border-gray-200 hover:border-ryobi-yellow hover:bg-ryobi-black hover:text-white transition-all text-left group">
                <div className="ryobi-heading text-sm text-ryobi-dark group-hover:text-ryobi-yellow">{p.label}</div>
                <div className="text-xs text-ryobi-gray mt-0.5 group-hover:text-ryobi-gray">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom sliders */}
        <div className="bg-white border border-gray-200 p-5 space-y-5">
          <div className="text-xs text-ryobi-gray uppercase tracking-widest font-semibold mb-1">Custom Configuration</div>

          <Slider label="Testers" min={1} max={15} value={numTesters}
            onChange={setNumTesters} unit="testers" />
          <Slider label="Products" min={1} max={5} value={numProducts}
            onChange={setNumProducts} unit="products" />
          <Slider label="Days of history" min={1} max={30} value={numDays}
            onChange={setNumDays} unit="days" />

          <div className="pt-2 border-t border-gray-100 text-xs text-ryobi-gray">
            Estimated feedback rows: <span className="font-bold text-ryobi-dark">~{estimatedRows}</span>
            <span className="ml-2 text-ryobi-gray">(70% daily response rate)</span>
          </div>
        </div>

        {/* Clear toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-10 h-5 rounded-full transition-colors ${clearFirst ? 'bg-ryobi-yellow' : 'bg-gray-300'}`}
            onClick={() => setClearFirst(v => !v)}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${clearFirst ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-ryobi-dark font-semibold">Clear existing data before seeding</span>
        </label>
        {!clearFirst && (
          <p className="text-xs text-amber-600">⚠ Existing data will not be removed — rows will be added on top.</p>
        )}

        {/* Seed button */}
        <button onClick={handleSeed} disabled={loading}
          className="w-full py-4 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-xl tracking-widest hover:bg-ryobi-dark hover:text-ryobi-yellow transition-colors disabled:opacity-50">
          {loading ? 'SEEDING...' : 'SEED DATABASE'}
        </button>

        {/* Result */}
        {result && (
          <div className="bg-ryobi-dark border-l-4 border-ryobi-yellow p-5 space-y-2">
            <div className="ryobi-heading text-white text-lg">✓ Database seeded successfully</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                ['Products', result.products],
                ['Testers', result.testers],
                ['Feedback rows', result.feedback],
                ['Survey responses', result.survey_responses],
              ].map(([label, val]) => (
                <div key={label as string} className="bg-black/30 p-3">
                  <div className="text-ryobi-gray text-xs uppercase tracking-wider">{label}</div>
                  <div className="ryobi-heading text-2xl text-ryobi-yellow">{val}</div>
                </div>
              ))}
            </div>
            <a href="/dashboard"
              className="mt-3 inline-block py-2 px-6 bg-ryobi-yellow text-ryobi-black font-black ryobi-heading text-sm tracking-widest hover:bg-white transition-colors">
              VIEW DASHBOARD →
            </a>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  )
}

function Slider({ label, min, max, value, onChange, unit }: {
  label: string; min: number; max: number; value: number; onChange: (v: number) => void; unit: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-semibold text-ryobi-dark">{label}</span>
        <span className="ryobi-heading text-base text-ryobi-dark">{value} <span className="text-ryobi-gray text-xs">{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 appearance-none cursor-pointer accent-ryobi-yellow" />
      <div className="flex justify-between text-xs text-ryobi-gray mt-0.5">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

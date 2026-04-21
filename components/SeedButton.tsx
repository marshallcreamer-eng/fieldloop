'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function SeedButton() {
  const [status, setStatus] = useState<Status>('idle')
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  async function handleSeed() {
    setStatus('loading')
    setStats(null)
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numTesters: 20, numDays: 30, numProducts: 5, clearFirst: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Seed failed')
      setStats(json.stats)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-xs sm:max-w-lg mt-4">
      {status === 'idle' && (
        <button
          onClick={handleSeed}
          className="w-full flex items-center justify-center gap-3 border border-white/15 bg-ryobi-dark hover:border-ryobi-yellow/60 hover:bg-black/60 transition-all px-5 py-4 group"
        >
          <svg className="w-4 h-4 text-white/50 group-hover:text-ryobi-yellow transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className="text-left">
            <div className="ryobi-heading text-xs text-white/70 group-hover:text-white tracking-widest transition-colors">PREPARE DEMO DATA</div>
            <div className="text-white/40 text-[10px] leading-snug mt-0.5">Seeds 20 testers · 5 products · 30 days — clears existing data</div>
          </div>
        </button>
      )}

      {status === 'loading' && (
        <div className="w-full flex items-center justify-center gap-3 border border-white/10 bg-ryobi-dark px-5 py-4">
          <svg className="w-4 h-4 text-ryobi-yellow animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ryobi-heading text-xs text-ryobi-yellow tracking-widest">LOADING DEMO DATA…</span>
        </div>
      )}

      {status === 'done' && stats && (
        <div className="w-full flex items-center justify-between border border-ryobi-yellow/40 bg-ryobi-yellow/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ryobi-yellow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="ryobi-heading text-xs text-ryobi-yellow tracking-widest">DEMO DATA READY</span>
          </div>
          <div className="flex items-center gap-4 text-white/60 text-[10px] uppercase tracking-wider">
            <span>{stats.testers}t</span>
            <span>{stats.products}p</span>
            <span>{stats.feedback}fb</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full flex items-center justify-between border border-red-500/40 bg-red-500/5 px-5 py-4">
          <span className="ryobi-heading text-xs text-red-400 tracking-widest">SEED FAILED — CHECK CONSOLE</span>
          <button onClick={() => setStatus('idle')} className="text-white/50 text-[10px] uppercase tracking-widest hover:text-white transition-colors">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

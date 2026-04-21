export default function Home() {
  return (
    <div className="min-h-screen bg-ryobi-black flex flex-col overflow-hidden relative">

      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(225,231,35,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(225,231,35,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-ryobi-yellow px-2.5 py-1">
            <span className="ryobi-heading text-ryobi-black font-black text-sm tracking-widest">RYOBI</span>
          </div>
          <span className="text-white/60 text-[11px] uppercase tracking-[0.25em] hidden sm:block">A TTI Inc. Brand</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/admin/seed" className="text-white/50 text-xs uppercase tracking-widest hover:text-ryobi-yellow transition-colors hidden sm:block">
            Admin
          </a>
          <span className="text-white/55 text-[11px] uppercase tracking-[0.2em]">Advanced Engineering</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">

        {/* Brand lockup */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-px h-4 bg-ryobi-yellow/50" />
          <span className="text-ryobi-yellow text-[11px] uppercase tracking-[0.4em] font-semibold">Beta Research Platform</span>
          <div className="w-px h-4 bg-ryobi-yellow/50" />
        </div>

        {/* Logo */}
        <div className="mb-2">
          <div className="text-white/55 text-xs uppercase tracking-[0.5em] mb-1">RYOBI® ONE+™</div>
          <h1 className="ryobi-heading font-black tracking-widest text-white"
            style={{ fontSize: 'clamp(3rem, 14vw, 7.5rem)', lineHeight: 1 }}>
            FIELD<span className="text-ryobi-yellow">LOOP</span>
          </h1>
        </div>

        <div className="w-12 h-px bg-ryobi-yellow mx-auto my-5" />

        <p className="text-white/75 text-sm max-w-xs sm:max-w-md leading-relaxed mb-10">
          Collect real-time product feedback from field testers. Swipe to rate, answer validated survey questions, and surface AI-synthesised research insights.
        </p>

        {/* Entry tiles */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full max-w-xs sm:max-w-lg">

          <a href="/tester" className="group relative overflow-hidden bg-ryobi-yellow p-7 text-left transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(225,231,35,0.3)] active:scale-[0.99]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-black/10 translate-x-6 -translate-y-6 rotate-12" />
            <div className="relative">
              <svg className="w-7 h-7 mb-4 text-ryobi-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ryobi-heading text-xl text-ryobi-black tracking-widest mb-1.5">FIELD TESTER</div>
              <p className="text-ryobi-black/70 text-xs leading-relaxed mb-5">
                Rate your assigned products, complete the survey, and leave voice or text notes.
              </p>
              <div className="flex items-center gap-2 text-ryobi-black ryobi-heading text-xs tracking-widest">
                ENTER
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </div>
          </a>

          <a href="/dashboard" className="group relative overflow-hidden bg-ryobi-dark border border-white/15 p-7 text-left transition-all hover:-translate-y-1 hover:border-ryobi-yellow hover:shadow-[0_20px_60px_rgba(225,231,35,0.1)] active:scale-[0.99]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-ryobi-yellow/5 translate-x-6 -translate-y-6 rotate-12" />
            <div className="relative">
              <svg className="w-7 h-7 mb-4 text-ryobi-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="ryobi-heading text-xl text-white tracking-widest mb-1.5">DASHBOARD</div>
              <p className="text-white/70 text-xs leading-relaxed mb-5">
                Live feedback data, AI research synthesis, statistical analysis and significance testing.
              </p>
              <div className="flex items-center gap-2 text-ryobi-yellow ryobi-heading text-xs tracking-widest">
                OPEN
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </div>
          </a>

        </div>

        {/* TTI brand strip */}
        <div className="mt-10 flex items-center gap-4">
          <div className="w-8 h-px bg-white/20" />
          <span className="text-white/50 text-[10px] uppercase tracking-[0.35em]">TTI Advanced Engineering · Anderson, SC</span>
          <div className="w-8 h-px bg-white/20" />
        </div>

        {/* Brand values */}
        <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-sm text-center">
          {[
            { label: 'Innovation First', sub: 'Engineering that sets the standard' },
            { label: 'ONE+ Platform',    sub: 'One battery. Every tool.' },
            { label: 'Field-Proven',     sub: 'Tested by the people who use it' },
          ].map(v => (
            <div key={v.label} className="flex flex-col gap-1">
              <div className="text-ryobi-yellow text-[10px] font-bold uppercase tracking-wider">{v.label}</div>
              <div className="text-white/55 text-[9px] leading-snug">{v.sub}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 px-5 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-lg mx-auto">
          <span className="text-white/45 text-[10px] uppercase tracking-[0.3em]">Powered by Claude AI · Anthropic</span>
          <div className="flex items-center gap-5">
            <a href="mailto:research@fieldloop.demo" className="text-white/55 text-[10px] uppercase tracking-widest hover:text-ryobi-yellow transition-colors">
              Contact Us
            </a>
            <a href="mailto:support@fieldloop.demo?subject=Technical%20Difficulty" className="text-white/55 text-[10px] uppercase tracking-widest hover:text-white transition-colors">
              Technical Difficulties?
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}

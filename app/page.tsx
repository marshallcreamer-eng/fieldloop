export default function Home() {
  return (
    <div className="min-h-screen bg-ryobi-black flex flex-col overflow-hidden relative">

      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(225,231,35,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(225,231,35,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-ryobi-yellow px-2.5 py-1">
            <span className="ryobi-heading text-ryobi-black font-black text-base tracking-widest">RYOBI</span>
          </div>
          <span className="text-white/30 text-xs uppercase tracking-[0.2em]">Advanced Engineering</span>
        </div>
        <a href="/admin/seed" className="text-white/20 text-xs uppercase tracking-widest hover:text-white/50 transition-colors">
          Admin
        </a>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3">
          <span className="text-ryobi-yellow text-xs uppercase tracking-[0.4em] font-semibold">Beta Research Platform</span>
        </div>

        <h1 className="ryobi-heading font-black tracking-widest text-white mb-1"
          style={{ fontSize: 'clamp(3.5rem, 12vw, 8rem)', lineHeight: 1 }}>
          FIELD<span className="text-ryobi-yellow">LOOP</span>
        </h1>

        <div className="w-16 h-px bg-ryobi-yellow mx-auto my-6" />

        <p className="text-white/40 text-sm max-w-md leading-relaxed mb-14">
          Collect real-time feedback from field testers. Swipe to rate, answer validated survey questions, and review AI-synthesised research insights.
        </p>

        {/* Entry tiles */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg">

          <a href="/tester" className="group relative overflow-hidden bg-ryobi-yellow p-8 text-left transition-transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(225,231,35,0.25)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-black/10 translate-x-8 -translate-y-8 rotate-12" />
            <div className="relative">
              <div className="text-3xl mb-4">🔧</div>
              <div className="ryobi-heading text-2xl text-ryobi-black tracking-widest mb-2">FIELD TESTER</div>
              <p className="text-ryobi-black/60 text-xs leading-relaxed mb-6">
                Rate your assigned products, complete the survey, and leave voice or text notes.
              </p>
              <div className="flex items-center gap-2 text-ryobi-black ryobi-heading text-sm tracking-widest">
                ENTER
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </div>
          </a>

          <a href="/dashboard" className="group relative overflow-hidden bg-ryobi-dark border border-white/10 p-8 text-left transition-transform hover:-translate-y-1 hover:border-ryobi-yellow hover:shadow-[0_20px_60px_rgba(225,231,35,0.1)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ryobi-yellow/5 translate-x-8 -translate-y-8 rotate-12" />
            <div className="relative">
              <div className="text-3xl mb-4">📊</div>
              <div className="ryobi-heading text-2xl text-white tracking-widest mb-2">DASHBOARD</div>
              <p className="text-white/40 text-xs leading-relaxed mb-6">
                Live feedback data, AI research synthesis, statistical analysis and significance testing.
              </p>
              <div className="flex items-center gap-2 text-ryobi-yellow ryobi-heading text-sm tracking-widest">
                OPEN
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </div>
          </a>

        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4 border-t border-white/5">
        <span className="text-white/15 text-xs uppercase tracking-[0.3em]">Powered by Claude AI</span>
      </div>

    </div>
  )
}

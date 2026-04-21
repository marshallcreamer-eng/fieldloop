import RyobiHeader from '@/components/RyobiHeader'

export default function Home() {
  return (
    <div className="min-h-screen bg-ryobi-black flex flex-col">
      <RyobiHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">

        {/* Wordmark */}
        <div className="mb-2">
          <span className="text-ryobi-gray text-xs uppercase tracking-[0.3em] font-semibold">Advanced Engineering</span>
        </div>
        <h1 className="ryobi-heading text-5xl md:text-7xl text-white tracking-widest mb-2">FIELDLOOP</h1>
        <p className="text-ryobi-gray text-sm mb-12 max-w-sm leading-relaxed">
          Real-time field tester feedback platform. Collect reactions, survey data, and AI-synthesised research insights.
        </p>

        {/* Two entry points */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-xl">

          {/* Tester entry */}
          <a href="/tester"
            className="group bg-ryobi-yellow p-6 text-left hover:bg-white transition-colors">
            <div className="text-4xl mb-3">🔧</div>
            <div className="ryobi-heading text-xl text-ryobi-black mb-1 group-hover:text-ryobi-dark">Field Tester View</div>
            <p className="text-ryobi-dark text-xs leading-relaxed opacity-80">
              Rate products, answer survey questions, and leave voice comments. Designed for testers in the field.
            </p>
            <div className="mt-4 text-ryobi-black ryobi-heading text-sm uppercase tracking-widest">
              Enter →
            </div>
          </a>

          {/* Research entry */}
          <a href="/dashboard"
            className="group bg-ryobi-dark border border-ryobi-muted p-6 text-left hover:border-ryobi-yellow transition-colors">
            <div className="text-4xl mb-3">📊</div>
            <div className="ryobi-heading text-xl text-white mb-1">Research Dashboard</div>
            <p className="text-ryobi-gray text-xs leading-relaxed">
              Live feedback counter, reaction breakdown, survey scores, AI synthesis, and significance testing.
            </p>
            <div className="mt-4 text-ryobi-yellow ryobi-heading text-sm uppercase tracking-widest">
              Open →
            </div>
          </a>

        </div>

        {/* Bottom note */}
        <p className="text-ryobi-gray text-xs mt-10 uppercase tracking-widest opacity-50">
          Powered by Claude AI · Built for TTI Advanced Engineering
        </p>
      </div>
    </div>
  )
}

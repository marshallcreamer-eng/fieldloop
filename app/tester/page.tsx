import { createSupabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TesterHome() {
  const supabase = createSupabase()
  const demoEmail = 'jake@fieldloop.demo'
  const { data: tester } = await supabase.from('testers').select('*').eq('email', demoEmail).single()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, product:products(*)')
    .eq('tester_id', tester?.id)
    .eq('status', 'active')

  const today = new Date().toISOString().split('T')[0]
  const { data: todayFeedback } = await supabase
    .from('feedback')
    .select('product_id')
    .eq('tester_id', tester?.id)
    .eq('session_date', today)

  const submittedToday = new Set((todayFeedback || []).map(f => f.product_id))
  const doneCount = assignments?.filter(a => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = a.product as any
    return submittedToday.has(p.id)
  }).length ?? 0
  const totalCount = assignments?.length ?? 0

  return (
    <div className="min-h-screen bg-ryobi-black flex flex-col">

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(225,231,35,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(225,231,35,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-ryobi-yellow px-2.5 py-1">
            <span className="ryobi-heading text-ryobi-black font-black text-sm tracking-widest">RYOBI</span>
          </div>
          <span className="text-white/60 text-xs uppercase tracking-[0.2em]">Field Testing</span>
        </div>
        <div className="text-right">
          <div className="text-ryobi-yellow text-[10px] font-bold uppercase tracking-wider">{tester?.region}</div>
          <div className="text-white text-xs font-semibold">{tester?.name}</div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 max-w-lg mx-auto w-full px-4 py-8">

        {/* Greeting + progress */}
        <div className="mb-6">
          <div className="text-ryobi-yellow text-xs uppercase tracking-[0.3em] font-semibold mb-1">Today&apos;s Session</div>
          <h1 className="ryobi-heading text-3xl text-white tracking-widest mb-4">
            Hi, {tester?.name?.split(' ')[0] ?? 'Tester'}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/15">
              <div
                className="h-full bg-ryobi-yellow transition-all duration-500"
                style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-white/65 text-xs font-mono tabular-nums">
              {doneCount}/{totalCount} today
            </span>
          </div>
        </div>

        {/* Testing notice */}
        <div className="mb-6 border border-ryobi-yellow/30 bg-ryobi-yellow/5 px-4 py-3 flex gap-3 items-start">
          <svg className="w-4 h-4 text-ryobi-yellow flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-ryobi-yellow text-xs font-bold uppercase tracking-widest mb-0.5">Beta Testing Only</div>
            <p className="text-white/70 text-xs leading-relaxed">
              This app is for authorised field testers only. Research data and analytics are available to the engineering team via a separate backend portal.
            </p>
          </div>
        </div>

        {/* Product cards */}
        <div className="flex flex-col gap-3">
          {assignments?.map(a => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const product = a.product as any
            const done = submittedToday.has(product.id)

            return (
              <Link
                key={a.id}
                href={`/tester/product/${product.id}`}
                className={`relative flex items-stretch overflow-hidden transition-all duration-150 active:scale-[0.99] group
                  ${done
                    ? 'bg-white/5 border border-white/10 opacity-50'
                    : 'bg-ryobi-dark border border-white/15 hover:border-ryobi-yellow hover:shadow-[0_8px_30px_rgba(225,231,35,0.08)]'
                  }`}
              >
                {/* Image */}
                <div className="relative w-20 flex-shrink-0 bg-black/40">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className={`object-cover transition-all duration-200 ${done ? 'opacity-25 grayscale' : 'opacity-95 group-hover:opacity-100'}`}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Yellow left accent */}
                <div className={`w-0.5 flex-shrink-0 transition-colors ${done ? 'bg-white/20' : 'bg-ryobi-yellow/50 group-hover:bg-ryobi-yellow'}`} />

                {/* Info */}
                <div className="px-4 py-4 flex-1 flex flex-col justify-between min-h-[80px]">
                  <div>
                    <div className="text-white/55 text-[10px] font-semibold uppercase tracking-widest">{product.category}</div>
                    <div className="ryobi-heading text-sm text-white mt-0.5 leading-snug line-clamp-2">{product.name}</div>
                    <div className="text-white/60 text-xs mt-1 line-clamp-1">{product.description}</div>
                  </div>
                  <div className="mt-2">
                    {done ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                        ✓ Submitted today
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ryobi-yellow">
                        Rate now →
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {totalCount === 0 && (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-white/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
            <p className="text-white/65 text-sm uppercase tracking-widest">No products assigned yet</p>
            <p className="text-white/45 text-xs mt-2">Ask your team to run a seed from /admin/seed</p>
          </div>
        )}

        <p className="text-center text-white/45 text-[10px] uppercase tracking-[0.3em] mt-10">
          Your feedback drives the next generation of RYOBI tools.
        </p>
      </div>
    </div>
  )
}

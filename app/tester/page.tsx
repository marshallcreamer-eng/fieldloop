import { createSupabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import RyobiHeader from '@/components/RyobiHeader'

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

  return (
    <div className="min-h-screen bg-ryobi-offwhite">
      <RyobiHeader
        subtitle="Field Testing"
        right={
          <div className="text-right">
            <div className="text-ryobi-yellow text-xs font-bold uppercase tracking-wider">{tester?.region}</div>
            <div className="text-white text-sm font-semibold">{tester?.name}</div>
          </div>
        }
      />

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="ryobi-heading text-2xl text-ryobi-dark">
            Hi, {tester?.name?.split(' ')[0]}
          </h1>
          <p className="text-ryobi-gray text-sm mt-1">
            {assignments?.length ?? 0} products assigned for testing
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {assignments?.map(a => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const product = a.product as any
            const done = submittedToday.has(product.id)

            return (
              <Link
                key={a.id}
                href={`/tester/product/${product.id}`}
                className="bg-white rounded-none border border-gray-200 overflow-hidden flex items-stretch hover:border-ryobi-yellow hover:shadow-md transition-all active:scale-[0.99] group"
              >
                <div className="relative w-24 flex-shrink-0 bg-ryobi-dark">
                  {product.image_url && (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" unoptimized />
                  )}
                </div>
                {/* Yellow accent bar */}
                <div className="w-1 bg-ryobi-yellow flex-shrink-0" />
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-ryobi-gray text-xs font-semibold uppercase tracking-wider">{product.category}</div>
                    <div className="ryobi-heading text-base text-ryobi-dark mt-0.5">{product.name}</div>
                    <div className="text-ryobi-gray text-xs mt-1 line-clamp-1">{product.description}</div>
                  </div>
                  <div className="mt-2">
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-green-700 bg-green-100 px-2 py-1">
                        ✓ Submitted today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ryobi-black bg-ryobi-yellow px-2 py-1">
                        Feedback needed →
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs text-ryobi-gray mt-8 uppercase tracking-wider">
          Your feedback drives the next generation of RYOBI tools.
        </p>
      </div>
    </div>
  )
}

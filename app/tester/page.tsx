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

  // Check if tester submitted feedback today for each product
  const today = new Date().toISOString().split('T')[0]
  const { data: todayFeedback } = await supabase
    .from('feedback')
    .select('product_id')
    .eq('tester_id', tester?.id)
    .eq('session_date', today)

  const submittedToday = new Set((todayFeedback || []).map(f => f.product_id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">FL</div>
          <div>
            <div className="text-xs text-gray-400">FieldLoop Beta</div>
            <div className="font-bold text-gray-800">Hi, {tester?.name?.split(' ')[0]} 👋</div>
          </div>
          <div className="ml-auto text-xs text-gray-400">{tester?.region}</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Your Products ({assignments?.length ?? 0})
        </h2>

        <div className="flex flex-col gap-3">
          {assignments?.map(a => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const product = a.product as any
            const done = submittedToday.has(product.id)

            return (
              <Link key={a.id} href={`/tester/product/${product.id}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex items-stretch hover:shadow-md transition-shadow active:scale-[0.99]">
                <div className="relative w-24 flex-shrink-0 bg-gray-100">
                  {product.image_url && (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-orange-500 font-semibold">{product.category}</div>
                    <div className="font-bold text-gray-800 text-sm mt-0.5">{product.name}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</div>
                  </div>
                  <div className="mt-2">
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        ✓ Submitted today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                        Feedback needed →
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Your feedback helps shape the final product. Thank you.
        </p>
      </div>
    </div>
  )
}

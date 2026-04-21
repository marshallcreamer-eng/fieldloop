import { createSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import FeedbackFlow from './FeedbackFlow'

export const dynamic = 'force-dynamic'

export default async function ProductFeedbackPage({ params }: { params: { productId: string } }) {
  const supabase = createSupabase()
  const { data: product } = await supabase.from('products').select('*').eq('id', params.productId).single()
  if (!product) notFound()

  const testerId = 'jake@fieldloop.demo'
  const { data: tester } = await supabase.from('testers').select('*').eq('email', testerId).single()
  const { data: assignment } = await supabase.from('assignments')
    .select('*').eq('tester_id', tester?.id).eq('product_id', product.id).single()

  if (!tester || !assignment) notFound()

  return <FeedbackFlow product={product} assignmentId={assignment.id} testerId={tester.name} />
}

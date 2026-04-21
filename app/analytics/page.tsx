import { createSupabase } from '@/lib/supabase'
import AnalyticsView from './AnalyticsView'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = createSupabase()
  const { data: products } = await supabase.from('products').select('*').order('name')
  return <AnalyticsView products={products ?? []} />
}

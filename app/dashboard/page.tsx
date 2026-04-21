import { createSupabase } from '@/lib/supabase'
import LiveDashboard from './LiveDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabase()
  const [{ data: products }, { data: feedback }, { data: insights }, { data: surveyRows }, { data: npsRows }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('ai_insights').select('*').order('generated_at', { ascending: false }),
    supabase.from('survey_responses')
      .select('question_key, score, feedback:feedback_id(product_id, session_date)'),
    supabase.from('survey_responses')
      .select('score, feedback:feedback_id(comment, product_id, session_date)')
      .eq('question_key', 'nps'),
  ])

  // Flat raw rows for client-side filtering (includes date)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const surveyRawData = (surveyRows ?? []).map((r: any) => ({
    question_key: r.question_key as string,
    score:        r.score as number,
    product_id:   (r.feedback?.product_id ?? '') as string,
    session_date: (r.feedback?.session_date ?? '') as string,
  })).filter(r => r.product_id)

  // NPS entries with verbatim follow-up comments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const npsData = (npsRows ?? []).map((r: any) => ({
    score:        r.score as number,
    comment:      (r.feedback?.comment ?? null) as string | null,
    product_id:   (r.feedback?.product_id ?? '') as string,
    session_date: (r.feedback?.session_date ?? '') as string,
  })).filter(r => r.product_id)

  return (
    <LiveDashboard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialFeedback={(feedback ?? []) as any}
      products={products ?? []}
      initialInsights={insights ?? []}
      surveyRawData={surveyRawData}
      npsData={npsData}
    />
  )
}

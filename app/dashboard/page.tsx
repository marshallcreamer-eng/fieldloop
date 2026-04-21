import { createSupabase } from '@/lib/supabase'
import LiveDashboard from './LiveDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabase()
  const [{ data: products }, { data: feedback }, { data: insights }, { data: surveyRows }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('ai_insights').select('*').order('generated_at', { ascending: false }),
    supabase.from('survey_responses').select('question_key, score, feedback:feedback(product_id)'),
  ])

  // Build nested structure: { product_id: { question_key: score[] } }
  const surveyScores: Record<string, Record<string, number[]>> = {}
  for (const row of surveyRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productId = (row.feedback as any)?.product_id
    if (!productId) continue
    if (!surveyScores[productId]) surveyScores[productId] = {}
    if (!surveyScores[productId][row.question_key]) surveyScores[productId][row.question_key] = []
    surveyScores[productId][row.question_key].push(row.score)
  }

  return (
    <LiveDashboard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialFeedback={(feedback ?? []) as any}
      products={products ?? []}
      initialInsights={insights ?? []}
      initialSurveyScores={surveyScores}
    />
  )
}

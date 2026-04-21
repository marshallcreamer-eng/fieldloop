import { NextRequest, NextResponse } from 'next/server'
import { createSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createSupabase()
  const body = await req.json()
  const { survey_scores, ...feedbackData } = body

  const { data: feedback, error } = await supabase.from('feedback').insert(feedbackData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (survey_scores && Object.keys(survey_scores).length > 0) {
    const responses = Object.entries(survey_scores).map(([question_key, score]) => ({
      feedback_id: feedback.id,
      question_key,
      score: score as number,
    }))
    await supabase.from('survey_responses').insert(responses)
  }

  return NextResponse.json({ success: true, feedback_id: feedback.id })
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createSupabase()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { product_id } = await req.json()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: cached } = await supabase
    .from('ai_insights').select('*').eq('product_id', product_id).eq('date', today).single()
  if (cached) return NextResponse.json(cached)

  const { data: product } = await supabase.from('products').select('name').eq('id', product_id).single()
  const { data: feedbackRows } = await supabase
    .from('feedback')
    .select('reaction, category, comment, session_date')
    .eq('product_id', product_id)
    .gte('session_date', sevenDaysAgo)
    .order('session_date', { ascending: false })

  if (!feedbackRows || feedbackRows.length === 0) {
    return NextResponse.json({ error: 'No feedback data' }, { status: 404 })
  }

  const reactionCounts = feedbackRows.reduce((acc: Record<string, number>, f) => {
    acc[f.reaction] = (acc[f.reaction] || 0) + 1
    return acc
  }, {})

  const comments = feedbackRows
    .filter((f) => f.comment)
    .map((f) => `[${f.reaction.toUpperCase()}] ${f.comment}`)

  const prompt = `You are a senior product researcher analyzing beta tester feedback for ${product?.name}.

Summary of last 7 days (${feedbackRows.length} submissions):
Reactions: ${JSON.stringify(reactionCounts)}

Tester comments:
${comments.slice(0, 20).join('\n')}

Provide a concise research summary with:
1. Three bullet-point key findings (each under 15 words, specific and actionable)
2. The single top theme in 5 words or fewer
3. An overall sentiment score from 1 (very negative) to 10 (very positive)

Respond in JSON only:
{
  "bullets": ["finding 1", "finding 2", "finding 3"],
  "top_theme": "theme here",
  "sentiment_score": 7.2
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (message.content[0] as { type: string; text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 })

  const parsed = JSON.parse(jsonMatch[0])
  const summary = parsed.bullets.map((b: string) => `• ${b}`).join('\n')

  const insight = {
    product_id,
    date: today,
    summary,
    top_theme: parsed.top_theme,
    sentiment_score: parsed.sentiment_score,
  }

  const { data: saved } = await supabase.from('ai_insights').insert(insight).select().single()
  return NextResponse.json(saved || insight)
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabase } from '@/lib/supabase'
import {
  getSampleTier, TIER_NOTES,
  mean, stdDev, median, mode, confidenceInterval,
  welchTTest, cohensD, effectSizeLabel, observedPower,
  computeNPS, npsMarginOfError, frequencyDist, trendByDate, groupByRegion,
} from '@/lib/stats'
import { SURVEY_QUESTIONS } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase   = createSupabase()
  const productId  = req.nextUrl.searchParams.get('product_id')
  const compareId  = req.nextUrl.searchParams.get('compare_id')

  // ── Load data ──────────────────────────────────────────────────────────────
  const [{ data: products }, { data: allFeedback }, { data: surveyRows }, { data: testers }] =
    await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('feedback').select('*, tester:testers(name, region)').order('session_date'),
      supabase.from('survey_responses').select('feedback_id, question_key, score'),
      supabase.from('testers').select('*'),
    ])

  if (!allFeedback || !products) return NextResponse.json({ error: 'No data' }, { status: 404 })
  // narrowed after null-guard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedback: any[] = allFeedback

  // ── Helpers ────────────────────────────────────────────────────────────────
  function feedbackForProduct(pid: string) {
    return feedback.filter((f) => f.product_id === pid)
  }

  function surveyScoresForProduct(pid: string, questionKey: string): number[] {
    const feedbackIds = new Set(feedbackForProduct(pid).map((f) => f.id))
    return surveyRows
      ?.filter((r) => feedbackIds.has(r.feedback_id) && r.question_key === questionKey)
      .map((r) => Number(r.score)) ?? []
  }

  // ── Per-product analytics ──────────────────────────────────────────────────
  function analyseProduct(pid: string) {
    const fb    = feedbackForProduct(pid)
    const n     = fb.length
    const tier  = getSampleTier(n)
    const note  = TIER_NOTES[tier]

    // Reaction distribution
    const reactionCounts = ['love', 'like', 'meh', 'dislike'].reduce((acc, r) => {
      acc[r] = fb.filter((f) => f.reaction === r).length
      return acc
    }, {} as Record<string, number>)

    const positiveRate = n > 0
      ? parseFloat(((reactionCounts.love + reactionCounts.like) / n * 100).toFixed(1))
      : 0

    // Trend (medium+)
    const trend = tier !== 'small'
      ? trendByDate(fb)
      : null

    // Regional (medium+)
    const regional = tier !== 'small'
      ? groupByRegion(fb.map((f) => ({ reaction: f.reaction, region: (f.tester as { region?: string })?.region })))
      : null

    // Survey stats
    const surveyStats = SURVEY_QUESTIONS.map((q) => {
      const scores = surveyScoresForProduct(pid, q.key)
      if (scores.length < 2) return null

      const isNPS  = q.scale === 'nps'
      const scale  = isNPS ? 10 : 7
      const m      = mean(scores)
      const sd     = stdDev(scores, m)
      const med    = median(scores)
      const mo     = mode(scores)
      const ci     = confidenceInterval(scores)
      const dist   = frequencyDist(scores, isNPS ? 0 : 1, scale)

      return {
        question_key:  q.key,
        question_text: q.text,
        scale,
        n:             scores.length,
        mean:          parseFloat(m.toFixed(2)),
        std_dev:       parseFloat(sd.toFixed(2)),
        median:        med,
        mode:          mo,
        ci_lower:      ci.lower,
        ci_upper:      ci.upper,
        ci_margin:     ci.margin,
        distribution:  dist,
        ...(q.scale === 'nps' ? {
          nps_score: computeNPS(scores),
          nps_moe:   npsMarginOfError(scores),
        } : {}),
      }
    }).filter(Boolean)

    return { product_id: pid, n, tier, note, reactionCounts, positiveRate, trend, regional, surveyStats }
  }

  // ── Comparison (large tier only) ───────────────────────────────────────────
  function compareProducts(pidA: string, pidB: string) {
    const productA = analyseProduct(pidA)
    const productB = analyseProduct(pidB)

    const comparisons = SURVEY_QUESTIONS.filter((q) => q.scale !== 'nps').map((q) => {
      const sA = surveyScoresForProduct(pidA, q.key)
      const sB = surveyScoresForProduct(pidB, q.key)
      if (sA.length < 2 || sB.length < 2) return null

      const tTest  = welchTTest(q.key, pidA, sA, pidB, sB)
      const d      = cohensD(sA, sB)
      const power  = d !== null ? observedPower(d, sA.length, sB.length) : null
      const label  = d !== null ? effectSizeLabel(d) : null

      return {
        question_key:  q.key,
        question_text: q.text,
        mean_a:        parseFloat(mean(sA).toFixed(2)),
        mean_b:        parseFloat(mean(sB).toFixed(2)),
        n_a:           sA.length,
        n_b:           sB.length,
        t_statistic:   tTest?.t_statistic ?? null,
        p_value:       tTest?.p_value ?? null,
        significant:   tTest?.significant ?? false,
        cohens_d:      d,
        effect_size:   label,
        power:         power,
        power_adequate: power !== null ? power >= 0.8 : false,
      }
    }).filter(Boolean)

    return { productA, productB, comparisons }
  }

  // ── Build response ─────────────────────────────────────────────────────────
  if (productId && compareId) {
    return NextResponse.json(compareProducts(productId, compareId))
  }

  if (productId) {
    return NextResponse.json(analyseProduct(productId))
  }

  // Default: summary across all products
  const summary = products.map((p) => {
    const fb   = feedbackForProduct(p.id)
    const n    = fb.length
    const tier = getSampleTier(n)
    const npsScores = surveyScoresForProduct(p.id, 'nps')
    return {
      product_id:    p.id,
      product_name:  p.name,
      n,
      tier,
      positive_rate: n > 0
        ? parseFloat(((fb.filter(f => f.reaction === 'love' || f.reaction === 'like').length / n) * 100).toFixed(1))
        : 0,
      nps:           computeNPS(npsScores),
      nps_n:         npsScores.length,
    }
  })

  return NextResponse.json({ products: summary, total_testers: testers?.length ?? 0 })
}

// Run: npx ts-node --project tsconfig.json scripts/seed.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const products = [
  {
    name: 'ProLine 20V Hammer Drill',
    description: 'Professional-grade brushless hammer drill with 3-speed gearbox and LED work light.',
    sku: 'PL-HD-20V',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600',
    category: 'Power Tools',
  },
  {
    name: 'FlexCharge 5Ah Battery Pack',
    description: 'High-capacity lithium-ion battery with cold-weather optimization and charge indicator.',
    sku: 'FC-5AH-20V',
    image_url: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600',
    category: 'Accessories',
  },
  {
    name: 'Orbital Sander Pro',
    description: 'Variable-speed random orbital sander with dust collection and ergonomic grip.',
    sku: 'OS-PRO-5IN',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    category: 'Power Tools',
  },
]

const testers = [
  { name: 'Jake Rivera', email: 'jake@fieldloop.demo', region: 'Southeast' },
  { name: 'Marcus Webb', email: 'marcus@fieldloop.demo', region: 'Midwest' },
  { name: 'Dana Chen', email: 'dana@fieldloop.demo', region: 'Northeast' },
  { name: 'Troy Simmons', email: 'troy@fieldloop.demo', region: 'Southwest' },
  { name: 'Lisa Park', email: 'lisa@fieldloop.demo', region: 'Northwest' },
]

const comments = [
  'Grip gets slippery after 30 min in humid conditions.',
  'Chuck slippage under high torque — had to re-tighten twice.',
  'Battery drain faster than expected below 50°F.',
  'LED work light is excellent, really helps in tight spaces.',
  'Surprisingly light for the power it delivers.',
  'The variable speed trigger is very responsive.',
  'Dust collection could be better — still getting debris.',
  'No issues after 3 days of continuous use on the job site.',
  'Vibration is lower than my current tool, hands felt less fatigued.',
  'Could use a belt clip — awkward to set down on scaffolding.',
  'Charge indicator LEDs are a nice touch.',
  'Felt underpowered driving 3-inch screws into hardwood.',
  'Switch feels solid, no wobble or play.',
  null,
  null,
  null,
]

const categories = ['performance', 'ergonomics', 'battery', 'safety', 'design', 'other'] as const
const reactions = ['love', 'like', 'meh', 'dislike'] as const
const reactionWeights = [0.3, 0.4, 0.2, 0.1]

function weightedReaction() {
  const r = Math.random()
  let cumulative = 0
  for (let i = 0; i < reactionWeights.length; i++) {
    cumulative += reactionWeights[i]
    if (r < cumulative) return reactions[i]
  }
  return 'like'
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function likertScore(mean: number, spread = 1.2): number {
  const score = mean + (Math.random() - 0.5) * spread * 2
  return Math.min(7, Math.max(1, Math.round(score)))
}

async function seed() {
  console.log('Seeding products...')
  const { data: productRows, error: pErr } = await supabase.from('products').insert(products).select()
  if (pErr) throw pErr

  console.log('Seeding testers...')
  const { data: testerRows, error: tErr } = await supabase.from('testers').insert(testers).select()
  if (tErr) throw tErr

  console.log('Creating assignments...')
  const assignments = []
  for (const tester of testerRows!) {
    for (const product of productRows!) {
      assignments.push({ tester_id: tester.id, product_id: product.id, status: 'active' })
    }
  }
  const { data: assignmentRows, error: aErr } = await supabase.from('assignments').insert(assignments).select()
  if (aErr) throw aErr

  console.log('Creating feedback + survey responses...')
  const feedbackToInsert = []
  for (let day = 7; day >= 0; day--) {
    const dayAssignments = assignmentRows!.filter(() => Math.random() > 0.3)
    for (const assignment of dayAssignments) {
      feedbackToInsert.push({
        assignment_id: assignment.id,
        tester_id: assignment.tester_id,
        product_id: assignment.product_id,
        reaction: weightedReaction(),
        category: categories[Math.floor(Math.random() * categories.length)],
        comment: comments[Math.floor(Math.random() * comments.length)],
        media_urls: [],
        session_date: daysAgo(day),
      })
    }
  }

  const { data: feedbackRows, error: fErr } = await supabase.from('feedback').insert(feedbackToInsert).select()
  if (fErr) throw fErr

  // Seed survey responses
  const surveyToInsert = []
  for (const fb of feedbackRows!) {
    // Scores correlated with reaction
    const baseMean = fb.reaction === 'love' ? 6.2 : fb.reaction === 'like' ? 5.0 : fb.reaction === 'meh' ? 3.5 : 2.2
    surveyToInsert.push(
      { feedback_id: fb.id, question_key: 'overall_satisfaction', score: likertScore(baseMean) },
      { feedback_id: fb.id, question_key: 'ease_of_use', score: likertScore(baseMean + 0.3) },
      { feedback_id: fb.id, question_key: 'performance_expectation', score: likertScore(baseMean - 0.2) },
      { feedback_id: fb.id, question_key: 'build_quality', score: likertScore(baseMean + 0.5) },
      { feedback_id: fb.id, question_key: 'nps', score: Math.min(10, Math.max(0, Math.round(baseMean * 1.5 - 0.5))) }
    )
  }

  const { error: sErr } = await supabase.from('survey_responses').insert(surveyToInsert)
  if (sErr) throw sErr

  console.log(`✓ Seeded ${productRows!.length} products, ${testerRows!.length} testers, ${feedbackRows!.length} feedback rows, ${surveyToInsert.length} survey responses`)
}

seed().catch(console.error)

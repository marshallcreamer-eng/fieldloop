import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const PRODUCTS = [
  {
    name: 'RYOBI 40V HP Brushless 21" Self-Propelled Mower',
    description: 'Whisper-quiet brushless motor with 7.5 Ah battery. 3-in-1 mulch, bag, and side discharge.',
    sku: 'RY401180',
    image_url: 'https://images.unsplash.com/photo-1458245201577-fc8a130b8829?w=800&q=80',
    category: 'Outdoor Power Equipment',
  },
  {
    name: 'RYOBI 40V Brushless String Trimmer',
    description: '15" cutting swath with AUTOFEED™ system. Compatible with all RYOBI 40V batteries.',
    sku: 'RY40250',
    image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
    category: 'Outdoor Power Equipment',
  },
  {
    name: 'RYOBI 40V HP Brushless Chainsaw (16")',
    description: '16" bar and chain with auto-oiler and tool-free chain tensioning. Cold-weather optimised.',
    sku: 'RY40550',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    category: 'Outdoor Power Equipment',
  },
  {
    name: 'RYOBI 40V 7.5 Ah MAX Power Battery',
    description: 'Extended runtime battery with cold-weather cell chemistry. Works with all 40V ONE+ tools.',
    sku: 'OP40750',
    image_url: 'https://images.unsplash.com/photo-1473308822086-710304d7d30c?w=800&q=80',
    category: 'Batteries & Chargers',
  },
  {
    name: 'RYOBI 40V HP Brushless Leaf Blower',
    description: '730 CFM with variable speed trigger. Turbo mode for wet leaves and heavy debris.',
    sku: 'RY40440',
    image_url: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&q=80',
    category: 'Outdoor Power Equipment',
  },
]

const TESTER_POOL = [
  { name: 'Jake Rivera',      email: 'jake@fieldloop.demo',      region: 'Southeast' },
  { name: 'Marcus Webb',      email: 'marcus@fieldloop.demo',    region: 'Midwest' },
  { name: 'Dana Chen',        email: 'dana@fieldloop.demo',      region: 'Northeast' },
  { name: 'Troy Simmons',     email: 'troy@fieldloop.demo',      region: 'Southwest' },
  { name: 'Lisa Park',        email: 'lisa@fieldloop.demo',      region: 'Northwest' },
  { name: 'Ray Hutchins',     email: 'ray@fieldloop.demo',       region: 'Southeast' },
  { name: 'Priya Nair',       email: 'priya@fieldloop.demo',     region: 'Midwest' },
  { name: 'Derek Osei',       email: 'derek@fieldloop.demo',     region: 'Northeast' },
  { name: 'Carla Moreno',     email: 'carla@fieldloop.demo',     region: 'Southwest' },
  { name: 'Ben Kowalski',     email: 'ben@fieldloop.demo',       region: 'Northwest' },
  { name: 'Angela Torres',    email: 'angela@fieldloop.demo',    region: 'Southeast' },
  { name: 'Steve Nakamura',   email: 'steve@fieldloop.demo',     region: 'Midwest' },
  { name: 'Faith Olusegun',   email: 'faith@fieldloop.demo',     region: 'Northeast' },
  { name: 'Kyle Brennan',     email: 'kyle@fieldloop.demo',      region: 'Southwest' },
  { name: 'Mia Johansson',    email: 'mia@fieldloop.demo',       region: 'Northwest' },
  { name: 'Darnell Cook',     email: 'darnell@fieldloop.demo',   region: 'Southeast' },
  { name: 'Rachel Huang',     email: 'rachel@fieldloop.demo',    region: 'Midwest' },
  { name: 'Greg Patel',       email: 'greg@fieldloop.demo',      region: 'Northeast' },
  { name: 'Vanessa Scott',    email: 'vanessa@fieldloop.demo',   region: 'Southwest' },
  { name: 'Omar Lindqvist',   email: 'omar@fieldloop.demo',      region: 'Northwest' },
  { name: 'Tasha Williams',   email: 'tasha@fieldloop.demo',     region: 'Southeast' },
  { name: 'Drew Castillo',    email: 'drew@fieldloop.demo',      region: 'Midwest' },
  { name: 'Nina Ferreira',    email: 'nina@fieldloop.demo',      region: 'Northeast' },
  { name: 'Brock Hammond',    email: 'brock@fieldloop.demo',     region: 'Southwest' },
  { name: 'Yuki Tanaka',      email: 'yuki@fieldloop.demo',      region: 'Northwest' },
  { name: 'Cedric Mason',     email: 'cedric@fieldloop.demo',    region: 'Southeast' },
  { name: 'Abby Nguyen',      email: 'abby@fieldloop.demo',      region: 'Midwest' },
  { name: 'Jared Okafor',     email: 'jared@fieldloop.demo',     region: 'Northeast' },
  { name: 'Sofia Petrov',     email: 'sofia@fieldloop.demo',     region: 'Southwest' },
  { name: 'Hank Delgado',     email: 'hank@fieldloop.demo',      region: 'Northwest' },
]

const COMMENTS = [
  // Performance
  'Startup is instant every time — love not dealing with pull cords.',
  'Cut quality on thick St. Augustine grass was impressive. Clean pass every time.',
  'Turbo mode on the blower is seriously powerful — cleared wet oak leaves no problem.',
  'Chain felt sluggish after about 45 min of continuous cutting. Needed a break.',
  'Self-propel speed felt too fast on slopes — almost got away from me.',
  'Trimmer head speed is great but takes a second to ramp up from idle.',
  'Cut through 8" pine branches without hesitation. Very impressed.',
  'Battery performance in 95°F heat was noticeably worse than mild days.',
  'Discharge chute placement is perfect — clippings land exactly where expected.',
  'Motor felt strong even at the end of a 2-hour session. No power fade.',
  // Ergonomics
  'Grip gets slippery after 30 min in humid conditions.',
  'Balanced perfectly. No arm fatigue after 45 minutes of trimming.',
  'Handle height is adjustable but the mechanism feels a bit loose.',
  'Really quiet compared to my neighbor\'s gas mower — neighbors actually thanked me.',
  'Vibration is much lower than my gas equivalent. Hands feel fine after an hour.',
  'Shoulder strap on the blower is a nice addition. Took pressure off my arm.',
  'The D-handle on the chainsaw gives great control in tight spots.',
  'Front bail bar on the mower is positioned slightly awkward — had to adjust grip.',
  'Weight distribution is well thought out. Doesn\'t pull forward or back.',
  'Folding handle locks down solid. No rattling during transport.',
  // Battery
  'Battery drain faster than expected below 50°F — lost about 20% capacity.',
  'Charge indicator LEDs are a nice touch. Knew exactly when to swap out.',
  'Got through my entire half-acre on a single charge. That\'s a win.',
  'Would love a battery level indicator on the tool itself, not just the pack.',
  'Charging time from empty is about 90 minutes — reasonable.',
  'Cold-weather performance is noticeably better than my old 18V packs.',
  'Battery clicked in solidly and didn\'t wobble at all during use.',
  'Ran two full tanks worth of trimming before the battery needed a charge.',
  // Safety & Build
  'Auto-oiler seems to be using oil faster than expected — kept needing to refill.',
  'Chain tension loosened after about an hour of cutting. Had to retighten twice.',
  'Kickback guard triggered once — worked exactly as it should.',
  'Build quality feels solid. No flex in the deck even on rough terrain.',
  'Blade brake stops fast — impressed by how quickly it cuts out.',
  'Bag connection point feels slightly fragile. Hope it holds up long-term.',
  'No issues after a full weekend of use. Really impressed overall.',
  'Would love a brushless indicator light on the tool body.',
  'Bag fills up fast on thick grass — a bigger bag option would be great.',
  'The rubber over-grip on the trigger is a nice detail — no slipping.',
  null, null, null, null, null, null,
]

const CATEGORIES = ['performance', 'ergonomics', 'battery', 'safety', 'design', 'other'] as const
const REACTIONS   = ['love', 'like', 'meh', 'dislike'] as const
const WEIGHTS     = [0.30, 0.42, 0.18, 0.10]

function weighted<T>(items: readonly T[], weights: number[]): T {
  let r = Math.random(), i = 0
  for (; i < weights.length - 1; i++) { r -= weights[i]; if (r <= 0) break }
  return items[i]
}

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function likert(mean: number, spread = 1.3) {
  return Math.min(7, Math.max(1, Math.round(mean + (Math.random() - 0.5) * spread * 2)))
}

function nps(mean: number) {
  return Math.min(10, Math.max(0, Math.round(mean + (Math.random() - 0.5) * 3)))
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin()
  const { numTesters = 10, numDays = 30, numProducts = 5, clearFirst = false } = await req.json()

  const clampedTesters  = Math.min(Math.max(numTesters, 1), TESTER_POOL.length)
  const clampedProducts = Math.min(Math.max(numProducts, 1), PRODUCTS.length)
  const clampedDays     = Math.min(Math.max(numDays, 1), 60)

  if (clearFirst) {
    await supabase.from('survey_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('ai_insights').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('testers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  // Products
  const { data: productRows, error: pErr } = await supabase
    .from('products').insert(PRODUCTS.slice(0, clampedProducts)).select()
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  // Testers
  const { data: testerRows, error: tErr } = await supabase
    .from('testers').insert(TESTER_POOL.slice(0, clampedTesters)).select()
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // Assignments (each tester gets every product)
  const assignments = testerRows!.flatMap(t =>
    productRows!.map(p => ({ tester_id: t.id, product_id: p.id, status: 'active' }))
  )
  const { data: assignmentRows, error: aErr } = await supabase.from('assignments').insert(assignments).select()
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

  // Feedback — random submissions spread over clampedDays, ~70% response rate per day
  const feedbackToInsert = []
  for (let day = clampedDays; day >= 0; day--) {
    for (const asgn of assignmentRows!) {
      if (Math.random() > 0.72) continue
      const reaction = weighted(REACTIONS, WEIGHTS)
      feedbackToInsert.push({
        assignment_id: asgn.id,
        tester_id: asgn.tester_id,
        product_id: asgn.product_id,
        reaction,
        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
        comment: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
        media_urls: [],
        session_date: daysAgo(day),
      })
    }
  }

  const { data: feedbackRows, error: fErr } = await supabase.from('feedback').insert(feedbackToInsert).select()
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 })

  // Survey responses — correlated with reaction
  const surveyToInsert = feedbackRows!.flatMap(fb => {
    const base = fb.reaction === 'love' ? 6.1 : fb.reaction === 'like' ? 5.0 : fb.reaction === 'meh' ? 3.4 : 2.1
    return [
      { feedback_id: fb.id, question_key: 'overall_satisfaction',    score: likert(base) },
      { feedback_id: fb.id, question_key: 'ease_of_use',             score: likert(base + 0.3) },
      { feedback_id: fb.id, question_key: 'performance_expectation', score: likert(base - 0.2) },
      { feedback_id: fb.id, question_key: 'build_quality',           score: likert(base + 0.4) },
      { feedback_id: fb.id, question_key: 'nps',                     score: nps(base * 1.5) },
    ]
  })

  const { error: sErr } = await supabase.from('survey_responses').insert(surveyToInsert)
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    stats: {
      products:         productRows!.length,
      testers:          testerRows!.length,
      feedback:         feedbackRows!.length,
      survey_responses: surveyToInsert.length,
    },
  })
}

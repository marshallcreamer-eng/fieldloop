export type Reaction = 'love' | 'like' | 'meh' | 'dislike'
export type FeedbackCategory = 'performance' | 'ergonomics' | 'battery' | 'safety' | 'design' | 'other'

export interface Product {
  id: string
  name: string
  description: string
  sku: string
  image_url: string
  category: string
  created_at: string
}

export interface Tester {
  id: string
  name: string
  email: string
  region: string
  created_at: string
}

export interface Assignment {
  id: string
  tester_id: string
  product_id: string
  status: 'active' | 'complete'
  assigned_at: string
  product?: Product
  tester?: Tester
}

export interface Feedback {
  id: string
  assignment_id: string
  tester_id: string
  product_id: string
  reaction: Reaction
  category: FeedbackCategory
  comment: string | null
  media_urls: string[]
  session_date: string
  created_at: string
  product?: Product
  tester?: Tester
  survey_responses?: SurveyResponse[]
}

// Likert-scale and NPS survey responses attached to each feedback submission
export interface SurveyResponse {
  id: string
  feedback_id: string
  question_key: string  // e.g. "overall_satisfaction", "ease_of_use", "nps"
  score: number         // 1-7 for Likert, 0-10 for NPS
  created_at: string
}

// Validated question bank used across all products
export interface SurveyQuestion {
  key: string
  text: string
  scale: 'likert7' | 'likert5' | 'nps'
  anchor_low: string
  anchor_high: string
  category?: FeedbackCategory
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: 'overall_satisfaction',
    text: 'Overall, how satisfied are you with this product?',
    scale: 'likert7',
    anchor_low: 'Very dissatisfied',
    anchor_high: 'Very satisfied',
  },
  {
    key: 'ease_of_use',
    text: 'The product was easy to use.',
    scale: 'likert7',
    anchor_low: 'Strongly disagree',
    anchor_high: 'Strongly agree',
  },
  {
    key: 'performance_expectation',
    text: 'The product performed as I expected it to.',
    scale: 'likert7',
    anchor_low: 'Strongly disagree',
    anchor_high: 'Strongly agree',
  },
  {
    key: 'build_quality',
    text: 'How would you rate the build quality and durability?',
    scale: 'likert7',
    anchor_low: 'Very poor',
    anchor_high: 'Excellent',
  },
  {
    key: 'nps',
    text: 'How likely are you to recommend this product to a colleague?',
    scale: 'nps',
    anchor_low: 'Not at all likely',
    anchor_high: 'Extremely likely',
  },
]

export interface AIInsight {
  id: string
  product_id: string
  date: string
  summary: string
  top_theme: string
  sentiment_score: number
  generated_at: string
  product?: Product
}

// Statistical summary for a product's survey question
export interface QuestionStats {
  question_key: string
  question_text: string
  n: number
  mean: number
  std_dev: number
  ci_lower: number   // 95% confidence interval
  ci_upper: number
  median: number
}

// Significance test result comparing two products on one question
export interface SignificanceTest {
  question_key: string
  product_a_id: string
  product_b_id: string
  t_statistic: number
  p_value: number
  significant: boolean  // p < 0.05
}

export type Database = {
  public: {
    Tables: {
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> }
      testers: { Row: Tester; Insert: Omit<Tester, 'id' | 'created_at'>; Update: Partial<Tester> }
      assignments: { Row: Assignment; Insert: Omit<Assignment, 'id' | 'assigned_at'>; Update: Partial<Assignment> }
      feedback: { Row: Feedback; Insert: Omit<Feedback, 'id' | 'created_at'>; Update: Partial<Feedback> }
      survey_responses: { Row: SurveyResponse; Insert: Omit<SurveyResponse, 'id' | 'created_at'>; Update: Partial<SurveyResponse> }
      ai_insights: { Row: AIInsight; Insert: Omit<AIInsight, 'id' | 'generated_at'>; Update: Partial<AIInsight> }
    }
  }
}

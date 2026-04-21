-- FieldLoop schema — run this in Supabase SQL editor

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text,
  image_url text,
  category text,
  created_at timestamptz default now()
);

create table testers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  region text,
  created_at timestamptz default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid references testers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  status text default 'active' check (status in ('active', 'complete')),
  assigned_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id) on delete cascade,
  tester_id uuid references testers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  reaction text not null check (reaction in ('love', 'like', 'meh', 'dislike')),
  category text check (category in ('performance', 'ergonomics', 'battery', 'safety', 'design', 'other')),
  comment text,
  media_urls text[] default '{}',
  session_date date default current_date,
  created_at timestamptz default now()
);

create table survey_responses (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references feedback(id) on delete cascade,
  question_key text not null,
  score numeric not null,
  created_at timestamptz default now()
);

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  date date default current_date,
  summary text,
  top_theme text,
  sentiment_score numeric,
  generated_at timestamptz default now()
);

-- Enable Realtime on feedback table
alter publication supabase_realtime add table feedback;

-- Indexes for common queries
create index on feedback(product_id);
create index on feedback(session_date);
create index on feedback(tester_id);
create index on survey_responses(feedback_id);
create index on survey_responses(question_key);

-- Scalez Media Marketing Automation Schema

-- Stores raw intake answers per slide
create table public.intake_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slide_id integer not null, -- 1–10
  answers jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_intake_answers_user_slide
  on public.intake_answers (user_id, slide_id);

-- Stores AI output per slide and approval status
create table public.slide_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slide_id integer not null,
  ai_output jsonb not null,
  approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_slide_results_user_slide
  on public.slide_results (user_id, slide_id);

-- Final assembled export for GHL / download
create table public.ai_full_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bundle jsonb not null, -- merged all slides
  created_at timestamptz default now()
);

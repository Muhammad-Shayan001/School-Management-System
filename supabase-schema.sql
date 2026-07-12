create extension if not exists "uuid-ossp";

create table if not exists public.courses (
  id text primary key,
  title text not null,
  topics_completed integer default 0,
  topics_total integer default 12,
  progress_percentage integer default 0,
  status text default 'ENROLLED',
  batch_number text default 'Batch-Unknown',
  roll_number text default 'STU-PENDING',
  campus text default 'HEC Accredited Centre',
  city text default 'Pakistan',
  attendance_count integer default 0,
  assignment_count integer default 0,
  schedule_slots text[] default '{}',
  role text default 'trainer',
  created_at timestamptz default now()
);

create table if not exists public.quizzes (
  id text primary key,
  title text not null,
  course_id text not null,
  total_questions integer default 10,
  time_limit_minutes integer default 20,
  status text default 'ACTIVE',
  score text,
  security_level text default 'Standard HEC Security',
  questions jsonb default '[]'::jsonb,
  role text default 'trainer',
  created_at timestamptz default now()
);

create table if not exists public.attendance (
  id text primary key,
  student_name text not null,
  roll_number text not null,
  course_id text not null,
  date text not null,
  status text default 'Present',
  late_minutes integer default 0,
  slot text default 'Supabase Managed Slot',
  role text default 'trainer',
  created_at timestamptz default now()
);

create table if not exists public.quiz_attempts (
  id text primary key,
  quiz_id text not null,
  student_id text not null,
  student_name text,
  submitted_at timestamptz default now(),
  score_earned numeric default 0,
  total_possible numeric default 0,
  role text default 'student'
);

create table if not exists public.student_answers (
  id text primary key,
  attempt_id text not null,
  question_id text not null,
  selected_option_id text,
  role text default 'student'
);

alter table public.courses enable row level security;
alter table public.quizzes enable row level security;
alter table public.attendance enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.student_answers enable row level security;

drop policy if exists "Allow anon full access to courses" on public.courses;
drop policy if exists "Allow anon full access to quizzes" on public.quizzes;
drop policy if exists "Allow anon full access to attendance" on public.attendance;
drop policy if exists "Allow anon full access to quiz_attempts" on public.quiz_attempts;
drop policy if exists "Allow anon full access to student_answers" on public.student_answers;

create policy "Allow anon full access to courses"
  on public.courses for all
  using (true)
  with check (true);

create policy "Allow anon full access to quizzes"
  on public.quizzes for all
  using (true)
  with check (true);

create policy "Allow anon full access to attendance"
  on public.attendance for all
  using (true)
  with check (true);

create policy "Allow anon full access to quiz_attempts"
  on public.quiz_attempts for all
  using (true)
  with check (true);

create policy "Allow anon full access to student_answers"
  on public.student_answers for all
  using (true)
  with check (true);

insert into public.courses (id, title, topics_completed, topics_total, progress_percentage, status, batch_number, roll_number, campus, city, attendance_count, assignment_count, schedule_slots, role)
values
  ('course-1', 'UI/UX Design Masterclass (PITB Registered)', 6, 19, 31, 'ENROLLED', 'Batch 42-Lahore (B-42)', 'LHR-2026-1082', 'Arfa Software Technology Park, PITB', 'Lahore', 15, 4, ARRAY['Monday 10:00 AM - 01:00 PM', 'Wednesday 10:00 AM - 01:00 PM'], 'trainer'),
  ('course-2', 'Advanced React & Next.js Frameworks', 12, 12, 100, 'COMPLETED', 'Batch 40-Karachi (B-40)', 'LHR-2026-1082', 'FAST-NUCES Main Campus', 'Karachi', 24, 8, ARRAY['Tuesday 02:00 PM - 05:00 PM', 'Thursday 02:00 PM - 05:00 PM'], 'trainer'),
  ('course-3', 'Introduction to Python & Artificial Intelligence', 0, 15, 0, 'ENROLLED', 'Batch 43-Islamabad (B-43)', 'LHR-2026-1082', 'NUST School of Electrical Eng & CS', 'Islamabad', 0, 0, ARRAY['Friday 04:00 PM - 07:00 PM'], 'trainer')
on conflict (id) do nothing;

insert into public.quizzes (id, title, course_id, total_questions, time_limit_minutes, status, score, security_level, questions, role)
values
  (
    'quiz-1',
    'UI/UX Design Fundamentals',
    'course-1',
    2,
    20,
    'PUBLISHED',
    '85',
    'Standard HEC Security',
    '[{"id":"q-1","prompt":"What does UX stand for?","points":2,"options":[{"id":"q-1-a","text":"User Experience","isCorrect":true},{"id":"q-1-b","text":"Universal Exchange","isCorrect":false}]},{"id":"q-2","prompt":"Which design tool is commonly used for wireframes?","points":3,"options":[{"id":"q-2-a","text":"Figma","isCorrect":true},{"id":"q-2-b","text":"Microsoft Word","isCorrect":false}]}]'::jsonb,
    'trainer'
  )
on conflict (id) do nothing;

insert into public.attendance (id, student_name, roll_number, course_id, date, status, late_minutes, slot, role)
values
  ('att-1', 'Shayan Javed', 'LHR-2026-1082', 'course-1', '2026-07-12', 'Present', 0, 'Morning Slot (09:00 AM - 12:00 PM)', 'trainer')
on conflict (id) do nothing;

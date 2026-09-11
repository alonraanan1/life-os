create extension if not exists pgcrypto;

create type public.task_status as enum ('inbox','today','completed');
create type public.goal_kind as enum ('monthly','long_term');

create table public.profiles (id uuid primary key default gen_random_uuid(), display_name text not null, timezone text not null default 'Asia/Jerusalem', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, name text not null, color text not null default '#E7A25D', icon text, created_at timestamptz not null default now(), unique(profile_id,name));
create table public.expenses (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, category_id uuid references public.categories on delete set null, amount numeric(12,2) not null check(amount>0), currency char(3) not null default 'ILS', description text, occurred_at timestamptz not null default now(), source text not null default 'manual', external_id text, created_at timestamptz not null default now(), unique(profile_id,external_id));
create table public.expense_intake (id uuid primary key default gen_random_uuid(), amount numeric(12,2) not null check(amount>0), category_name text not null, description text, occurred_at timestamptz not null, external_id text unique, source text not null default 'apple_shortcuts', created_at timestamptz not null default now());
create table public.budgets (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, category_id uuid references public.categories on delete cascade, month date not null check(date_trunc('month',month)=month), amount numeric(12,2) not null check(amount>=0), created_at timestamptz not null default now(), unique(profile_id,category_id,month));
create table public.tasks (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, title text not null, status public.task_status not null default 'inbox', due_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.habits (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, title text not null, emoji text, active boolean not null default true, created_at timestamptz not null default now());
create table public.habit_entries (id uuid primary key default gen_random_uuid(), habit_id uuid not null references public.habits on delete cascade, entry_date date not null, value integer not null default 1, created_at timestamptz not null default now(), unique(habit_id,entry_date));
create table public.goals (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, title text not null, kind public.goal_kind not null default 'monthly', target_value numeric(12,2) not null check(target_value>0), current_value numeric(12,2) not null default 0, target_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.check_ins (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade, mood smallint check(mood between 1 and 5), note text, occurred_at timestamptz not null default now(), created_at timestamptz not null default now());

create index expenses_profile_occurred_idx on public.expenses(profile_id,occurred_at desc);
create index tasks_profile_status_due_idx on public.tasks(profile_id,status,due_at);
create index habit_entries_habit_date_idx on public.habit_entries(habit_id,entry_date desc);

create view public.timeline as
 select profile_id,id,'expense'::text as event_type,description as title,occurred_at,amount::text as value from public.expenses
 union all select profile_id,id,'task',title,coalesce(completed_at,due_at,created_at),status::text from public.tasks
 union all select h.profile_id,e.id,'habit',h.title,e.entry_date::timestamptz,e.value::text from public.habit_entries e join public.habits h on h.id=e.habit_id
 union all select profile_id,id,'check_in',note,occurred_at,mood::text from public.check_ins;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;
alter table public.goals enable row level security;
alter table public.check_ins enable row level security;

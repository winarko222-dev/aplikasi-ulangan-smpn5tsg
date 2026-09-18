-- SMPN5TSG - Supabase production schema
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
-- Jangan masukkan service_role key ke frontend atau GitHub.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'guru', 'student');
create type public.exam_status as enum ('draft', 'active', 'closed');
create type public.result_status as enum ('pending', 'submitted', 'graded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null unique,
  role public.app_role not null default 'student',
  nis text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  class_name text not null unique check (char_length(class_name) between 1 and 40),
  homeroom_teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, subject_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  nis text not null unique,
  created_at timestamptz not null default now()
);

create table public.exam_links (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  url text not null check (url ~* '^https?://'),
  status public.exam_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exam_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  exam_link_id uuid not null references public.exam_links(id) on delete cascade,
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  status public.result_status not null default 'pending',
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, exam_link_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  entity text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_class_subjects_teacher on public.class_subjects(teacher_id);
create index idx_students_class on public.students(class_id);
create index idx_exam_links_class on public.exam_links(class_id);
create index idx_exam_results_student on public.exam_results(student_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger exam_links_updated_at before update on public.exam_links
for each row execute function public.set_updated_at();
create trigger exam_results_updated_at before update on public.exam_results
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, nis)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    case
      when (new.raw_user_meta_data->>'role') in ('admin', 'guru', 'student')
        then (new.raw_user_meta_data->>'role')::public.app_role
      else 'student'::public.app_role
    end,
    nullif(new.raw_user_meta_data->>'nis', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role() = 'admin'::public.app_role;
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role() = 'guru'::public.app_role;
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.students enable row level security;
alter table public.exam_links enable row level security;
alter table public.exam_results enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_self_or_admin on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy profiles_admin_all on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy classes_admin_all on public.classes
for all using (public.is_admin()) with check (public.is_admin());
create policy classes_teacher_select on public.classes
for select using (
  exists (select 1 from public.class_subjects cs where cs.class_id = classes.id and cs.teacher_id = auth.uid())
  or homeroom_teacher_id = auth.uid()
);
create policy classes_student_select on public.classes
for select using (
  exists (select 1 from public.students s where s.class_id = classes.id and s.profile_id = auth.uid())
);

create policy subjects_authenticated_select on public.subjects
for select using (auth.uid() is not null);
create policy subjects_admin_insert on public.subjects
for insert with check (public.is_admin());
create policy subjects_admin_update on public.subjects
for update using (public.is_admin()) with check (public.is_admin());
create policy subjects_admin_delete on public.subjects
for delete using (public.is_admin());

create policy class_subjects_admin_all on public.class_subjects
for all using (public.is_admin()) with check (public.is_admin());
create policy class_subjects_teacher_select on public.class_subjects
for select using (teacher_id = auth.uid());
create policy class_subjects_teacher_insert on public.class_subjects
for insert with check (public.is_teacher() and teacher_id = auth.uid());
create policy class_subjects_teacher_update on public.class_subjects
for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy students_admin_all on public.students
for all using (public.is_admin()) with check (public.is_admin());
create policy students_teacher_select on public.students
for select using (exists (
  select 1 from public.class_subjects cs
  where cs.class_id = students.class_id and cs.teacher_id = auth.uid()
));
create policy students_self_select on public.students
for select using (profile_id = auth.uid());

create policy exam_links_admin_all on public.exam_links
for all using (public.is_admin()) with check (public.is_admin());
create policy exam_links_teacher_select on public.exam_links
for select using (exists (
  select 1 from public.class_subjects cs
  where cs.class_id = exam_links.class_id and cs.subject_id = exam_links.subject_id and cs.teacher_id = auth.uid()
));
create policy exam_links_teacher_insert on public.exam_links
for insert with check (public.is_teacher() and created_by = auth.uid());
create policy exam_links_student_select on public.exam_links
for select using (status = 'active' and exists (
  select 1 from public.students s where s.class_id = exam_links.class_id and s.profile_id = auth.uid()
));

create policy results_admin_all on public.exam_results
for all using (public.is_admin()) with check (public.is_admin());
create policy results_student_select on public.exam_results
for select using (exists (
  select 1 from public.students s where s.id = exam_results.student_id and s.profile_id = auth.uid()
));
create policy results_teacher_select on public.exam_results
for select using (exists (
  select 1 from public.exam_links e
  join public.class_subjects cs on cs.class_id = e.class_id and cs.subject_id = e.subject_id
  where e.id = exam_results.exam_link_id and cs.teacher_id = auth.uid()
));

create policy audit_admin_select on public.audit_logs
for select using (public.is_admin());
create policy audit_authenticated_insert on public.audit_logs
for insert with check (actor_id = auth.uid());

insert into public.subjects (name) values
  ('Matematika'), ('IPA'), ('Bahasa Indonesia'), ('IPS'), ('PKN')
on conflict (name) do nothing;

-- Setelah membuat user Admin melalui Authentication > Users,
-- jalankan contoh berikut dengan UUID user tersebut:
-- update public.profiles set role = 'admin' where id = 'UUID_USER_ADMIN';

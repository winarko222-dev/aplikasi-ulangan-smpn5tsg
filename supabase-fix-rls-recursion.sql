-- Perbaikan RLS: fungsi role tidak boleh membaca profiles melalui RLS.
-- Jalankan sekali di Supabase SQL Editor.

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'::public.app_role
  );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'guru'::public.app_role
  );
$$;

-- Pastikan Guru dapat membaca kelasnya tanpa subquery berulang ke policy classes.
drop policy if exists classes_teacher_select on public.classes;
create policy classes_teacher_select on public.classes
for select using (homeroom_teacher_id = auth.uid());

-- Hindari error saat tombol tambah kelas dipakai berulang.
-- Nama kelas tetap unik; aplikasi sekarang memberi pesan yang lebih jelas.

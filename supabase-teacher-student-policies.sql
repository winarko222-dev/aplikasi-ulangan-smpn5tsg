-- Tambahan akses Guru untuk mengelola siswa yang sudah memiliki akun Auth.
-- Jalankan sekali di Supabase SQL Editor.

drop policy if exists profiles_teacher_select_students on public.profiles;
create policy profiles_teacher_select_students on public.profiles
for select using (
  role = 'student'
  and public.is_teacher()
);

drop policy if exists students_teacher_insert_homeroom on public.students;
create policy students_teacher_insert_homeroom on public.students
for insert with check (
  public.is_teacher()
  and exists (
    select 1 from public.classes c
    where c.id = students.class_id
      and c.homeroom_teacher_id = auth.uid()
  )
  and exists (
    select 1 from public.profiles p
    where p.id = students.profile_id and p.role = 'student'
  )
);

drop policy if exists students_teacher_update_homeroom on public.students;
create policy students_teacher_update_homeroom on public.students
for update using (exists (
  select 1 from public.classes c
  where c.id = students.class_id and c.homeroom_teacher_id = auth.uid()
)) with check (exists (
  select 1 from public.classes c
  where c.id = students.class_id and c.homeroom_teacher_id = auth.uid()
));

drop policy if exists students_teacher_delete_homeroom on public.students;
create policy students_teacher_delete_homeroom on public.students
for delete using (exists (
  select 1 from public.classes c
  where c.id = students.class_id and c.homeroom_teacher_id = auth.uid()
));

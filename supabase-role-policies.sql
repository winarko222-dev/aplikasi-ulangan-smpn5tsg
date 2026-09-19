-- SMPN5TSG role policy migration
-- Jalankan sekali di Supabase SQL Editor setelah supabase-schema.sql.
-- Migration ini memberi Guru hak operasional sesuai konsep aplikasi.

create policy classes_teacher_insert on public.classes
for insert with check (public.is_teacher() and homeroom_teacher_id = auth.uid());

create policy classes_teacher_update on public.classes
for update using (homeroom_teacher_id = auth.uid())
with check (homeroom_teacher_id = auth.uid());

create policy classes_teacher_delete on public.classes
for delete using (homeroom_teacher_id = auth.uid());

create policy subjects_teacher_insert on public.subjects
for insert with check (public.is_teacher());

create policy subjects_teacher_update on public.subjects
for update using (public.is_teacher()) with check (public.is_teacher());

create policy subjects_teacher_delete on public.subjects
for delete using (public.is_teacher());

-- Guru dapat melihat siswa pada kelas yang menjadi kelasnya.
create policy students_teacher_select_homeroom on public.students
for select using (exists (
  select 1 from public.classes c
  where c.id = students.class_id and c.homeroom_teacher_id = auth.uid()
));

-- Guru dapat melihat dan membuat link ulangan untuk kelasnya.
create policy exam_links_teacher_select_homeroom on public.exam_links
for select using (exists (
  select 1 from public.classes c
  where c.id = exam_links.class_id and c.homeroom_teacher_id = auth.uid()
));

create policy exam_links_teacher_insert_homeroom on public.exam_links
for insert with check (
  public.is_teacher()
  and created_by = auth.uid()
  and exists (
    select 1 from public.classes c
    where c.id = exam_links.class_id and c.homeroom_teacher_id = auth.uid()
  )
);

create policy exam_links_teacher_update_homeroom on public.exam_links
for update using (created_by = auth.uid())
with check (created_by = auth.uid());

-- Guru dapat melihat hasil untuk link yang dibuatnya.
create policy results_teacher_select_own_links on public.exam_results
for select using (exists (
  select 1 from public.exam_links e
  where e.id = exam_results.exam_link_id and e.created_by = auth.uid()
));

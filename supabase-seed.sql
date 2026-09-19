-- 1) Pastikan profil dibuat untuk semua user yang masuk.
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
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      nis = coalesce(public.profiles.nis, excluded.nis),
      role = public.profiles.role;
  return new;
end;
$$;

-- 2) Pastikan semua role perlu diatur manual bila tidak sesuai.
-- Contoh:
-- update public.profiles set role = 'admin' where email = 'admin@sekolah.sch.id';
-- update public.profiles set role = 'guru' where email = 'guru1@sekolah.sch.id';
-- update public.profiles set role = 'student' where email = 'siswa1@sekolah.sch.id';

-- 3) Data master minimal dipasang dari aplikasi.
insert into public.subjects (name)
values ('Matematika'), ('IPA'), ('Bahasa Indonesia'), ('IPS'), ('PKN')
on conflict (name) do nothing;

-- 4) Data kelas contoh.
insert into public.classes (class_name)
values ('VII-A'), ('VII-B'), ('VIII-A'), ('VIII-B'), ('IX-A')
on conflict (class_name) do nothing;

# Langkah pengaktifan Admin–Guru–Siswa

Aplikasi sudah memakai tiga role dari Supabase:

- `admin`: administrator; mengelola seluruh data dan melihat akun guru.
- `guru`: dapat menambah kelas, mata pelajaran, dan link Google Forms untuk kelasnya.
- `student`: melihat ulangan aktif dan nilai sendiri.

## Wajib dijalankan

Di Supabase SQL Editor, jalankan terlebih dahulu `supabase-schema.sql`, kemudian jalankan `supabase-role-policies.sql` satu kali. File kedua menambahkan izin Guru yang diperlukan oleh menu aplikasi.

## Membuat Admin

1. Buka Authentication → Users → Add user.
2. Buat user dan aktifkan Auto Confirm User bila diperlukan.
3. Jalankan:

```sql
update public.profiles
set role = 'admin', full_name = 'Administrator'
where email = 'EMAIL_ADMIN';
```

## Membuat Guru

1. Admin membuat akun guru melalui Authentication → Users → Add user.
2. Jalankan:

```sql
update public.profiles
set role = 'guru', full_name = 'Nama Guru'
where email = 'EMAIL_GURU';
```

3. Guru login dengan pilihan role **Guru**.
4. Guru dapat menambah kelas, mata pelajaran, dan link ulangan dari aplikasi.

Frontend tidak boleh membuat akun Auth atau menyimpan password. Pembuatan akun Auth harus dilakukan di Dashboard Supabase atau backend aman menggunakan service role.

## Membuat Siswa

1. Buat akun siswa di Authentication → Users.
2. Ubah profilnya:

```sql
update public.profiles
set role = 'student', full_name = 'Nama Siswa', nis = 'NIS_SISWA'
where email = 'EMAIL_SISWA';
```

3. Setelah kelas dibuat, hubungkan siswa ke kelas:

```sql
insert into public.students (profile_id, class_id, nis)
select p.id, c.id, p.nis
from public.profiles p
cross join public.classes c
where p.email = 'EMAIL_SISWA'
  and c.class_name = 'VII-A'
  and p.role = 'student'
on conflict (profile_id) do update
set class_id = excluded.class_id, nis = excluded.nis;
```

Jangan menaruh password, `service_role key`, atau token rahasia di `config.js` maupun GitHub.

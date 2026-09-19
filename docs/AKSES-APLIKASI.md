# Model akses aplikasi SMPN5TSG

## Hak akses

- **Admin**: administrator sekolah; mengatur seluruh data dan mengelola daftar akun guru.
- **Guru**: dapat menambah kelas, mata pelajaran, siswa yang sudah terdaftar, dan link Google Forms sesuai kebijakan RLS.
- **Siswa**: hanya melihat ulangan aktif dan nilai sendiri.

## Membuat akun guru dengan aman

Karena aplikasi berjalan di browser, aplikasi tidak boleh membuat user Auth menggunakan `service_role key`. Admin membuat akun melalui:

1. Supabase → **Authentication → Users → Add user**.
2. Isi email dan password guru. Aktifkan **Auto Confirm User** bila diperlukan.
3. Buka SQL Editor dan ubah profil user tersebut:

```sql
update public.profiles
set role = 'guru', full_name = 'Nama Guru'
where email = 'guru@sekolah.id';
```

Password tidak disimpan di `localStorage`, GitHub, atau JavaScript.

## Data kelas, mapel, siswa, dan link

- Admin dan guru menambah kelas serta mata pelajaran dari aplikasi.
- Data disimpan di tabel Supabase melalui RLS.
- Akun siswa dibuat di Authentication → Users, kemudian profil dan kelas siswa dilengkapi di tabel `profiles` dan `students`.
- Link Google Forms dibuat dari menu **Link Google Forms**.

Pastikan `supabase-schema.sql` sudah dijalankan dan RLS aktif sebelum dipakai oleh pengguna sekolah.

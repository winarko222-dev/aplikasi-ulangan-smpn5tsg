# Integrasi Supabase, Google Forms, dan Google Sheets

## 1. Supabase
1. Buat project di Supabase.
2. Buka **SQL Editor**, jalankan isi `supabase-schema.sql` (jika file schema belum ada, gunakan schema pada dokumentasi produksi untuk membuat tabel `profiles`, `classes`, `students`, `subjects`, `class_subjects`, `exam_links`, dan `exam_results`).
3. Aktifkan Email/Password pada **Authentication → Providers**.
4. Tambahkan user admin melalui **Authentication → Users**, lalu isi profil admin di tabel `profiles` dengan role `admin`.
5. Salin **Project URL** dan **anon public key** ke `config.js`.
6. Jangan pernah menaruh `service_role key` di GitHub atau browser.

## 2. Google Apps Script sebagai jembatan Forms/Sheets
1. Buat Google Sheet respons Forms.
2. Buka **Extensions → Apps Script**.
3. Salin file `google-apps-script/Code.gs` ke editor Apps Script.
4. Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` hanya di **Project Settings → Script properties**. Jangan commit key.
5. Sesuaikan nama kolom `EMAIL`, `NILAI`, `FORM_ID`, dan `KELAS` dengan sheet Anda.
6. Deploy sebagai Web app. Pilih execute as owner dan batasi akses sesuai kebutuhan.
7. Masukkan URL Web App ke `config.js` pada `googleAppsScriptUrl`.

## 3. Alur sinkronisasi
- Google Forms menyimpan jawaban ke Google Sheets.
- Trigger `onFormSubmit` menjalankan Apps Script.
- Script memvalidasi baris, mencari siswa berdasarkan email/NIS, lalu mengirim nilai ke endpoint Supabase.
- Aplikasi membaca `exam_results` melalui RLS sesuai role.

## Catatan keamanan
GitHub Pages hanya menyimpan anon key Supabase; anon key memang boleh di frontend jika RLS benar. Service role key hanya boleh berada di Script Properties/backend. Jangan gunakan email bebas untuk login siswa pada produksi.

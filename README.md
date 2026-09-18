# Urutan setup produksi SMPN5TSG

## 1. Supabase
1. Buat project Supabase.
2. Jalankan `supabase-schema.sql` di SQL Editor.
3. Aktifkan Authentication > Providers > Email.
4. Buat user admin di Authentication > Users.
5. Jalankan `update public.profiles set role = 'admin' where email = 'winarko222@guru.smp.belajar.id';`.
6. Isi `config.js` dengan Project URL dan anon public key.
7. Set `useSupabase: true`.
8. Uji login. Jika email confirmation aktif, konfirmasi email terlebih dahulu.

## 2. Google Forms dan Sheets
1. Buat Google Form dan hubungkan ke Google Sheet.
2. Tambahkan pertanyaan/kolom `Email`, `NIS`, `Nilai`, dan `exam_link_id`.
3. Buka Extensions > Apps Script pada spreadsheet tersebut.
4. Salin `google-apps-script/Code.gs`.
5. Tambahkan Script Properties:
   - `SUPABASE_URL`: URL project Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key Supabase
6. Pasang installable trigger untuk fungsi `onFormSubmit`, event source From spreadsheet, event type On form submit.
7. Uji dengan satu respons Forms.

## 3. Deploy Apps Script jika dibutuhkan
Untuk trigger spreadsheet, deploy web app tidak wajib. Jika ingin health check, deploy sebagai Web app lalu masukkan URL-nya ke `config.js` pada `googleAppsScriptUrl`.

## Keamanan
- `service_role key` hanya di Apps Script Properties/backend; jangan di GitHub, `config.js`, atau frontend.
- `anon key` boleh di frontend jika RLS sudah aktif.
- Untuk produksi, siswa juga harus memakai akun/password Supabase; email bebas hanya untuk demo.
- Setelah uji berhasil, hapus data demo dari localStorage browser.

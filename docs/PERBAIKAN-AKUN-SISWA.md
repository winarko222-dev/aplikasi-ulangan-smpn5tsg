-- Perbaiki fungsi SQL role yang menyebabkan infinite recursion pada policy classes.
-- Jalankan file ini satu kali sebelum menguji aplikasi.
-- Edge Function admin-create-student wajib dideploy sebelum Admin membuat siswa.

-- Agar tidak gagal bila policy sudah ada, gunakan file supabase-fix-rls-recursion.sql.

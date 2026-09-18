# SMPN5TSG — production auth starter

Fitur ini merupakan tahap awal migrasi dari prototype lokal ke sistem keamanan yang benar.

## Yang sudah dibuat
- File `auth.js` berisi helper login, logout, dan role guard.
- File `supabase-schema.sql` berisi struktur database awal yang aman.
- File `supabase-auth-example.js` berisi contoh pemanggilan login dan requireRole.
- File `docs/PRODUCTION-SECURITY.md` menjelaskan pendekatan keamanan produksi.

## Cara memakai
1. Buat project Supabase baru.
2. Aktifkan Supabase Auth.
3. Terapkan schema pada file `supabase-schema.sql` ke database Supabase.
4. Salin file `auth-config.example.html` ke file baru, lalu isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.
5. Masukkan script tersebut sebelum `app.js` di file `index.html`.
6. Panggil fungsi `SMPN5TSGAuth.login()` saat user login.
7. Panggil `SMPN5TSGAuth.requireRole('admin')`, `SMPN5TSGAuth.requireRole('guru')`, atau `SMPN5TSGAuth.requireRole('student')` sebelum membuka halaman sensitif.

## Catatan penting
Versi GitHub Pages ini masih prototype. Untuk produksi sekolah, data akun dan password harus disimpan di backend Supabase/Auth, bukan di browser localStorage.

## Contoh penggunaan
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="auth.js"></script>
<script>
  SMPN5TSGAuth.initSupabase({
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_ANON_KEY',
  });

  async function doLogin() {
    try {
      const result = await SMPN5TSGAuth.login({
        email: 'admin@smpn5tsg.sch.id',
        password: 'Password123',
        role: 'admin',
      });
      console.log('Login sukses', result.profile);
    } catch (error) {
      console.error(error.message);
    }
  }
</script>
```

## Langkah berikutnya
- integrasikan login ini ke `app.js`
- buat halaman role-specific untuk admin, guru, dan siswa
- hubungkan Google Forms/Sheets melalui backend
- tambahkan audit log pengelolaan kelas dan nilai

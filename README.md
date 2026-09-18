# Panduan akun SMPN5TSG

Perubahan login sudah diterapkan.

## Admin
- Email: `winarko222@guru.smp.belajar.id`
- Password: `SMPN5TSG@`
- Pilih peran **Admin** saat masuk.

## Guru
Admin membuka menu **Akun Guru**, lalu menambahkan nama, email guru, dan sandi khusus. Guru memakai email dan sandi tersebut serta memilih **Guru**.

## Siswa
Siswa cukup memasukkan email apa pun yang valid, tidak perlu password, lalu memilih **Siswa**. Siswa hanya mendapatkan menu siswa dan tidak dapat membuka menu admin/guru melalui aplikasi.

## Catatan keamanan penting
Versi GitHub Pages ini masih prototype dan menyimpan data di `localStorage`, sehingga data akun berbeda pada setiap perangkat/browser dan belum aman untuk penggunaan sekolah sebenarnya. Password admin/guru terlihat di kode frontend. Untuk produksi, gunakan database dan autentikasi server agar akun tidak bisa dipalsukan.

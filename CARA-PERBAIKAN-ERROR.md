# 🔧 Cara Memperbaiki Error "Loading Tak Kunjung Terbuka"

## Masalah
Dashboard terus loading tanpa terbuka, dan muncul error 406/400 di console browser.

## Penyebab
Row Level Security (RLS) policies di Supabase belum dikonfigurasi dengan benar.

## Solusi (5 Menit)

### Langkah 1: Buka Supabase Dashboard
1. Buka browser dan masuk ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Login dengan akun Anda
3. Pilih project yang sedang Anda gunakan

### Langkah 2: Buka SQL Editor
1. Di sidebar kiri, cari dan klik menu **"SQL Editor"**
2. Klik tombol **"New Query"** untuk membuat query baru

### Langkah 3: Copy Script Perbaikan
1. Buka file `fix-rls-recursion.sql` di VS Code
2. Tekan **Ctrl+A** untuk select semua
3. Tekan **Ctrl+C** untuk copy

### Langkah 4: Paste dan Jalankan
1. Kembali ke SQL Editor di Supabase Dashboard
2. Tekan **Ctrl+V** untuk paste script yang sudah dicopy
3. Klik tombol **"Run"** (atau tekan **Ctrl+Enter**)
4. Tunggu hingga muncul pesan sukses: **"Migration completed successfully!"**
5. Pastikan muncul daftar policies yang telah dibuat

### Langkah 5: Refresh Dashboard
1. Kembali ke aplikasi SDKOM RAB Maker
2. Klik tombol **"Refresh"** di header dashboard
3. Atau tekan **F5** untuk refresh seluruh halaman

## Verifikasi
Setelah menjalankan script, dashboard seharusnya:
- ✅ Bisa loading dengan normal
- ✅ Menampilkan daftar proyek Anda
- ✅ Tidak ada error di console browser

## Troubleshooting

### Jika masih error setelah menjalankan script:
1. **Clear browser cache**: Tekan Ctrl+Shift+Delete, pilih "Cached images and files", klik "Clear data"
2. **Logout dan Login kembali**: Klik tombol Logout, lalu login kembali
3. **Restart development server**: 
   ```powershell
   # Stop server dengan Ctrl+C di terminal
   npm run dev
   ```

### Jika muncul error saat menjalankan SQL script:
- Pastikan Anda sedang berada di project yang benar
- Pastikan tidak ada typo saat copy-paste
- Coba jalankan script per bagian (copy Part 1 dulu, run, lalu Part 2, dst.)

## Bantuan Lebih Lanjut
Jika masih mengalami masalah, cek:
1. **Console browser**: Tekan F12, lihat tab Console untuk melihat error detail
2. **Network tab**: Lihat apakah ada request yang gagal (status 400, 406, 500, dll)
3. **Supabase logs**: Cek di Supabase Dashboard > Logs untuk melihat error dari sisi database

---

**Catatan**: Script ini aman dijalankan berkali-kali. Script akan menghapus policies lama dan membuat yang baru dengan konfigurasi yang benar.

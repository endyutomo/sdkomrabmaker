# 🤝 Cara Setup Fitur Kolaborasi

## Masalah
Setelah menambahkan kolaborator ke proyek, RAB tidak muncul di dashboard akun kolaborator yang dipilih.

## Penyebab
Fitur kolaborasi memerlukan setup database dan Row Level Security (RLS) policies di Supabase terlebih dahulu.

---

## 📋 Langkah Setup (Sekali Saja)

### 1. Jalankan SQL Script di Supabase

**PENTING**: Ini harus dilakukan SEKALI saja oleh admin/pemilik project Supabase.

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com/dashboard
   - Login dengan akun Anda
   - Pilih project yang sedang digunakan

2. **Buka SQL Editor**
   - Di sidebar kiri, klik **"SQL Editor"**
   - Klik **"New Query"**

3. **Copy & Paste Script**
   - Buka file `fix-rls-recursion.sql` di VS Code
   - Tekan **Ctrl+A** untuk select semua
   - Tekan **Ctrl+C** untuk copy
   - Kembali ke Supabase SQL Editor
   - Tekan **Ctrl+V** untuk paste

4. **Jalankan Script**
   - Klik tombol **"Run"** atau tekan **Ctrl+Enter**
   - Tunggu hingga selesai (sekitar 5-10 detik)
   - Pastikan muncul pesan: **"Migration completed successfully!"**
   - Akan muncul daftar policies yang telah dibuat

### 2. Refresh Aplikasi

Setelah SQL script berhasil dijalankan:

1. Kembali ke aplikasi SDKOM RAB Maker
2. **Logout** dari semua akun yang sedang login
3. **Login kembali** dengan akun kolaborator
4. Buka **Dashboard** - RAB yang di-share seharusnya sudah muncul!

---

## 🔍 Cara Menambahkan Kolaborator

### Dari Dashboard (Pemilik RAB):

1. **Buka RAB yang ingin di-share**
   - Klik card RAB di dashboard

2. **Lihat Panel Kolaborasi**
   - Di builder, cari bagian "Kolaborator" di sidebar kanan
   - Atau cari tombol dengan icon "Users"

3. **Tambah Kolaborator**
   - Masukkan email kolaborator (harus menggunakan domain `@sdkom.co.id`)
   - Pilih role:
     - **Viewer**: Hanya bisa melihat
     - **Editor**: Bisa edit RAB
   - Klik "Tambah"

4. **Kolaborator Menerima Akses**
   - Kolaborator akan melihat badge "New" di card RAB
   - RAB muncul di dashboard dengan label "Kolaborasi"

---

## ✅ Verifikasi Setup Berhasil

### Test dengan 2 Akun:

1. **Akun A (Pemilik)**:
   - Login dengan email `user1@sdkom.co.id`
   - Buat RAB baru atau buka RAB existing
   - Tambahkan `user2@sdkom.co.id` sebagai kolaborator

2. **Akun B (Kolaborator)**:
   - Login dengan email `user2@sdkom.co.id`
   - Buka Dashboard
   - ✅ RAB dari User1 seharusnya muncul dengan badge "Kolaborasi"
   - ✅ Badge "New" muncul untuk notifikasi pertama kali
   - ✅ Bisa buka RAB dan lihat isinya
   - ✅ Jika role = "Editor", bisa edit RAB

---

## 🐛 Troubleshooting

### RAB Masih Tidak Muncul di Kolaborator

1. **Cek Console Browser**
   - Tekan F12
   - Lihat tab **Console**
   - Cari pesan error atau warning
   - Screenshot dan share jika ada error

2. **Pastikan SQL Script Sudah Dijalankan**
   - Buka Supabase Dashboard
   - Masuk ke **Database** > **Policies**
   - Pastikan ada policies untuk `projects` dan `project_collaborators`
   - Jika tidak ada, ulangi langkah 1

3. **Cek Email Kolaborator**
   - Pastikan email kolaborator **benar-benar sama** dengan yang digunakan saat login
   - Email harus memiliki domain `@sdkom.co.id`
   - Cek di Supabase Dashboard > Authentication > Users

4. **Clear Cache & Reload**
   ```powershell
   # Di terminal VS Code, jalankan:
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   npm run dev
   ```

5. **Logout & Login Ulang**
   - Logout dari semua akun
   - Close browser
   - Buka browser baru
   - Login kembali

---

## 📝 Catatan Penting

1. **Setup Sekali Saja**: SQL script hanya perlu dijalankan 1x per project Supabase
2. **Email Domain**: Hanya email dengan domain `@sdkom.co.id` yang bisa akses
3. **Real-time Updates**: Perubahan pada RAB akan langsung terlihat oleh semua kolaborator
4. **Notifications**: Badge "New" akan hilang setelah kolaborator membuka RAB pertama kali

---

## 🆘 Masih Ada Masalah?

Jika setelah mengikuti semua langkah di atas masih ada masalah:

1. Ambil screenshot:
   - Dashboard kolaborator (yang tidak muncul RAB)
   - Console error (F12 > Console)
   - Supabase Policies (Database > Policies)

2. Cek Supabase Logs:
   - Supabase Dashboard > Logs
   - Filter by "Postgres Logs"
   - Screenshot error yang muncul

3. Share informasi tersebut untuk debugging lebih lanjut

# SDKOM RAB Maker - Cloud & Public Sharing Setup Guide

## Overview
RAB Anda sekarang dapat disimpan di cloud (Supabase) dan dibagikan ke siapapun melalui link publik yang dapat diakses dari mana saja.

## ✅ Setup Selesai

Saya telah menambahkan fitur berikut:

### 1. **Server Supabase Client** (`src/lib/supabase-server.ts`)
   - Client yang menggunakan `SUPABASE_SERVICE_ROLE_KEY` untuk operasi backend
   - Hanya berjalan di server, aman tidak ekspos ke klien

### 2. **API Endpoints**
   - **GET `/api/projects/public/[id]`** - Ambil RAB publik berdasarkan ID
   - **POST `/api/projects/publish/[id]`** - Publikasikan RAB (set status='public')

### 3. **Public View Page** (`src/app/public/[id]/page.tsx`)
   - Halaman untuk menampilkan RAB yang sudah dipublikasikan
   - URL: `http://localhost:3000/public/<PROJECT_ID>`
   - Siapapun bisa akses tanpa login

### 4. **Publish Button di Builder**
   - Tombol "Publikasikan" di header builder
   - Klik untuk membuat RAB dapat diakses publik
   - Otomatis copy link ke clipboard

---

## 🔧 Konfigurasi yang Diperlukan

### 1. Update `.env.local` dengan Supabase Keys

Buka file `.env.local` dan lengkapi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://osizusigsteogyivmgfa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Cara mendapatkan keys:**
1. Buka https://app.supabase.com
2. Login ke project Anda
3. Settings → API → Copy `URL` dan `Anon Key`
4. Settings → API → Copy `Service role key` (jangan bagikan!)

### 2. Jalankan Database Migration

Buka Supabase Dashboard → SQL Editor, kemudian:
1. Buat tab SQL baru
2. Copy seluruh isi dari file `supabase-migration.sql`
3. Jalankan (Run)

Ini akan membuat tabel `projects` dengan struktur yang sesuai.

### 3. Restart Dev Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

---

## 📋 Cara Menggunakan

### Step 1: Buat RAB Baru
1. Buka `http://localhost:3000/builder`
2. Isi detail proyek (nama, klien, lokasi, dll)
3. Tambah kategori dan item ke RAB
4. Klik tombol **"Simpan"** untuk menyimpan ke cloud

### Step 2: Publikasikan RAB
1. Setelah RAB disimpan, klik tombol **"Publikasikan"** di header
2. Status berganti menjadi **"Dipublikasikan"** (hijau)
3. Link publik otomatis disalin ke clipboard

### Step 3: Bagikan Link Publik
1. Link format: `http://localhost:3000/public/{PROJECT_ID}`
2. Contoh: `http://localhost:3000/public/proj-1739902400000`
3. Bagikan ke siapapun - mereka bisa lihat RAB tanpa login

### Step 4: Lihat RAB Publik
1. Buka link publik di browser manapun
2. Halaman menampilkan detail RAB:
   - Judul
   - Tipe proyek
   - Klien
   - Lokasi
   - Tanggal dokumen
   - Spesifikasi

---

## 🌐 Akses dari Internet (Opsional)

Jika ingin link publik dapat diakses dari internet (bukan hanya lokal):

### Opsi 1: Ngrok (Recommended)
```bash
# Install ngrok (jika belum)
npm install -g ngrok

# Jalankan ngrok
ngrok http 3000
```

Akan menghasilkan URL seperti: `https://abc123.ngrok.io`
Bagikan: `https://abc123.ngrok.io/public/{PROJECT_ID}`

### Opsi 2: Cloudflare Tunnel
```bash
# Install cloudflared (https://developers.cloudflare.com/cloudflare-one/downloads/)

# Run tunnel
cloudflared tunnel --url http://localhost:3000
```

### Opsi 3: Deploy ke Hosting (Vercel/Netlify)
1. Push ke GitHub
2. Connect ke Vercel/Netlify
3. Deploy otomatis
4. Link publik: `https://yourdomain.vercel.app/public/{PROJECT_ID}`

---

## 🔒 Keamanan

### Service Role Key
- Simpan `SUPABASE_SERVICE_ROLE_KEY` **hanya di server**
- Jangan commit ke Git (sudah di `.gitignore`)
- Jangan bagikan atau expose ke frontend

### Public vs Draft
- Status **`draft`**: Hanya terlihat oleh pembuat
- Status **`public`**: Siapapun bisa akses dengan link

### Row Level Security (RLS)
Database menggunakan Supabase RLS untuk mengamankan:
- User hanya bisa lihat project milik mereka (status draft/private)
- Publik endpoint hanya bisa akses project dengan status `public`

---

## 🧪 Test API Endpoints

### Test GET (Ambil RAB Publik)
```bash
curl http://localhost:3000/api/projects/public/proj-1739902400000
```

Respons (jika publik):
```json
{
  "id": "proj-1739902400000",
  "title": "RAB Gedung",
  "status": "public",
  "client_name": "PT Maju",
  ...
}
```

### Test POST (Publikasikan RAB)
```bash
curl -X POST http://localhost:3000/api/projects/publish/proj-1739902400000
```

Respons:
```json
{
  "ok": true,
  "project": { ... }
}
```

---

## 📝 Struktur Database

Tabel `projects`:
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | Text | ID unik project |
| `user_id` | UUID | User yang membuat |
| `title` | Text | Nama RAB |
| `type` | Text | Tipe proyek |
| `status` | Text | `draft` atau `public` |
| `categories` | JSONB | Kategori & item |
| `client_name` | Text | Nama klien |
| `created_at` | Timestamp | Waktu dibuat |
| `updated_at` | Timestamp | Waktu diubah |

---

## 🐛 Troubleshooting

### Error: "Service role key tidak tersimpan"
- Pastikan `.env.local` memiliki `SUPABASE_SERVICE_ROLE_KEY`
- Restart dev server: `npm run dev`

### Error: "Project not found"
- RAB belum disimpan, klik "Simpan" dulu
- Atau RAB masih status `draft`, publikasikan dulu

### Error: "Authentication failed"
- Pastikan Anonymous Sign-in diaktifkan di Supabase Dashboard
- Settings → Authentication → Providers → Anonymous

### Error: "Tabel 'projects' belum dibuat"
- Jalankan migration SQL dari `supabase-migration.sql`
- Supabase Dashboard → SQL Editor → Paste & Run

---

## 📚 Next Steps

1. **Bagikan RAB** - Klik Publikasikan → Bagikan link ke orang lain
2. **Update RAB** - Edit di builder, klik Simpan otomatis menyimpan versi terbaru
3. **Ekspor** - Gunakan tombol Ekspor untuk download PDF/Excel
4. **Deploy** - Jika ingin akses dari internet, gunakan ngrok atau deploy ke Vercel

---

## 💡 Tips

- **Auto-save**: RAB otomatis tersimpan setelah 30 detik tidak ada perubahan
- **Multiple Projects**: Buat banyak project, manage di Dashboard
- **Share Safely**: Link publik tidak bisa diedit orang lain, hanya bisa lihat
- **Version Control**: Database menyimpan timestamp setiap perubahan

---

## ❓ Test Scenario

1. Buka `http://localhost:3000/builder`
2. Isi: Judul = "Test RAB", Klien = "PT Test"
3. Tambah kategori & items
4. Klik **Simpan**
5. Klik **Publikasikan**
6. Copy link dari clipboard
7. Buka link di tab baru → RAB terlihat publik ✅

---

Selamat! RAB Anda sekarang dapat diakses siapapun dari mana saja! 🎉

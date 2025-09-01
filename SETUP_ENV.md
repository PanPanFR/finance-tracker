# Setup Environment Variables

## 1. Buat File .env.local

Buat file `.env.local` di root project (sama level dengan package.json) dengan isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. Cara Dapat Credentials

### Langkah 1: Buka Supabase Dashboard
1. Kunjungi [supabase.com](https://supabase.com)
2. Login ke akun Anda
3. Pilih project yang sudah dibuat

### Langkah 2: Ambil URL dan API Key
1. Pergi ke **Settings** → **API**
2. Copy **Project URL** (format: `https://abcdefghijklmnop.supabase.co`)
3. Copy **anon public** key (format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Langkah 3: Paste ke .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Restart Development Server

Setelah membuat file `.env.local`, restart server:

```bash
# Stop server (Ctrl+C)
# Kemudian jalankan lagi
npm run dev
```

## 4. Verifikasi Setup

Jika berhasil, Anda tidak akan melihat warning di console:
- ✅ Tidak ada error "Supabase belum dikonfigurasi"
- ✅ Form login/register bisa digunakan
- ✅ Google OAuth bisa diklik

## 5. Troubleshooting

### Error: "Supabase belum dikonfigurasi"
- Pastikan file `.env.local` ada di root project
- Pastikan nama variable benar (NEXT_PUBLIC_...)
- Restart development server

### Error: "Invalid API key"
- Pastikan API key yang di-copy lengkap
- Pastikan menggunakan anon key, bukan service_role key
- Cek apakah project Supabase aktif

### File .env.local tidak terbaca
- Pastikan file ada di root project (bukan di subfolder)
- Pastikan nama file tepat: `.env.local` (dengan titik di depan)
- Restart development server

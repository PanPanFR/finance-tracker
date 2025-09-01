# 🔒 Security Fix: Hidden OpenRouter API Key

## Masalah yang Ditemukan
Teman Anda menemukan API key OpenRouter melalui:
1. Browser Developer Tools → Network tab → Fetch/XHR
2. Authorization header yang terekspos: `Bearer sk-or-v1-aa...`

## Penyebab Masalah
- **Environment variable `NEXT_PUBLIC_OPENROUTER_KEY`** - Variabel dengan prefix `NEXT_PUBLIC_` terekspos ke client-side
- **API calls langsung dari browser** - Aplikasi melakukan fetch langsung ke OpenRouter dari client-side
- **API key terlihat di Network tab** - Semua request ke OpenRouter menampilkan API key

## Solusi yang Diterapkan

### 1. Membuat API Routes Server-Side
- **`/api/ai/parse`** - Untuk parsing transaksi dengan AI
- **`/api/ai/report`** - Untuk laporan AI

### 2. Mengubah Environment Variables
**SEBELUM (TIDAK AMAN):**
```bash
NEXT_PUBLIC_OPENROUTER_KEY=sk-or-v1-aa...
```

**SESUDAH (AMAN):**
```bash
OPENROUTER_KEY=sk-or-v1-aa...
```

### 3. Update Client-Side Code
- `aiParser.ts` - Sekarang memanggil `/api/ai/parse` bukan OpenRouter langsung
- `aiReport.ts` - Sekarang memanggil `/api/ai/report` bukan OpenRouter langsung

## Cara Menerapkan Perubahan

### 1. Update Environment Variables
```bash
# Hapus atau comment line ini:
# NEXT_PUBLIC_OPENROUTER_KEY=sk-or-v1-aa...

# Tambahkan line ini:
OPENROUTER_KEY=sk-or-v1-aa...
```

### 2. Restart Development Server
```bash
npm run dev
```

### 3. Deploy ke Vercel
- Update environment variables di Vercel dashboard
- Hapus `NEXT_PUBLIC_OPENROUTER_KEY`
- Tambahkan `OPENROUTER_KEY`

## Keuntungan Solusi Ini

✅ **API key tersembunyi** - Tidak bisa dilihat di browser developer tools  
✅ **Keamanan meningkat** - API key hanya ada di server  
✅ **Fungsionalitas tetap** - AI features tetap berjalan normal  
✅ **Best practice** - Mengikuti pola Next.js yang aman  

## Verifikasi Keamanan

Setelah deploy:
1. Buka Developer Tools → Network tab
2. Lakukan transaksi atau tanya AI report
3. **TIDAK ADA LAGI** request ke `openrouter.ai` yang terlihat
4. Yang terlihat hanya request ke `/api/ai/parse` dan `/api/ai/report`

## Catatan Penting

- **Jangan pernah** gunakan prefix `NEXT_PUBLIC_` untuk API keys
- **Selalu** gunakan API routes untuk operasi yang memerlukan API keys
- **Restart server** setelah mengubah environment variables
- **Update Vercel** environment variables jika deploy

## Troubleshooting

Jika AI tidak berfungsi setelah perubahan:
1. Pastikan `OPENROUTER_KEY` sudah diset (tanpa `NEXT_PUBLIC_`)
2. Restart development server
3. Check console untuk error messages
4. Pastikan API routes berfungsi di `/api/ai/parse` dan `/api/ai/report`

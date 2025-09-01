# Troubleshooting: Login/Register dari IP Selain Localhost

## Masalah yang Dirasakan
Ketika login/register menggunakan IP selain localhost (misalnya dari IP lain di jaringan yang sama), link verifikasi email dari Supabase mengalami error "ERR_CONNECTION_REFUSED".

## Penyebab Masalah
1. **Konfigurasi Supabase masih mengarah ke localhost**
2. **Link verifikasi email tidak mendukung IP dinamis**
3. **Environment variables tidak dikonfigurasi dengan benar**

## Solusi yang Sudah Diterapkan

### 1. Dynamic Site URL Detection
Aplikasi sekarang otomatis mendeteksi IP/domain yang sedang diakses dan menggunakan URL tersebut untuk:
- Link verifikasi email
- OAuth redirect URLs
- Supabase authentication flow

### 2. Konfigurasi Environment Variables
Buat file `.env.local` di root project dengan isi:

```bash
# Wajib: Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Opsional: Site URL (jika ingin manual)
# NEXT_PUBLIC_SITE_URL=http://192.168.1.100:3000
```

### 3. Supabase Project Settings
Pastikan di project Supabase Anda:

#### Authentication > URL Configuration
- **Site URL**: `http://localhost:3000` (untuk development)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `http://192.168.1.100:3000/auth/callback` (ganti dengan IP Anda)
  - `http://your-ip:3000/auth/callback`

#### Cara Update Redirect URLs:
1. Buka project Supabase
2. Pergi ke **Authentication** → **URL Configuration**
3. Tambahkan IP address Anda ke **Redirect URLs**
4. Klik **Save**

## Cara Testing

### 1. Dari Localhost
```bash
npm run dev
# Akses: http://localhost:3000
```

### 2. Dari IP Lain
```bash
npm run dev
# Akses dari device lain: http://192.168.1.100:3000
# (ganti dengan IP komputer Anda)
```

### 3. Cek IP Address
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

## Verifikasi Solusi

### 1. Cek Console Browser
Tidak ada error "Supabase belum dikonfigurasi"

### 2. Test Login/Register
- Bisa login/register dari IP manapun
- Link verifikasi email berfungsi
- OAuth redirect berfungsi

### 3. Cek Network Tab
Link verifikasi email mengarah ke IP yang benar, bukan localhost

## Troubleshooting Lanjutan

### Masih Error?
1. **Restart development server** setelah update `.env.local`
2. **Clear browser cache** dan cookies
3. **Cek firewall** apakah port 3000 terbuka
4. **Update Supabase redirect URLs** dengan IP yang benar

### Error "Invalid redirect URL"
- Pastikan IP address sudah ditambahkan ke Supabase redirect URLs
- Pastikan format URL benar: `http://IP:PORT/auth/callback`

### Error "Site URL not allowed"
- Update Site URL di Supabase Authentication settings
- Tambahkan IP address ke allowed domains

## Contoh Konfigurasi Lengkap

### .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://192.168.1.100:3000
```

### Supabase Redirect URLs
```
http://localhost:3000/auth/callback
http://192.168.1.100:3000/auth/callback
http://your-ip:3000/auth/callback
```

## Catatan Penting
- **Restart server** setiap kali update `.env.local`
- **Update Supabase settings** jika menggunakan IP baru
- **Test dari device lain** untuk memastikan solusi berfungsi
- **Backup konfigurasi** sebelum melakukan perubahan besar

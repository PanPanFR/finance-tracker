# Setup Fitur Autentikasi Finance Tracker

## 1. Setup Supabase

### Buat Project Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Buat akun atau login
3. Buat project baru
4. Catat URL project dan anon key

### Setup Database Tables
Jalankan SQL berikut di SQL Editor Supabase:

```sql
-- Buat table transactions dengan user_id
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  category TEXT,
  type TEXT CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Buat RLS (Row Level Security) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy untuk user hanya bisa melihat transaksi miliknya
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy untuk user hanya bisa insert transaksi untuk dirinya
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy untuk user hanya bisa update transaksi miliknya
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy untuk user hanya bisa delete transaksi miliknya
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
```

## 2. Setup Environment Variables

Buat file `.env.local` di root project dengan isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Setup Authentication di Supabase

### Enable Email Auth
1. Buka project Supabase
2. Pergi ke Authentication > Settings
3. Enable "Enable email confirmations" jika ingin email verification
4. Atau disable jika tidak ingin email verification

### Setup Google OAuth (Optional)
1. Pergi ke Authentication > Providers
2. Enable Google provider
3. Masukkan Google Client ID dan Secret
4. Tambahkan redirect URL: `https://your-domain.com/auth/callback`

## 4. Jalankan Aplikasi

```bash
npm run dev
```

## 5. Fitur yang Tersedia

### Login/Register
- Login dengan email dan password
- Register dengan email dan password
- Login dengan Google OAuth
- Email verification (jika dienable)

### Dashboard
- Hanya user yang login yang bisa akses
- Transaksi terisolasi per user
- User profile dengan dropdown
- Logout functionality

### Security
- Row Level Security (RLS) di database
- User hanya bisa akses data miliknya
- Protected routes dan API endpoints

## 6. Troubleshooting

### Error "Supabase client not initialized"
- Pastikan environment variables sudah diset dengan benar
- Restart development server setelah mengubah .env.local

### Error "User not authenticated"
- Pastikan user sudah login
- Cek session di browser developer tools

### Transaksi tidak muncul
- Pastikan user_id tersimpan dengan benar
- Cek RLS policies di Supabase
- Pastikan table transactions sudah dibuat dengan struktur yang benar

## 7. Customization

### Styling
- Edit file CSS untuk mengubah tampilan
- Gunakan Tailwind CSS classes yang sudah tersedia

### Additional Features
- Tambahkan fitur reset password
- Tambahkan fitur edit profile
- Tambahkan fitur export data
- Tambahkan fitur backup/restore

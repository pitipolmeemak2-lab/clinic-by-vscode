# 🔐 Auth System Setup Guide

## Steps to Enable Auth Testing

### 1. Disable Email Confirmation in Supabase

Go to your Supabase Project:
- **URL**: https://supabase.com/dashboard/project/ctdhjcxtyqulxpiimrrc/sql

Copy and run this SQL in Supabase SQL Editor:

```sql
-- Auto-confirm emails on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Create Database Profiles Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('assistant', 'doctor', 'pharmacy')),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text,
  license_number text,
  specialization text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow anyone to insert (for signup)
CREATE POLICY "Anyone can insert profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);
```

### 3. Test Auth Flow

**Local Testing:**
```bash
npm run dev
# Open http://localhost:3000
```

**Test Steps:**
1. Click **"Register here"** link on login page
2. Fill in:
   - Email: `test@clinic.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Role: `Doctor` (or Assistant/Pharmacy)
3. Click **Register**
4. Should redirect to dashboard automatically
5. Click logout and test login with same credentials

**Vercel Production:**
- https://clinic-by-vscode-68ub6tfew-paknakon-clinic-team.vercel.app

### 4. Demo Credentials (After Signup)

After you register a new user, use those credentials to login:
- Email: `your@email.com`
- Password: `yourpassword`

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ctdhjcxtyqulxpiimrrc
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Next.js Supabase Integration**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

## 📝 File Locations

- **AuthContext**: `src/contexts/AuthContext.tsx`
- **Login Page**: `src/app/(auth)/login/page.tsx`
- **Register Page**: `src/app/(auth)/register/page.tsx`
- **Middleware**: `src/middleware.ts`
- **Layout**: `src/app/layout.tsx`

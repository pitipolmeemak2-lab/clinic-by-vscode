# ClinicOS - Clinic Management System

ระบบจัดการคลินิกแบบออนไลน์ที่ทำด้วย Next.js, React, Supabase

## ⚙️ Setup Database

ก่อนใช้งานระบบ ต้องสร้าง tables ใน Supabase ก่อน:

### วิธี 1: ใช้ Supabase Dashboard (ง่ายที่สุด)
1. เข้าไปที่ https://app.supabase.com
2. เลือก Project ของคุณ
3. ไปที่ **SQL Editor** (ด้านซ้าย)
4. คลิก **New Query**
5. Copy code จากไฟล์ `supabase-migration.sql` ในโปรเจค
6. Paste ลงใน SQL Editor
7. คลิก **Run** (หรือกด Ctrl+Enter)

### วิธี 2: ใช้ Supabase CLI
```bash
supabase db push
```

## 🚀 Start Development

```bash
npm install
npm run dev
```

เปิดที่ http://localhost:3000

## 📋 Features

### Dashboard (/)
- แสดงสถิติผู้ป่วยวันนี้
- แสดงจำนวนคนรอตรวจ รอจ่ายยา
- ลิงค์เข้าใช้งานด่วน

### ลงทะเบียนผู้ป่วย (/registration)
- ค้นหาผู้ป่วยเดิม
- ลงทะเบียนผู้ป่วยใหม่
- สร้างคิวตรวจ
- ดูสถิติคิว

### ห้องตรวจแพทย์ (/doctor)
- ดูรายชื่อผู้ป่วยกำลังตรวจ
- ดูรายละเอียด Vital Signs
- อัปเดตสถานะ

### ห้องจ่ายยา (/pharmacy)
- ดูรายชื่อผู้ป่วยรอจ่ายยา
- จัดการการจ่ายยา

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **UI Components**: Lucide Icons
- **Forms**: React Hook Form, Zod
- **Database**: PostgreSQL (via Supabase)

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Dashboard (root page)
│   ├── layout.tsx               # Root layout
│   └── (dashboard)/
│       ├── layout.tsx           # Dashboard layout with sidebar
│       ├── page.tsx             # Dashboard page
│       ├── registration/
│       │   └── page.tsx         # Patient registration
│       ├── doctor/
│       │   └── page.tsx         # Doctor examination room
│       └── pharmacy/
│           └── page.tsx         # Pharmacy dispensing
├── components/
│   ├── Navbar.tsx               # Navigation bar
│   └── layout/
│       └── Sidebar.tsx          # Sidebar menu
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # Utility functions
└── types/
    └── index.ts                 # TypeScript types
```

## 🔄 Database Schema

### Patients Table
```
id              UUID (primary key)
first_name      TEXT
last_name       TEXT
phone           TEXT (unique)
id_card_number  TEXT
birth_date      DATE
address         TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Queues Table
```
id              UUID (primary key)
patient_id      UUID (FK -> patients)
branch_id       UUID (FK -> branches)
status          TEXT (waiting, in_progress, pharmacy, completed, cancelled)
symptoms        TEXT
vitals          JSONB
doctor_id       TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Branches Table
```
id              UUID (primary key)
name            TEXT
address         TEXT
created_at      TIMESTAMP
```

## 📝 Environment Variables

สร้างไฟล์ `.env.local` ที่ root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚧 TODO Features

- [ ] Authentication & Login
- [ ] User Roles (Doctor, Pharmacist, Receptionist)
- [ ] Appointments System
- [ ] Medical Records History
- [ ] Prescriptions Management
- [ ] Reports & Statistics
- [ ] Settings Page

## 💬 Support

หากมีปัญหา โปรดตรวจสอบ:
1. Supabase tables สร้างเรียบร้อยแล้วหรือไม่
2. Environment variables ตั้งค่าถูกต้องหรือไม่
3. Network connection ทำงานปกติหรือไม่

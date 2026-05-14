-- Disable RLS for development (ค่าประเทศ)
-- หมายเหตุ: ใช้สำหรับ development เท่านั้น ในสำหรับ production ต้องใช้ RLS policies ที่เหมาะสม

-- Disable RLS on patients table
alter table patients disable row level security;

-- Disable RLS on branches table
alter table branches disable row level security;

-- Disable RLS on queues table
alter table queues disable row level security;

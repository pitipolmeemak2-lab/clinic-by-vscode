-- Create patients table
create table patients (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  phone text not null unique,
  id_card_number text,
  birth_date date,
  address text,
  congenital_disease text,
  allergic_medication text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create branches table
create table branches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  created_at timestamp default now()
);

-- Create queues table
create table queues (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid not null references patients(id) on delete cascade,
  branch_id uuid references branches(id),
  status text default 'waiting' check (status in ('waiting', 'in_progress', 'pharmacy', 'completed', 'cancelled')),
  symptoms text,
  history_taking text,
  vitals jsonb,
  diagnosis text,
  doctor_notes text,
  prescription jsonb,
  doctor_id text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create appointments table
create table appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id text,
  appointment_date timestamp not null,
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create indexes for better performance
create index idx_queues_patient_id on queues(patient_id);
create index idx_queues_status on queues(status);
create index idx_queues_created_at on queues(created_at);
create index idx_patients_phone on patients(phone);
create index idx_appointments_patient_id on appointments(patient_id);
create index idx_appointments_date on appointments(appointment_date);
create index idx_appointments_status on appointments(status);

-- Enable realtime
alter publication supabase_realtime add table queues;
alter publication supabase_realtime add table patients;
alter publication supabase_realtime add table branches;
alter publication supabase_realtime add table appointments;

-- Ensure existing databases have the history_taking column
alter table queues add column if not exists history_taking text;

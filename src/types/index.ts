export type Patient = {
  id: string
  first_name: string
  last_name: string
  phone: string
  id_card_number?: string
  birth_date?: string
  address?: string
  congenital_disease?: string
  allergic_medication?: string
  created_at: string
  updated_at: string
}

export type QueueStatus = 'waiting' | 'in_progress' | 'pharmacy' | 'completed' | 'cancelled'

export type PrescriptionItem = {
  medication: string
  dosage?: string
  frequency?: string
  duration?: string
}

export type Queue = {
  id: string
  patient_id: string
  branch_id: string
  status: QueueStatus
  symptoms?: string
  history_taking?: string
  vitals?: {
    weight?: number
    height?: number
    bp?: string
    temp?: number
  }
  diagnosis?: string
  doctor_notes?: string
  prescription?: PrescriptionItem[]
  doctor_id?: string
  created_at: string
  patients?: Patient
}

export type Branch = {
  id: string
  name: string
  address?: string
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

export type Appointment = {
  id: string
  patient_id: string
  doctor_id?: string
  appointment_date: string
  status: AppointmentStatus
  notes?: string
  created_at: string
  updated_at: string
  patients?: Patient
}

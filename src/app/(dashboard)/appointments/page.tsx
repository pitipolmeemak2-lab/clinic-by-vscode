'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Patient, Appointment } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Plus, Search, Edit, Trash2, User } from 'lucide-react'

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'กรุณาเลือกผู้ป่วย'),
  appointment_date: z.string().min(1, 'กรุณาเลือกวันที่นัดหมาย'),
  doctor_id: z.string().optional(),
  notes: z.string().optional(),
})

type AppointmentForm = z.infer<typeof appointmentSchema>

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  })

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
  }, [])

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })

      if (error) {
        const message = error.message || JSON.stringify(error, null, 2)
        console.error('Error fetching appointments:', message)
        setDbError(message)
        return
      }

      setDbError(null)
      // Fetch patient details separately
      const appointmentsWithPatients = await Promise.all(
        (data || []).map(async (appointment) => {
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('first_name, last_name, phone')
            .eq('id', appointment.patient_id)
            .single()

          return {
            ...appointment,
            patients: patientError ? null : patient
          }
        })
      )

      setAppointments(appointmentsWithPatients)
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      console.error('Error fetching appointments:', message)
      setDbError(message)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('first_name')

      if (error) {
        console.error('Error fetching patients:', error)
        return
      }

      setPatients(data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const searchPatients = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) {
        console.error('Error searching patients:', error)
        return
      }

      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: AppointmentForm) => {
    setLoading(true)
    try {
      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update({
            patient_id: data.patient_id,
            appointment_date: data.appointment_date,
            doctor_id: data.doctor_id || null,
            notes: data.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAppointment.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert({
            patient_id: data.patient_id,
            appointment_date: data.appointment_date,
            doctor_id: data.doctor_id || null,
            notes: data.notes || null,
          })

        if (error) throw error
      }

      await fetchAppointments()
      setShowForm(false)
      setEditingAppointment(null)
      reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      console.error('Error saving appointment:', message)
      setDbError(message)
      alert('เกิดข้อผิดพลาดในการบันทึกนัดหมาย')
    } finally {
      setLoading(false)
    }
  }

  const deleteAppointment = async (id: string) => {
    if (!confirm('คุณต้องการลบนัดหมายนี้หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchAppointments()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('เกิดข้อผิดพลาดในการลบนัดหมาย')
    }
  }

  const editAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setValue('patient_id', appointment.patient_id)
    setValue('appointment_date', appointment.appointment_date.slice(0, 16)) // Remove seconds
    setValue('doctor_id', appointment.doctor_id || '')
    setValue('notes', appointment.notes || '')
    setShowForm(true)
  }

  const selectPatient = (patient: Patient) => {
    setValue('patient_id', patient.id)
    setSearchResults([])
    setSearchTerm(`${patient.first_name} ${patient.last_name}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">จัดการนัดหมาย</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingAppointment(null)
            reset()
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          สร้างนัดหมายใหม่
        </button>
      </div>

      {dbError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล</p>
          <p className="mt-1 text-sm leading-6">{dbError}</p>
          <p className="mt-2 text-sm text-red-700">
            โปรดตรวจสอบว่าตาราง <code>appointments</code> ถูกสร้างใน Supabase แล้วตามไฟล์ <code>supabase-migration.sql</code>.
          </p>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">รายการนัดหมาย</h2>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-gray-500" />
                      <span className="font-medium">
                        {appointment.patients?.first_name} {appointment.patients?.last_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({appointment.patients?.phone})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span>{new Date(appointment.appointment_date).toLocaleString('th-TH')}</span>
                    </div>
                    {appointment.doctor_id && (
                      <div className="text-sm text-gray-600 mb-2">
                        แพทย์: {appointment.doctor_id}
                      </div>
                    )}
                    {appointment.notes && (
                      <div className="text-sm text-gray-600">
                        หมายเหตุ: {appointment.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status === 'scheduled' ? 'นัดหมาย' :
                       appointment.status === 'confirmed' ? 'ยืนยันแล้ว' :
                       appointment.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                    </span>
                    <button
                      onClick={() => editAppointment(appointment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteAppointment(appointment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                ไม่มีนัดหมาย
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingAppointment ? 'แก้ไขนัดหมาย' : 'สร้างนัดหมายใหม่'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Patient Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้ป่วย
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาผู้ป่วย..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={searchPatients}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Search size={16} />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-md">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        {patient.first_name} {patient.last_name} ({patient.phone})
                      </button>
                    ))}
                  </div>
                )}
                {errors.patient_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.patient_id.message}</p>
                )}
              </div>

              {/* Appointment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่นัดหมาย
                </label>
                <input
                  type="datetime-local"
                  {...register('appointment_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.appointment_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.appointment_date.message}</p>
                )}
              </div>

              {/* Doctor ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แพทย์ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  {...register('doctor_id')}
                  placeholder="ชื่อแพทย์"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ (ไม่บังคับ)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="รายละเอียดเพิ่มเติม"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingAppointment(null)
                    reset()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'กำลังบันทึก...' : (editingAppointment ? 'แก้ไข' : 'สร้าง')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Patient, Queue } from '@/types'

type FormErrors = {
  first_name?: string
  last_name?: string
  phone?: string
  birth_date?: string
}

export default function RegistrationPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({})
  const [queueStats, setQueueStats] = useState({
    waiting: 0,
    in_progress: 0,
    pharmacy: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPatient, setPendingPatient] = useState<Patient | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchQueueStats()
    
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchQueueStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchQueueStats = async () => {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('status')

      if (error) {
        console.error('Error fetching queue stats:', error)
        return
      }

      const stats = data.reduce((acc, queue) => {
        acc[queue.status] = (acc[queue.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setQueueStats({
        waiting: stats.waiting || 0,
        in_progress: stats.in_progress || 0,
        pharmacy: stats.pharmacy || 0,
        completed: stats.completed || 0
      })
    } catch (error) {
      console.error('Error fetching queue stats:', error)
    }
  }

  const validatePhone = (phone: string): boolean => {
    return /^\d{10}$/.test(phone.replace(/[\s-]/g, ''))
  }

  const checkDuplicatePhone = async (phone: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', phone)
        .limit(1)

      if (error) {
        console.error('Error checking duplicate:', error)
        return false
      }
      return (data && data.length > 0) ? true : false
    } catch (error) {
      console.error('Error checking duplicate:', error)
      return false
    }
  }

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.slice(-10)
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
        alert('เกิดข้อผิดพลาดในการค้นหา: ' + (error.message || 'Unknown error'))
        return
      }
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching patients:', error)
      alert('เกิดข้อผิดพลาด: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const validatePatientForm = (): boolean => {
    const nextErrors: FormErrors = {}

    if (!newPatient.first_name?.trim()) {
      nextErrors.first_name = 'กรุณากรอกชื่อ'
    }

    if (!newPatient.last_name?.trim()) {
      nextErrors.last_name = 'กรุณากรอกนามสกุล'
    }

    if (!newPatient.phone?.trim()) {
      nextErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์'
    } else if (!validatePhone(newPatient.phone)) {
      nextErrors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const createPatient = async () => {
    if (!validatePatientForm()) return

    try {
      // Check duplicate phone
      const isDuplicate = await checkDuplicatePhone(newPatient.phone!)
      if (isDuplicate) {
        alert('เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว กรุณาค้นหาผู้ป่วยเก่า')
        return
      }

      const { data, error } = await supabase
        .from('patients')
        .insert([{
          ...newPatient,
          phone: formatPhoneNumber(newPatient.phone!),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating patient details:', error)
        alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + (error.message || 'Unknown error'))
        return
      }
      setSelectedPatient(data)
      setShowNewPatientForm(false)
      setNewPatient({})
      setErrors({})
      setSearchResults([])
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('เกิดข้อผิดพลาด: ' + String(error))
    }
  }

  const handleCreateQueueClick = () => {
    if (!selectedPatient) return
    setPendingPatient(selectedPatient)
    setShowConfirmDialog(true)
  }

  const handleConfirmQueue = async () => {
    if (!pendingPatient) return

    try {
      const { data, error } = await supabase
        .from('queues')
        .insert([{
          patient_id: pendingPatient.id,
          status: 'waiting',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating queue details:', error)
        alert('เกิดข้อผิดพลาดในการสร้างคิว: ' + (error.message || 'Unknown error'))
        setShowConfirmDialog(false)
        setPendingPatient(null)
        return
      }
      alert('สร้างคิวสำเร็จ!')
      setSelectedPatient(null)
      setSearchTerm('')
      setSearchResults([])
      setShowConfirmDialog(false)
      setPendingPatient(null)
      fetchQueueStats()
    } catch (error) {
      console.error('Error creating queue:', error)
      alert('เกิดข้อผิดพลาด: ' + String(error))
      setShowConfirmDialog(false)
      setPendingPatient(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ลงทะเบียนผู้ป่วยและจัดการคิว</h1>
        <p className="text-gray-500">ค้นหาผู้ป่วยเก่า หรือลงทะเบียนผู้ป่วยใหม่เพื่อเข้าคิวตรวจ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ค้นหาผู้ป่วย */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">ค้นหาผู้ป่วย</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="ชื่อ-นามสกุล หรือ เบอร์โทรศัพท์"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchPatients}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'ค้นหา...' : 'ค้นหา'}
            </button>
          </div>

          {!showNewPatientForm && (
            <button
              onClick={() => setShowNewPatientForm(true)}
              className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + ลงทะเบียนผู้ป่วยใหม่
            </button>
          )}

          {showNewPatientForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">ลงทะเบียนผู้ป่วยใหม่</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="ชื่อ *"
                    value={newPatient.first_name || ''}
                    onChange={(e) => setNewPatient({...newPatient, first_name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.first_name ? 'border-red-500' : ''}`}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="นามสกุล *"
                    value={newPatient.last_name || ''}
                    onChange={(e) => setNewPatient({...newPatient, last_name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.last_name ? 'border-red-500' : ''}`}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="เบอร์โทรศัพท์ (10 หลัก) *"
                    value={newPatient.phone || ''}
                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <input
                  type="text"
                  placeholder="เลขบัตรประชาชน"
                  value={newPatient.id_card_number || ''}
                  onChange={(e) => setNewPatient({...newPatient, id_card_number: e.target.value})}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  placeholder="วัน-เดือน-ปีเกิด"
                  value={newPatient.birth_date || ''}
                  onChange={(e) => setNewPatient({...newPatient, birth_date: e.target.value})}
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="ที่อยู่"
                  value={newPatient.address || ''}
                  onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                  className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="ประวัติการแพ้ยา"
                  value={newPatient.allergic_medication || ''}
                  onChange={(e) => setNewPatient({...newPatient, allergic_medication: e.target.value})}
                  className="col-span-2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={createPatient}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  บันทึก
                </button>
                <button
                  onClick={() => {
                    setShowNewPatientForm(false)
                    setNewPatient({})
                    setErrors({})
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">ผลการค้นหา:</h3>
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-gray-500">โทร: {patient.phone}</p>
                </div>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium mb-2">ผู้ป่วยที่เลือก:</h3>
              <p className="font-medium text-lg">{selectedPatient.first_name} {selectedPatient.last_name}</p>
              <p className="text-sm text-gray-600">โทร: {selectedPatient.phone}</p>
              {selectedPatient.birth_date && (
                <p className="text-sm text-gray-600">วัน-เดือน-ปีเกิด: {new Date(selectedPatient.birth_date).toLocaleDateString('th-TH')}</p>
              )}
              {selectedPatient.address && (
                <p className="text-sm text-gray-600">ที่อยู่: {selectedPatient.address}</p>
              )}
              {selectedPatient.allergic_medication && (
                <p className="text-sm text-red-600 mt-2"><span className="font-medium">⚠️ แพ้ยา:</span> {selectedPatient.allergic_medication}</p>
              )}
              <button
                onClick={handleCreateQueueClick}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                สร้างคิวตรวจ
              </button>
            </div>
          )}
        </div>

        {/* สรุปคิวปัจจุบัน */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">สถานะคิววันนี้</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-700 font-medium">รอตรวจ</span>
              <span className="text-2xl font-bold text-orange-700">{queueStats.waiting}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 font-medium">กำลังตรวจ</span>
              <span className="text-2xl font-bold text-blue-700">{queueStats.in_progress}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 font-medium">รอจ่ายยา</span>
              <span className="text-2xl font-bold text-green-700">{queueStats.pharmacy}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">เสร็จสิ้น</span>
              <span className="text-2xl font-bold text-gray-700">{queueStats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">ยืนยันการสร้างคิว</h2>
            <div className="mb-6 space-y-2">
              <p><span className="font-medium">ชื่อ-นามสกุล:</span> {pendingPatient.first_name} {pendingPatient.last_name}</p>
              <p><span className="font-medium">เบอร์โทร:</span> {pendingPatient.phone}</p>
              {pendingPatient.birth_date && (
                <p><span className="font-medium">วัน-เดือน-ปีเกิด:</span> {new Date(pendingPatient.birth_date).toLocaleDateString('th-TH')}</p>
              )}
              {pendingPatient.allergic_medication && (
                <p className="text-red-600"><span className="font-medium">⚠️ แพ้ยา:</span> {pendingPatient.allergic_medication}</p>
              )}
            </div>
            <p className="text-gray-600 mb-6">คุณแน่ใจว่าต้องการสร้างคิวตรวจสำหรับผู้ป่วยรายนี้หรือไม่?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmDialog(false)
                  setPendingPatient(null)
                }}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmQueue}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

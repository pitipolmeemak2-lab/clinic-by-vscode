'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Queue, Patient, PrescriptionItem } from '@/types'

const medicationOptions = [
  'Paracetamol 500 mg',
  'Ibuprofen 200 mg',
  'Amoxicillin 500 mg',
  'Cefadroxil 500 mg',
  'Azithromycin 250 mg',
  'Metformin 500 mg',
  'Lisinopril 10 mg',
  'Amlodipine 5 mg',
  'Simvastatin 20 mg',
  'Omeprazole 20 mg',
  'Ranitidine 150 mg',
  'Cetirizine 10 mg',
  'Loratadine 10 mg',
  'Salbutamol Inhaler',
  'Diphenhydramine 25 mg',
  'Prednisolone 5 mg',
  'Insulin Glargine',
  'Vitamin D3 1000 IU',
  'Calcium Carbonate 500 mg',
  'Pantoprazole 40 mg',
]

const dosageOptions = [
  '1 เม็ด',
  '1/2 เม็ด',
  '2 เม็ด',
  '3 เม็ด',
  '1 แคป',
  '1/2 แคป',
  '2 แคป',
  '5 ml',
  '10 ml',
  '15 ml',
  '1 ช้อนชา',
  '1 ช้อนโต๊ะ',
  '1 ขวด',
  'ตามอาการ',
]

const frequencyOptions = [
  'วันละ 1 ครั้ง',
  'วันละ 2 ครั้ง',
  'วันละ 3 ครั้ง',
  'เช้า-เย็น',
  'เช้า-กลางวัน-เย็น',
  'ทุกชั่วโมง',
  'ทุก 2 ชั่วโมง',
  'ทุก 4 ชั่วโมง',
  'ทุก 6 ชั่วโมง',
  'ทุก 8 ชั่วโมง',
  'ก่อนนอน',
  'หลังอาหาร',
  'ตามอาการ',
]

const durationOptions = [
  '1 วัน',
  '3 วัน',
  '5 วัน',
  '7 วัน',
  '10 วัน',
  '14 วัน',
  '1 เดือน',
  '2 เดือน',
  '3 เดือน',
  '6 เดือน',
  '1 ปี',
  'ตามอาการ',
  'ทั้งหมด',
]

const emptyPrescriptionItem = (): PrescriptionItem => ({
  medication: '',
  dosage: '',
  frequency: '',
  duration: '',
})

type FormErrors = {
  weight?: string
  height?: string
  bp?: string
  temp?: string
  prescription?: string
}

export default function DoctorPage() {
  const [queues, setQueues] = useState<(Queue & { patients?: Patient })[]>([])
  const [selectedQueue, setSelectedQueue] = useState<(Queue & { patients?: Patient }) | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<(Queue & { patients?: Patient })[]>([])
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([emptyPrescriptionItem()])
  const [vitals, setVitals] = useState<Queue['vitals']>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [showMedicalHistory, setShowMedicalHistory] = useState(false)
  const [historyTaking, setHistoryTaking] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchQueues()

    const interval = setInterval(fetchQueues, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedQueue) {
      setDiagnosis(selectedQueue.diagnosis || '')
      setDoctorNotes(selectedQueue.doctor_notes || '')
      setPrescription(
        selectedQueue.prescription && selectedQueue.prescription.length > 0
          ? selectedQueue.prescription
          : [emptyPrescriptionItem()]
      )
      setVitals(selectedQueue.vitals || {})
      setHistoryTaking(selectedQueue.history_taking || '')
      fetchMedicalHistory(selectedQueue.patient_id)
    } else {
      setDiagnosis('')
      setDoctorNotes('')
      setPrescription([emptyPrescriptionItem()])
      setVitals({})
      setHistoryTaking('')
      setMedicalHistory([])
      setErrors({})
    }
  }, [selectedQueue])

  const fetchQueues = async () => {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select(`
          *,
          patients (*)
        `)
        .in('status', ['waiting', 'in_progress'])
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching queues:', error)
        setQueues([])
        return
      }
      setQueues(data || [])
      if (selectedQueue) {
        const refreshed = (data || []).find((queue) => queue.id === selectedQueue.id) || null
        setSelectedQueue(refreshed)
      }
    } catch (error) {
      console.error('Error fetching queues:', error)
      setQueues([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMedicalHistory = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select(`
          *,
          patients (*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching medical history:', error)
        setMedicalHistory([])
        return
      }
      setMedicalHistory((data || []).filter((item) => item.status !== 'in_progress'))
    } catch (error) {
      console.error('Error fetching medical history:', error)
      setMedicalHistory([])
    }
  }

  const updateQueueStatus = async (queueId: string, status: Queue['status']) => {
    try {
      const { data, error } = await supabase
        .from('queues')
        .update({ status })
        .eq('id', queueId)
        .select(`*, patients (*)`)
        .single()

      if (error) {
        console.error('Error updating queue:', error)
        return null
      }

      await fetchQueues()
      return data as (Queue & { patients?: Patient })
    } catch (error) {
      console.error('Error updating queue:', error)
      return null
    }
  }

  const handleQueueSelect = async (queue: Queue & { patients?: Patient }) => {
    if (queue.status === 'waiting') {
      const updated = await updateQueueStatus(queue.id, 'in_progress')
      if (updated) {
        setSelectedQueue(updated)
        fetchMedicalHistory(updated.patient_id)
      }
    } else {
      setSelectedQueue(queue)
    }
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!vitals?.weight || Number(vitals.weight) <= 0) {
      nextErrors.weight = 'กรุณากรอกน้ำหนักให้ถูกต้อง'
    }

    if (!vitals?.height || Number(vitals.height) <= 0) {
      nextErrors.height = 'กรุณากรอกส่วนสูงให้ถูกต้อง'
    }

    if (!vitals?.bp?.trim() || !/^[0-9]{2,3}\/[0-9]{2,3}$/.test(String(vitals.bp).trim())) {
      nextErrors.bp = 'กรุณากรอกความดันในรูปแบบ 120/80'
    }

    const temp = Number(vitals?.temp)
    if (!vitals?.temp || Number.isNaN(temp) || temp < 30 || temp > 45) {
      nextErrors.temp = 'กรุณากรอกอุณหภูมิระหว่าง 30-45°C'
    }

    const validPrescription = prescription.filter((item) => item.medication.trim())
    if (validPrescription.length === 0) {
      nextErrors.prescription = 'กรุณาเลือกอย่างน้อยหนึ่งรายการยา'
    } else {
      const invalidRow = validPrescription.find((item) => !item.dosage?.trim() || !item.frequency?.trim() || !item.duration?.trim())
      if (invalidRow) {
        nextErrors.prescription = 'กรุณากรอกขนาดยา ความถี่ และระยะเวลาก่อนบันทึก'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleVitalsChange = (field: 'weight' | 'height' | 'bp' | 'temp', value: string) => {
    setVitals((current) => ({
      ...current,
      [field]: field === 'bp' ? value : value ? Number(value) : undefined,
    }))
  }

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    setPrescription((current) =>
      current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    )
  }

  const addPrescriptionRow = () => {
    setPrescription((current) => [...current, emptyPrescriptionItem()])
  }

  const removePrescriptionRow = (index: number) => {
    setPrescription((current) => current.filter((_, idx) => idx !== index))
  }

  const saveDiagnosis = async (statusAfterSave?: Queue['status']) => {
    if (!selectedQueue) return
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload: Partial<Queue> = {
        diagnosis,
        doctor_notes: doctorNotes,
        prescription: prescription.filter((item) => item.medication.trim()),
        vitals,
        history_taking: historyTaking || undefined,
      }

      if (statusAfterSave) {
        payload.status = statusAfterSave
      }

      let { error } = await supabase
        .from('queues')
        .update(payload)
        .eq('id', selectedQueue.id)

      if (error && error.code === 'PGRST204' && error.message?.includes('history_taking')) {
        console.warn('history_taking column missing, retrying without it')
        const fallbackPayload = {
          diagnosis,
          doctor_notes: doctorNotes,
          prescription: prescription.filter((item) => item.medication.trim()),
          vitals,
        }
        if (statusAfterSave) {
          ;(fallbackPayload as Partial<Queue>).status = statusAfterSave
        }
        const retry = await supabase
          .from('queues')
          .update(fallbackPayload)
          .eq('id', selectedQueue.id)
        error = retry.error
      }

      if (error) {
        console.error('Error saving diagnosis:', error)
        return
      }

      await fetchQueues()
      if (selectedQueue) {
        await fetchMedicalHistory(selectedQueue.patient_id)
      }
      alert('บันทึกข้อมูลแพทย์เรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error saving diagnosis:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกผลการวินิจฉัย')
    } finally {
      setSaving(false)
    }
  }

  const printPrescription = () => {
    if (!selectedQueue) return
    const items = prescription.filter((item) => item.medication.trim())
    const appointmentDate = new Date(selectedQueue.created_at).toLocaleString('th-TH')
    const html = `
      <html>
        <head>
          <title>ใบสั่งยา</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1, h2, h3 { margin: 0 0 12px 0; }
            .section { margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #444; padding: 10px; text-align: left; }
            .header-row { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>ใบสั่งยา</h1>
          <div class="section">
            <p><strong>ชื่อผู้ป่วย:</strong> ${selectedQueue.patients?.first_name || ''} ${selectedQueue.patients?.last_name || ''}</p>
            <p><strong>โทรศัพท์:</strong> ${selectedQueue.patients?.phone || ''}</p>
            <p><strong>วันที่:</strong> ${appointmentDate}</p>
            <p><strong>แพทย์ผู้ตรวจ:</strong> -</p>
          </div>
          <div class="section">
            <h2>รายการยา</h2>
            <table>
              <thead>
                <tr class="header-row">
                  <th>ยา</th>
                  <th>ขนาดยา</th>
                  <th>ความถี่</th>
                  <th>ระยะเวลา</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.medication}</td>
                        <td>${item.dosage || '-'}</td>
                        <td>${item.frequency || '-'}</td>
                        <td>${item.duration || '-'}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>คำแนะนำเพิ่มเติม</h2>
            <p>${doctorNotes || '-'}</p>
          </div>
          <div class="section">
            <h2>สรุปการวินิจฉัย</h2>
            <p>${diagnosis || '-'}</p>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const waitingQueues = queues
    .filter((queue) => queue.status === 'waiting')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const inProgressQueues = queues
    .filter((queue) => queue.status === 'in_progress')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ห้องตรวจแพทย์</h1>
        <p className="text-gray-500">บันทึกผลการวินิจฉัยและสั่งยาได้จากหน้านี้</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
          <h2 className="text-lg font-semibold mb-4">รายละเอียดผู้ป่วย</h2>
          {selectedQueue ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-lg">
                    {selectedQueue.patients?.first_name} {selectedQueue.patients?.last_name}
                  </p>
                  {selectedQueue.status === 'in_progress' && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                      กำลังตรวจ
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">เบอร์โทร: {selectedQueue.patients?.phone}</p>
              </div>

              {selectedQueue.symptoms && (
                <div>
                  <p className="font-medium">อาการเบื้องต้น</p>
                  <p className="text-sm text-gray-600">{selectedQueue.symptoms}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMedicalHistory(!showMedicalHistory)}
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                {showMedicalHistory ? 'ซ่อน' : 'ดู'}ประวัติการรักษา
              </button>

              {showMedicalHistory && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-base font-semibold">ประวัติการรักษาย้อนหลัง</h3>
                  {medicalHistory.length === 0 ? (
                    <div className="text-gray-500">ยังไม่มีประวัติการรักษาของผู้ป่วยรายนี้</div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {medicalHistory.map((history) => (
                        <div key={history.id} className="border rounded-xl p-4 bg-gray-50">
                          <div className="flex justify-between items-center gap-2">
                            <p className="font-medium">{new Date(history.created_at).toLocaleDateString('th-TH')}</p>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              history.status === 'completed' ? 'bg-green-100 text-green-800' :
                              history.status === 'pharmacy' ? 'bg-blue-100 text-blue-800' :
                              history.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {history.status === 'completed'
                                ? 'เสร็จสิ้น'
                                : history.status === 'pharmacy'
                                ? 'ส่งจ่ายยา'
                                : history.status === 'in_progress'
                                ? 'กำลังตรวจ'
                                : 'รอเรียก'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><strong>วินิจฉัย:</strong> {history.diagnosis || '-'}</p>
                            <p><strong>หมายเหตุ:</strong> {history.doctor_notes || '-'}</p>
                            <p><strong>ยา:</strong> {history.prescription?.length ? history.prescription.map((item) => item.medication).join(', ') : '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-base font-semibold">Vital Signs</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (kg)</label>
                    <input
                      type="number"
                      value={vitals?.weight ?? ''}
                      onChange={(e) => handleVitalsChange('weight', e.target.value)}
                      placeholder="น้ำหนัก"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.weight && <p className="text-red-600 text-sm mt-1">{errors.weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนสูง (cm)</label>
                    <input
                      type="number"
                      value={vitals?.height ?? ''}
                      onChange={(e) => handleVitalsChange('height', e.target.value)}
                      placeholder="ส่วนสูง"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.height && <p className="text-red-600 text-sm mt-1">{errors.height}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ความดัน (BP)</label>
                    <input
                      type="text"
                      value={vitals?.bp ?? ''}
                      onChange={(e) => handleVitalsChange('bp', e.target.value)}
                      placeholder="120/80"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.bp && <p className="text-red-600 text-sm mt-1">{errors.bp}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อุณหภูมิ (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitals?.temp ?? ''}
                      onChange={(e) => handleVitalsChange('temp', e.target.value)}
                      placeholder="37.0"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.temp && <p className="text-red-600 text-sm mt-1">{errors.temp}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold">ซักประวัติและอาการ</h3>
                <textarea
                  value={historyTaking}
                  onChange={(e) => setHistoryTaking(e.target.value)}
                  placeholder="บันทึกประวัติการเจ็บป่วย อาการที่เป็นอยู่ และข้อมูลสำคัญอื่นๆ..."
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผลการวินิจฉัย</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="บันทึกผลการวินิจฉัย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="บันทึกหมายเหตุหรือแผนการรักษาเพิ่มเติม"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">สั่งยา</p>
                    <button
                      type="button"
                      onClick={addPrescriptionRow}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      เพิ่มรายการยา
                    </button>
                  </div>

                  <div className="space-y-4">
                    {prescription.map((item, index) => (
                      <div key={index} className="border rounded-xl p-4 bg-gray-50">
                        <div className="flex justify-between items-center gap-2 mb-3">
                          <p className="text-sm font-medium text-gray-700">รายการ {index + 1}</p>
                          {prescription.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePrescriptionRow(index)}
                              className="text-red-600 text-sm hover:underline"
                            >
                              ลบ
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">ยา</label>
                            <select
                              value={item.medication}
                              onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">เลือกยา</option>
                              {medicationOptions.map((medicine) => (
                                <option key={medicine} value={medicine}>
                                  {medicine}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <select
                              value={item.dosage || ''}
                              onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">เลือกขนาดยา</option>
                              {dosageOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                              <option value="">กำหนดเอง</option>
                            </select>
                            <select
                              value={item.frequency || ''}
                              onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">เลือกความถี่</option>
                              {frequencyOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                              <option value="">กำหนดเอง</option>
                            </select>
                          </div>

                          <select
                            value={item.duration || ''}
                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">เลือกระยะเวลา</option>
                            {durationOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                            <option value="">กำหนดเอง</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {errors.prescription && <p className="text-red-600 text-sm">{errors.prescription}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => saveDiagnosis()}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการวินิจฉัยและประวัติ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveDiagnosis('pharmacy')}
                    disabled={saving}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'กำลังส่งไปจ่ายยา...' : 'บันทึกและส่งจ่ายยา'}
                  </button>
                  <button
                    type="button"
                    onClick={printPrescription}
                    className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-black transition-colors"
                  >
                    พิมพ์ใบสั่งยา
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-gray-400">เลือกผู้ป่วยจากรายชื่อด้านขวาเพื่อดูรายละเอียด</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
            <h3 className="text-base font-semibold">ผู้ป่วยรอเรียกตรวจ</h3>
            {waitingQueues.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-400 text-sm">ยังไม่มีผู้ป่วยในคิวรอเรียก</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {waitingQueues.map((queue, index) => (
                  <div
                    key={queue.id}
                    className={`p-3 border rounded-lg transition-colors cursor-pointer text-sm ${
                      selectedQueue?.id === queue.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleQueueSelect(queue)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {index + 1}. {queue.patients?.first_name} {queue.patients?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{queue.patients?.phone}</p>
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">
                        รอเรียก
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

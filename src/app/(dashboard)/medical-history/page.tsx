'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Patient, Queue } from '@/types'

export default function MedicalHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<(Queue & { patients?: Patient })[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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

      setPatients(data || [])
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (patient: Patient) => {
    setSelectedPatient(patient)
    setHistory([])
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('queues')
        .select(`
          *,
          patients (*)
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading medical history:', error)
        return
      }

      setHistory(data || [])
    } catch (error) {
      console.error('Error loading medical history:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ประวัติการรักษา</h1>
        <p className="text-gray-500">ค้นหาและดูประวัติการรักษาผู้ป่วยย้อนหลัง</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
            placeholder="ค้นหาด้วยชื่อ นามสกุล หรือเบอร์โทรศัพท์"
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchPatients}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ค้นหา
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">กำลังค้นหา...</p>}

        {patients.length > 0 && (
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-semibold">ผลการค้นหา</h2>
            <div className="grid gap-2">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => loadHistory(patient)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-gray-500">{patient.phone}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPatient && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
              <p className="text-sm text-gray-500">โทร: {selectedPatient.phone}</p>
            </div>

            {history.length === 0 ? (
              <div className="text-gray-500">ไม่มีประวัติการรักษา</div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="border rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-3">
                      <div>
                        <p className="font-medium">{new Date(entry.created_at).toLocaleDateString('th-TH')}</p>
                        <p className="text-sm text-gray-500">สถานะ: {entry.status}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                        entry.status === 'pharmacy' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status === 'completed'
                          ? 'เสร็จสิ้น'
                          : entry.status === 'pharmacy'
                          ? 'ส่งจ่ายยา'
                          : entry.status === 'in_progress'
                          ? 'กำลังตรวจ'
                          : 'รอเรียก'}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm text-gray-700">
                      <p><strong>อาการ:</strong> {entry.symptoms || '-'}</p>
                      <p><strong>Vital Signs:</strong> {entry.vitals ? `${entry.vitals.weight || '-'} kg / ${entry.vitals.height || '-'} cm / ${entry.vitals.bp || '-'} / ${entry.vitals.temp ?? '-'}°C` : '-'}</p>
                      <p><strong>วินิจฉัย:</strong> {entry.diagnosis || '-'}</p>
                      <p><strong>หมายเหตุ:</strong> {entry.doctor_notes || '-'}</p>
                      <div>
                        <strong>ใบสั่งยา:</strong>
                        {entry.prescription && entry.prescription.length > 0 ? (
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {entry.prescription.map((item, idx) => (
                              <li key={idx}>{item.medication} - {item.dosage || '-'} - {item.frequency || '-'} - {item.duration || '-'}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">-</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

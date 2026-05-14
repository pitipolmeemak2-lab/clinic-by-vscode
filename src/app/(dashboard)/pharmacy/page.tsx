'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Queue, Patient } from '@/types'

export default function PharmacyPage() {
  const [queues, setQueues] = useState<(Queue & { patients?: Patient })[]>([])
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchQueues()
    
    // Refresh queue list every 3 seconds
    const interval = setInterval(fetchQueues, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchQueues = async () => {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select(`
          *,
          patients (*)
        `)
        .eq('status', 'pharmacy')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching queues:', error)
        setQueues([])
        return
      }
      setQueues(data || [])
    } catch (error) {
      console.error('Error fetching queues:', error)
      setQueues([])
    } finally {
      setLoading(false)
    }
  }

  const updateQueueStatus = async (queueId: string, status: Queue['status']) => {
    try {
      const { error } = await supabase
        .from('queues')
        .update({ status })
        .eq('id', queueId)

      if (error) {
        console.error('Error updating queue:', error)
        return
      }
      await fetchQueues()
      if (selectedQueue?.id === queueId) {
        setSelectedQueue(null)
      }
    } catch (error) {
      console.error('Error updating queue:', error)
    }
  }

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
        <h1 className="text-2xl font-bold">ห้องจ่ายยา</h1>
        <p className="text-gray-500">จัดการการจ่ายยาให้ผู้ป่วย</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* รายละเอียดผู้ป่วย */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">รายละเอียดผู้ป่วย</h2>
          {selectedQueue ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-lg">
                  {selectedQueue.patients?.first_name} {selectedQueue.patients?.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  เบอร์โทร: {selectedQueue.patients?.phone}
                </p>
              </div>

              {selectedQueue.symptoms && (
                <div>
                  <p className="font-medium">อาการเบื้องต้น:</p>
                  <p className="text-sm text-gray-600">{selectedQueue.symptoms}</p>
                </div>
              )}

              {selectedQueue.prescription && selectedQueue.prescription.length > 0 ? (
                <div className="space-y-3 pt-4">
                  <h3 className="font-medium">รายการยาที่ต้องจ่าย</h3>
                  <div className="space-y-2">
                    {selectedQueue.prescription.map((item, index) => (
                      <div key={index} className="rounded-lg border bg-gray-50 p-3 text-sm">
                        <p className="font-medium">{item.medication}</p>
                        <p>ขนาดยา: {item.dosage || '-'}</p>
                        <p>ความถี่: {item.frequency || '-'}</p>
                        <p>ระยะเวลา: {item.duration || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-4 text-sm text-gray-500">ยังไม่มีรายการยาที่ต้องจ่าย</div>
              )}

              <div className="pt-4">
                <button
                  onClick={() => updateQueueStatus(selectedQueue.id, 'completed')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  จ่ายยาเสร็จสิ้น
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-gray-400">เลือกผู้ป่วยเพื่อดูรายละเอียด</p>
            </div>
          )}
        </div>

        {/* รายชื่อผู้ป่วยรอจ่ายยา */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">ผู้ป่วยรอจ่ายยา</h2>
          {queues.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-gray-400">ไม่มีผู้ป่วยรอจ่ายยา</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queues.map((queue) => (
                <div
                  key={queue.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedQueue(queue)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {queue.patients?.first_name} {queue.patients?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        อาการ: {queue.symptoms || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(queue.created_at).toLocaleTimeString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
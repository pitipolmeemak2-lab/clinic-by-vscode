'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Stethoscope, Pill, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function Home() {
  const [stats, setStats] = useState({
    patients_today: 0,
    waiting: 0,
    pharmacy: 0,
    appointments_today: 0
  })
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // Get today's queues
      const today = new Date().toISOString().split('T')[0]
      const { data: queues, error: queuesError } = await supabase
        .from('queues')
        .select('status, created_at')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`)

      if (queuesError) {
        console.error('Error fetching queues:', queuesError)
        // Set default values if query fails
        setStats({
          patients_today: 0,
          waiting: 0,
          pharmacy: 0,
          appointments_today: 0
        })
        return
      }

      const queueStats = queues?.reduce((acc, queue) => {
        if (queue.status === 'waiting') acc.waiting++
        if (queue.status === 'pharmacy') acc.pharmacy++
        return acc
      }, { waiting: 0, pharmacy: 0 }) || { waiting: 0, pharmacy: 0 }

      // Get unique patients today
      const { data: patients, error: patientsError } = await supabase
        .from('queues')
        .select('patient_id')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`)

      if (patientsError) {
        console.error('Error fetching patients:', patientsError)
        // Still set stats with queue data even if patients query fails
        setStats({
          patients_today: 0,
          waiting: queueStats.waiting,
          pharmacy: queueStats.pharmacy,
          appointments_today: 0
        })
        return
      }

      const uniquePatients = new Set(patients?.map(q => q.patient_id) || []).size

      setStats({
        patients_today: uniquePatients,
        waiting: queueStats.waiting,
        pharmacy: queueStats.pharmacy,
        appointments_today: 0 // TODO: implement appointments
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default values on error
      setStats({
        patients_today: 0,
        waiting: 0,
        pharmacy: 0,
        appointments_today: 0
      })
    }
  }

  const statItems = [
    { name: 'ผู้ป่วยวันนี้', value: stats.patients_today, icon: Users, color: 'bg-blue-500' },
    { name: 'รอพบแพทย์', value: stats.waiting, icon: Stethoscope, color: 'bg-orange-500' },
    { name: 'รอจ่ายยา', value: stats.pharmacy, icon: Pill, color: 'bg-green-500' },
    { name: 'นัดหมายวันนี้', value: stats.appointments_today, icon: Calendar, color: 'bg-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-blue-600">ClinicOS</h1>
          <p className="text-sm text-gray-500">ระบบจัดการคลินิกอัจฉริยะ</p>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold">ยินดีต้อนรับสู่ ClinicOS</h2>
            <p className="text-gray-500">ภาพรวมการดำเนินงานของคลินิกสาขานี้วันนี้</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((stat) => (
              <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border flex items-center space-x-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">เข้าใช้งานด่วน</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/registration" className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <p className="font-medium group-hover:text-blue-600">ลงทะเบียนผู้ป่วย</p>
                  <p className="text-xs text-gray-500">สร้างคิวตรวจใหม่</p>
                </Link>
                <Link href="/doctor" className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <p className="font-medium group-hover:text-blue-600">ห้องตรวจแพทย์</p>
                  <p className="text-xs text-gray-500">บันทึกการรักษา</p>
                </Link>
                <Link href="/pharmacy" className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <p className="font-medium group-hover:text-blue-600">ห้องจ่ายยา</p>
                  <p className="text-xs text-gray-500">จัดการการจ่ายยา</p>
                </Link>
                <Link href="/appointments" className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <p className="font-medium group-hover:text-blue-600">นัดหมาย</p>
                  <p className="text-xs text-gray-500">จัดการนัดหมาย</p>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">การแจ้งเตือน</h3>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">มีผู้ป่วยรอตรวจ {stats.waiting} คน</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">มีผู้ป่วยรอจ่ายยา {stats.pharmacy} คน</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

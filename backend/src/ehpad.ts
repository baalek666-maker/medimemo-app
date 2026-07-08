// B2B EHPAD — Multi-resident management
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface Resident {
  id: string
  room: string
  name: string
  medications: number
  adherence: number
  lastDose: string | null
  missedToday: number
}

// === Mock data for MVP — will be replaced with real DB queries ===
const mockResidents: Resident[] = [
  { id: 'r1', room: '101', name: 'Mme Dubois', medications: 5, adherence: 94, lastDose: '08:30', missedToday: 0 },
  { id: 'r2', room: '102', name: 'M. Martin', medications: 3, adherence: 87, lastDose: '08:15', missedToday: 1 },
  { id: 'r3', room: '103', name: 'Mme Lefèvre', medications: 7, adherence: 91, lastDose: '07:45', missedToday: 0 },
  { id: 'r4', room: '201', name: 'M. Chen', medications: 4, adherence: 99, lastDose: '08:00', missedToday: 0 },
  { id: 'r5', room: '202', name: 'Mme Rousseau', medications: 6, adherence: 76, lastDose: null, missedToday: 2 },
  { id: 'r6', room: '203', name: 'M. Bernard', medications: 2, adherence: 95, lastDose: '08:30', missedToday: 0 },
]

export async function getEhpadDashboard(orgId: string): Promise<{
  residents: Resident[]
  summary: { total: number; avgAdherence: number; missedToday: number; criticalAlerts: number }
}> {
  const total = mockResidents.length
  const avgAdherence = Math.round(mockResidents.reduce((a, r) => a + r.adherence, 0) / total)
  const missedToday = mockResidents.reduce((a, r) => a + r.missedToday, 0)
  const criticalAlerts = mockResidents.filter(r => r.adherence < 80).length

  return {
    residents: mockResidents,
    summary: { total, avgAdherence, missedToday, criticalAlerts }
  }
}

export async function getResidentDetail(residentId: string): Promise<Resident & {
  medicationsList: { name: string; dosage: string; schedule: string[]; takenToday: boolean[] }[]
}> {
  const r = mockResidents.find(r => r.id === residentId) || mockResidents[0]
  return {
    ...r,
    medicationsList: [
      { name: 'Doliprane', dosage: '1000mg', schedule: ['08:00', '12:00', '20:00'], takenToday: [true, true, false] },
      { name: 'Kardegic', dosage: '75mg', schedule: ['08:00'], takenToday: [true] },
      { name: 'Tahor', dosage: '20mg', schedule: ['18:00'], takenToday: [false] },
    ]
  }
}

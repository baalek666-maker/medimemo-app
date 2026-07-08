const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function getUser(userId: string) {
  const res = await fetch(`${API_URL}/api/users/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export async function createUser(email: string, name?: string) {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name })
  })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json()
}

export async function getMedications(userId: string) {
  const res = await fetch(`${API_URL}/api/users/${userId}/medications`)
  if (!res.ok) throw new Error('Failed to fetch medications')
  return res.json()
}

export async function createMedication(userId: string, data: { name: string; dose: string; time: string }) {
  const res = await fetch(`${API_URL}/api/users/${userId}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create medication')
  return res.json()
}

export async function toggleMedicationTaken(id: string) {
  const res = await fetch(`${API_URL}/api/medications/${id}/taken`, {
    method: 'PATCH'
  })
  if (!res.ok) throw new Error('Failed to toggle medication')
  return res.json()
}

export async function deleteMedication(id: string) {
  const res = await fetch(`${API_URL}/api/medications/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete medication')
}

export async function searchMedications(q: string) {
  const res = await fetch(`${API_URL}/api/medications/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Failed to search medications')
  return res.json()
}

export async function getCaregivers(userId: string) {
  const res = await fetch(`${API_URL}/api/users/${userId}/caregivers`)
  if (!res.ok) throw new Error('Failed to fetch caregivers')
  return res.json()
}

export async function createCaregiver(userId: string, data: { name: string; phone?: string; email?: string; notifySms?: boolean; notifyEmail?: boolean }) {
  const res = await fetch(`${API_URL}/api/users/${userId}/caregivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create caregiver')
  return res.json()
}

export async function deleteCaregiver(id: string) {
  const res = await fetch(`${API_URL}/api/caregivers/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete caregiver')
}


// === Stripe / Billing ===
export async function createCheckoutSession(userId: string, email: string) {
  const res = await fetch(`${API_URL}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email })
  })
  if (!res.ok) throw new Error('Failed to create checkout session')
  return res.json()
}

export async function getSubscriptionStatus(userId: string) {
  const res = await fetch(`${API_URL}/api/billing/status/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch subscription status')
  return res.json()
}

export async function cancelSubscription(userId: string) {
  const res = await fetch(`${API_URL}/api/billing/cancel/${userId}`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('Failed to cancel subscription')
  return res.json()
}

// === Reports ===
export async function getMonthlyReport(userId: string) {
  const res = await fetch(`${API_URL}/api/reports/monthly/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch monthly report')
  return res.json()
}

// === Notifications ===
export async function checkNotifications() {
  const res = await fetch(`${API_URL}/api/notifications/check`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('Failed to check notifications')
  return res.json()
}

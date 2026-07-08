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

// === Auth ===
export async function authSignup(email: string, password: string, name?: string) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur inscription')
  return data
}

export async function authLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur connexion')
  return data
}

// === Push notifications ===
export async function getVapidPublicKey() {
  const res = await fetch(`${API_URL}/api/push/vapid-public-key`)
  if (!res.ok) throw new Error('Failed to fetch VAPID key')
  const data = await res.json()
  return data.publicKey as string
}

export async function subscribePush(token: string, subscription: PushSubscription) {
  const res = await fetch(`${API_URL}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys
    })
  })
  if (!res.ok) throw new Error('Failed to subscribe to push')
  return res.json()
}

export async function testPush(token: string) {
  const res = await fetch(`${API_URL}/api/push/test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to send test push')
  return res.json()
}

// === B2B EHPAD ===
export async function getEhpadDashboard() {
  const res = await fetch(`${API_URL}/api/ehpad/dashboard`)
  if (!res.ok) throw new Error('Failed to load EHPAD dashboard')
  return res.json()
}

export async function getResidentDetail(id: string) {
  const res = await fetch(`${API_URL}/api/ehpad/residents/${id}`)
  if (!res.ok) throw new Error('Failed to load resident')
  return res.json()
}

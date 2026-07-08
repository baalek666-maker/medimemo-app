import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import {
  createCheckoutSession,
  handleStripeWebhook,
  getSubscriptionStatus,
  cancelSubscription,
} from './stripe'
import { checkMissedDoses, getMonthlyReport } from './notifications'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Stripe webhook needs RAW body BEFORE json middleware
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString())
    await handleStripeWebhook(event as any)
    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({ error: 'Webhook error' })
  }
})

app.use(cors())
app.use(express.json())

// Base de médicaments française (les 60 plus courants)
const frenchMedications = [
  { name: 'Doliprane', dosage: '500 mg', form: 'comprimé' },
  { name: 'Doliprane', dosage: '1000 mg', form: 'comprimé' },
  { name: 'Levothyrox', dosage: '25 µg', form: 'comprimé' },
  { name: 'Levothyrox', dosage: '50 µg', form: 'comprimé' },
  { name: 'Levothyrox', dosage: '100 µg', form: 'comprimé' },
  { name: 'Kardegic', dosage: '75 mg', form: 'comprimé' },
  { name: 'Plavix', dosage: '75 mg', form: 'comprimé' },
  { name: 'Tahor', dosage: '10 mg', form: 'comprimé' },
  { name: 'Tahor', dosage: '20 mg', form: 'comprimé' },
  { name: 'Crestor', dosage: '10 mg', form: 'comprimé' },
  { name: 'Crestor', dosage: '20 mg', form: 'comprimé' },
  { name: 'Amlor', dosage: '5 mg', form: 'comprimé' },
  { name: 'Amlor', dosage: '10 mg', form: 'comprimé' },
  { name: 'Coversyl', dosage: '5 mg', form: 'comprimé' },
  { name: 'Coversyl', dosage: '10 mg', form: 'comprimé' },
  { name: 'Bisoprolol', dosage: '2,5 mg', form: 'comprimé' },
  { name: 'Bisoprolol', dosage: '5 mg', form: 'comprimé' },
  { name: 'Deroxat', dosage: '20 mg', form: 'comprimé' },
  { name: 'Seroplex', dosage: '10 mg', form: 'comprimé' },
  { name: 'Seroplex', dosage: '20 mg', form: 'comprimé' },
  { name: 'Inexium', dosage: '20 mg', form: 'comprimé' },
  { name: 'Inexium', dosage: '40 mg', form: 'comprimé' },
  { name: 'Mopral', dosage: '20 mg', form: 'comprimé' },
  { name: 'Metformine', dosage: '500 mg', form: 'comprimé' },
  { name: 'Metformine', dosage: '850 mg', form: 'comprimé' },
  { name: 'Glucophage', dosage: '500 mg', form: 'comprimé' },
  { name: 'Januvia', dosage: '100 mg', form: 'comprimé' },
  { name: 'Lantus', dosage: '100 UI/ml', form: 'stylo' },
  { name: 'NovoRapid', dosage: '100 UI/ml', form: 'stylo' },
  { name: 'Humalog', dosage: '100 UI/ml', form: 'stylo' },
  { name: 'Eliquis', dosage: '2,5 mg', form: 'comprimé' },
  { name: 'Eliquis', dosage: '5 mg', form: 'comprimé' },
  { name: 'Xarelto', dosage: '10 mg', form: 'comprimé' },
  { name: 'Xarelto', dosage: '20 mg', form: 'comprimé' },
  { name: 'Pradaxa', dosage: '110 mg', form: 'comprimé' },
  { name: 'Pradaxa', dosage: '150 mg', form: 'comprimé' },
  { name: 'Spironolactone', dosage: '25 mg', form: 'comprimé' },
  { name: 'Lasilix', dosage: '40 mg', form: 'comprimé' },
  { name: 'Aldactone', dosage: '25 mg', form: 'comprimé' },
  { name: 'Topalgic', dosage: '50 mg', form: 'comprimé' },
  { name: 'Topalgic', dosage: '100 mg', form: 'comprimé' },
  { name: 'Ibuprofène', dosage: '400 mg', form: 'comprimé' },
  { name: 'Ibuprofène', dosage: '200 mg', form: 'comprimé' },
  { name: 'Augmentin', dosage: '1 g', form: 'comprimé' },
  { name: 'Augmentin', dosage: '500 mg', form: 'comprimé' },
  { name: 'Amoxicilline', dosage: '500 mg', form: 'gélule' },
  { name: 'Amoxicilline', dosage: '1 g', form: 'comprimé' },
  { name: 'Solupred', dosage: '20 mg', form: 'comprimé' },
  { name: 'Cortancyl', dosage: '5 mg', form: 'comprimé' },
  { name: 'Cortancyl', dosage: '20 mg', form: 'comprimé' },
  { name: 'Stilnox', dosage: '10 mg', form: 'comprimé' },
  { name: 'Imovane', dosage: '7,5 mg', form: 'comprimé' },
  { name: 'Lexomil', dosage: '6 mg', form: 'comprimé' },
  { name: 'Temesta', dosage: '1 mg', form: 'comprimé' },
  { name: 'Temesta', dosage: '2,5 mg', form: 'comprimé' },
  { name: 'Xanax', dosage: '0,25 mg', form: 'comprimé' },
  { name: 'Xanax', dosage: '0,50 mg', form: 'comprimé' },
  { name: 'Laroxyl', dosage: '25 mg', form: 'comprimé' },
  { name: 'Laroxyl', dosage: '50 mg', form: 'comprimé' },
  { name: 'Effexor', dosage: '37,5 mg', form: 'comprimé' },
  { name: 'Effexor', dosage: '75 mg', form: 'comprimé' }
]

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().default('1 comprimé'),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

const caregiverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notifySms: z.boolean().default(false),
  notifyEmail: z.boolean().default(false),
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medimemo-backend' })
})

// Search French medications
app.get('/api/medications/search', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase()
  if (!q || q.length < 2) return res.json([])
  const results = frenchMedications
    .filter(m => m.name.toLowerCase().includes(q))
    .slice(0, 8)
  res.json(results)
})

// Get medications for a user
app.get('/api/users/:userId/medications', async (req, res) => {
  try {
    const medications = await prisma.medication.findMany({
      where: { userId: req.params.userId },
      orderBy: { time: 'asc' }
    })
    res.json(medications)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medications' })
  }
})

// Create medication
app.post('/api/users/:userId/medications', async (req, res) => {
  try {
    const data = medicationSchema.parse(req.body)
    const medication = await prisma.medication.create({
      data: { ...data, userId: req.params.userId }
    })
    res.status(201).json(medication)
  } catch (error) {
    res.status(400).json({ error: 'Invalid medication data' })
  }
})

// Toggle taken
app.patch('/api/medications/:id/taken', async (req, res) => {
  try {
    const existing = await prisma.medication.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const medication = await prisma.medication.update({
      where: { id: req.params.id },
      data: {
        taken: !existing.taken,
        takenAt: !existing.taken ? new Date() : null
      }
    })
    res.json(medication)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medication' })
  }
})

// Delete medication
app.delete('/api/medications/:id', async (req, res) => {
  try {
    await prisma.medication.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete medication' })
  }
})

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name }
    })
    res.status(201).json(user)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user' })
  }
})

// Get user
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { medications: true, caregivers: true }
    })
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Caregivers
app.get('/api/users/:userId/caregivers', async (req, res) => {
  try {
    const caregivers = await prisma.caregiver.findMany({ where: { userId: req.params.userId } })
    res.json(caregivers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch caregivers' })
  }
})

app.post('/api/users/:userId/caregivers', async (req, res) => {
  try {
    const data = caregiverSchema.parse(req.body)
    const caregiver = await prisma.caregiver.create({
      data: { ...data, userId: req.params.userId }
    })
    res.status(201).json(caregiver)
  } catch (error) {
    res.status(400).json({ error: 'Invalid caregiver data' })
  }
})

app.delete('/api/caregivers/:id', async (req, res) => {
  try {
    await prisma.caregiver.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete caregiver' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 MediMémo backend running on port ${PORT}`)

  // Lancement du scheduler de notifications : toutes les 5 min
  setInterval(async () => {
    try {
      const result = await checkMissedDoses()
      if (result.alertsSent > 0) {
        console.log(`[CRON] ${result.alertsSent} alerte(s) envoyée(s)`)
      }
    } catch (e) {
      console.error('[CRON] Erreur:', e)
    }
  }, 5 * 60 * 1000)
})

// === Stripe / Premium routes ===
app.post('/api/billing/checkout', async (req, res) => {
  try {
    const { userId, email } = req.body
    if (!userId || !email) return res.status(400).json({ error: 'userId and email required' })
    const session = await createCheckoutSession(userId, email)
    res.json(session)
  } catch (e: any) {
    console.error('Checkout error:', e)
    res.status(500).json({ error: 'Checkout failed' })
  }
})

app.get('/api/billing/status/:userId', async (req, res) => {
  try {
    const status = await getSubscriptionStatus(req.params.userId)
    if (!status) return res.status(404).json({ error: 'User not found' })
    res.json(status)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch status' })
  }
})

app.post('/api/billing/cancel', async (req, res) => {
  try {
    const { userId } = req.body
    const ok = await cancelSubscription(userId)
    res.json({ success: ok })
  } catch (e) {
    res.status(500).json({ error: 'Failed to cancel' })
  }
})

// === Notifications routes ===
app.post('/api/notifications/check', async (_req, res) => {
  try {
    const result = await checkMissedDoses()
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: 'Failed to check' })
  }
})

// === Reports ===
app.get('/api/reports/monthly/:userId', async (req, res) => {
  try {
    const year = parseInt((req.query.year as string) || new Date().getFullYear().toString())
    const month = parseInt((req.query.month as string) || (new Date().getMonth() + 1).toString())
    const report = await getMonthlyReport(req.params.userId, year, month)
    res.json(report)
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate report' })
  }
})

// === Onboarding notifications toggle ===
app.patch('/api/users/:userId/notifications', async (req, res) => {
  try {
    const { enabled } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { notificationsEnabled: !!enabled }
    })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' })
  }
})

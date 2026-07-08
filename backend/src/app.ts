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
import { signup, login, authMiddleware } from './auth'
import { saveSubscription, removeSubscription, sendPushToUser, vapidPublicKey } from './push'
import { sendWelcomeEmail, sendPremiumConfirmationEmail } from './email'
import { getEhpadDashboard, getResidentDetail } from './ehpad'
import { trackServer } from './analytics'

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

// === Auth routes ===
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6+ caractères)' })
    const result = await signup(email, password, name)
    // Fire-and-forget welcome email
    sendWelcomeEmail(result.user.email, result.user.name || 'à MediMémo').catch(console.error)
    res.status(201).json(result)
  } catch (e: any) {
    if (e.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'Email déjà utilisé' })
    console.error('Signup error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
    const result = await login(email, password)
    res.json(result)
  } catch (e: any) {
    if (e.message === 'INVALID_CREDENTIALS') return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    console.error('Login error:', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// === Push notifications ===
app.get('/api/push/vapid-public-key', (_req, res) => {
  res.json({ publicKey: vapidPublicKey })
})

app.post('/api/push/subscribe', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId
    const { endpoint, keys } = req.body
    if (!endpoint || !keys) return res.status(400).json({ error: 'endpoint and keys required' })
    const sub = await saveSubscription(userId, endpoint, keys)
    res.status(201).json(sub)
  } catch (e) {
    console.error('Push subscribe error:', e)
    res.status(500).json({ error: 'Failed to subscribe' })
  }
})

app.post('/api/push/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId
    const { endpoint } = req.body
    await removeSubscription(userId, endpoint)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to unsubscribe' })
  }
})

// Endpoint de test pour envoyer un push (utile pour debug)
app.post('/api/push/test', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId
    const sent = await sendPushToUser(userId, {
      title: 'MediMémo - Test',
      body: 'Si vous voyez ceci, les notifications push fonctionnent !',
      tag: 'test'
    })
    res.json({ sent })
  } catch (e) {
    res.status(500).json({ error: 'Failed to send test push' })
  }
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

// === B2B EHPAD ===
app.get('/api/ehpad/dashboard', async (_req, res) => {
  try {
    const data = await getEhpadDashboard('demo-org')
    trackServer('ehpad_dashboard_viewed', { orgId: 'demo-org' })
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' })
  }
})

app.get('/api/ehpad/residents/:id', async (req, res) => {
  try {
    const data = await getResidentDetail(req.params.id)
    res.json(data)
  } catch (error) {
    res.status(404).json({ error: 'Resident not found' })
  }
})

export default app
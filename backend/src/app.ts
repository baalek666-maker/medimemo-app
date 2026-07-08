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
import referralRouter, { processReferralConversion } from './referral'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Stripe webhook needs RAW body BEFORE json middleware
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString())
    const result = await handleStripeWebhook(event as any) as any
    // Process referral conversion if a user upgraded to premium
    if (result?.userId) {
      await processReferralConversion(result.userId)
    }
    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({ error: 'Webhook error' })
  }
})

app.use(cors())
app.use(express.json())

// Referral + affiliate + gamification routes
app.use('/api/referral', referralRouter)

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

// === GDPR Routes ===

// Export all user data (RGPD - droit d'accès)
app.get('/api/users/:userId/gdpr/export', authMiddleware, async (req: any, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Non autorise' })
    }
    const userId = req.params.userId
    const [user, medications, caregivers, userBadges, affiliates, referralAsReferrer] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, isPremium: true, premiumUntil: true, createdAt: true } }),
      prisma.medication.findMany({ where: { userId } }),
      prisma.caregiver.findMany({ where: { userId } }),
      prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
      prisma.affiliate.findMany({ where: { userId } }),
      prisma.referral.findMany({ where: { referrerId: userId } })
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      medications,
      caregivers,
      badges: userBadges,
      affiliates,
      referralsGiven: referralAsReferrer,
      notice: 'Conforme au RGPD - Article 15 (droit d acces). Vos donnees sont exportees integralement.'
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="medimemo-donnees-${new Date().toISOString().split('T')[0]}.json"`)
    res.json(exportData)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l export' })
  }
})

// Delete account and all data (RGPD - droit à l'effacement)
app.delete('/api/users/:userId/gdpr/delete', authMiddleware, async (req: any, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Non autorise' })
    }
    const userId = req.params.userId

    // Delete in order (respecting foreign key constraints)
    await prisma.userBadge.deleteMany({ where: { userId } })
    await prisma.medication.deleteMany({ where: { userId } })
    await prisma.caregiver.deleteMany({ where: { userId } })
    await prisma.pushSubscription.deleteMany({ where: { userId } })
    await prisma.affiliate.deleteMany({ where: { userId } })
    // Referral FK requires User rows, so delete the referrals where the user is involved
    await prisma.referral.deleteMany({ where: { OR: [{ referrerId: userId }, { referredId: userId }] } })
    await prisma.user.delete({ where: { id: userId } })

    res.json({ success: true, message: 'Compte et toutes donnees supprimes definitivement.' })
  } catch (error) {
    console.error('GDPR delete error:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression' })
  }
})

// Privacy policy (public)
app.get('/api/privacy', (_req, res) => {
  res.json({
    version: '1.0',
    updatedAt: '2026-01-01',
    policy: {
      controller: 'MediMemo',
      purpose: 'Gestion de rappels de medicaments pour les particuliers et leurs aidants',
      legalBasis: 'Consentement (RGPD Art. 6.1.a) + Interet legitime (RGPD Art. 6.1.f)',
      dataCollected: [
        'Email et nom (creation de compte)',
        'Liste de medicaments (saisie par l utilisateur)',
        'Numero de telephone des aidants (pour envoi de SMS)',
        'Historique de prises (date, heure, medicament)',
        'Tokens push (navigateur ou appareil)',
        'Donnees de paiement (traitees par Stripe, non stockees)'
      ],
      retention: 'Les donnees sont conservees tant que le compte est actif. Suppression definitive dans les 30 jours suivant la demande.',
      rights: [
        'Droit d acces (Art. 15) - Export de vos donnees',
        'Droit de rectification (Art. 16)',
        'Droit a l effacement (Art. 17) - Suppression de compte',
        'Droit a la limitation (Art. 18)',
        'Droit a la portabilite (Art. 20)',
        'Droit d opposition (Art. 21)'
      ],
      contact: 'rgpd@medimemo.fr',
      dpo: 'DPO contactable a rgpd@medimemo.fr',
      cnil: 'Vous pouvez introduire une reclamation aupres de la CNIL (www.cnil.fr)'
    }
  }) 
})

// === Cron endpoint to process email queue ===
app.post('/api/cron/process-emails', async (_req, res) => {
  try {
    const result = await import('./email-sequences').then(m => m.processEmailQueue())
    res.json({ success: true, ...result })
  } catch (e) {
    console.error('[cron] Email processing failed:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

// === Admin dashboard ===
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-medimemo-dev'

function adminAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

app.get('/api/admin/metrics', adminAuth, async (_req, res) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      totalMeds,
      totalCaregivers,
      recentSignups,
      emailQueuePending,
      emailQueueSent,
      revenueAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.medication.count(),
      prisma.caregiver.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.emailQueue.count({ where: { sentAt: null } }),
      prisma.emailQueue.count({ where: { sentAt: { not: null } } }),
      prisma.user.count({ where: { isPremium: true } }),
    ])

    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0'
    const estimatedRevenue = premiumUsers * 59.99

    res.json({
      users: { total: totalUsers, premium: premiumUsers, free: totalUsers - premiumUsers, recentSignups },
      content: { medications: totalMeds, caregivers: totalCaregivers },
      revenue: {
        estimatedMonthly: estimatedRevenue,
        premiumUsers,
        pricePerYear: 59.99,
        conversionRate: `${conversionRate}%`,
      },
      emails: { pending: emailQueuePending, sent: emailQueueSent },
    })
  } catch (e) {
    console.error('[admin] Metrics error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/admin/users', adminAuth, async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, email: true, name: true, isPremium: true,
        premiumUntil: true, createdAt: true, loyaltyPoints: true, streakDays: true,
        _count: { select: { medications: true, caregivers: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ])

  res.json({ users, total, page, totalPages: Math.ceil(total / limit) })
})

app.get('/api/admin/revenue', adminAuth, async (_req, res) => {
  // Get monthly signups for chart
  const users = await prisma.user.findMany({
    select: { createdAt: true, isPremium: true },
    orderBy: { createdAt: 'asc' },
  })

  const monthly: Record<string, { signups: number; premium: number }> = {}
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 7) // YYYY-MM
    if (!monthly[key]) monthly[key] = { signups: 0, premium: 0 }
    monthly[key].signups++
    if (u.isPremium) monthly[key].premium++
  }

  res.json({
    monthly: Object.entries(monthly).map(([month, data]) => ({ month, ...data })),
    totalRevenue: users.filter(u => u.isPremium).length * 59.99,
    avgRevenuePerUser: users.length > 0
      ? (users.filter(u => u.isPremium).length * 59.99 / users.length).toFixed(2)
      : 0,
  })
})

export default app
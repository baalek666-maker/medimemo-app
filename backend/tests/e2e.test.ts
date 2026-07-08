import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TEST_EMAIL = `e2e-${Date.now()}@medimemo.fr`
let token: string
let userId: string

beforeAll(async () => {
  // Signup
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: TEST_EMAIL, password: 'Test1234!', name: 'E2E Test' })
  token = res.body.token
  userId = res.body.user.id
})

afterAll(async () => {
  // Cleanup
  if (userId) {
    await prisma.emailQueue.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.notificationLog.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.medication.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.caregiver.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
  }
  await prisma.$disconnect()
})

describe('MediMemo API - E2E Critical Flows', () => {
  // === GDPR ===
  describe('GDPR', () => {
    test('GET /api/users/:userId/gdpr/export - exports user data', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/gdpr/export`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('user')
      expect(res.body).toHaveProperty('medications')
      expect(res.body.user.email).toBe(TEST_EMAIL)
    })

    test('GET /api/users/:userId/gdpr/export - rejects unauthorized', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/gdpr/export`)
        .set('Authorization', 'Bearer wrong-token')
      expect(res.status).toBe(401)
    })
  })

  // === Email automation ===
  describe('Email automation', () => {
    test('user gets enrolled in onboarding sequence on signup', async () => {
      // Wait a bit for async enrollment
      await new Promise(r => setTimeout(r, 500))
      const queueItems = await prisma.emailQueue.findMany({
        where: { userId, template: { contains: 'onboarding' } },
      })
      expect(queueItems.length).toBeGreaterThan(0)
    })

    test('POST /api/cron/process-emails - processes queue', async () => {
      const res = await request(app)
        .post('/api/cron/process-emails')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('success', true)
    })
  })

  // === Admin ===
  describe('Admin dashboard', () => {
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-medimemo-dev'

    test('GET /api/admin/metrics - returns dashboard data', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('users')
      expect(res.body.users.total).toBeGreaterThan(0)
      expect(res.body).toHaveProperty('revenue')
    })

    test('GET /api/admin/metrics - rejects without token', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
      expect(res.status).toBe(401)
    })

    test('GET /api/admin/users - returns paginated users', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('users')
      expect(Array.isArray(res.body.users)).toBe(true)
      expect(res.body).toHaveProperty('total')
      expect(res.body).toHaveProperty('totalPages')
    })

    test('GET /api/admin/revenue - returns revenue data', async () => {
      const res = await request(app)
        .get('/api/admin/revenue')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('monthly')
      expect(res.body).toHaveProperty('totalRevenue')
    })
  })

  // === Full signup → med → GDPR flow ===
  describe('Full user journey', () => {
    let flowToken: string
    let flowUserId: string

    test('signup → create med → export → delete', async () => {
      const email = `flow-${Date.now()}@medimemo.fr`

      // 1. Signup
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email, password: 'Flow1234!', name: 'Flow Test' })
      expect(signupRes.status).toBe(201)
      flowToken = signupRes.body.token
      flowUserId = signupRes.body.user.id

      // 2. Create medication
      const medRes = await request(app)
        .post(`/api/users/${flowUserId}/medications`)
        .set('Authorization', `Bearer ${flowToken}`)
        .send({ name: 'Doliprane', dosage: '1000mg', time: '08:00' })
      expect(medRes.status).toBe(201)

      // 3. Export data
      const exportRes = await request(app)
        .get(`/api/users/${flowUserId}/gdpr/export`)
        .set('Authorization', `Bearer ${flowToken}`)
      expect(exportRes.status).toBe(200)
      expect(exportRes.body.medications.length).toBe(1)
      expect(exportRes.body.medications[0].name).toBe('Doliprane')

      // 4. Delete account
      const delRes = await request(app)
        .delete(`/api/users/${flowUserId}/gdpr/delete`)
        .set('Authorization', `Bearer ${flowToken}`)
      expect(delRes.status).toBe(200)

      // 5. Verify account gone
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'Flow1234!' })
      expect(loginRes.status).toBe(401)
    })
  })
})

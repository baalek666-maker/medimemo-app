import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'medimemo-dev-secret-change-in-prod'
const JWT_EXPIRES = '7d'

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface AuthResult {
  user: { id: string; email: string; name: string | null; isPremium: boolean }
  token: string
}

export async function signup(email: string, password: string, name?: string): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('EMAIL_EXISTS')

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || email.split('@')[0] }
  })
  const token = signToken(user.id)

  // Enroll in onboarding email sequence (fire and forget)
  import('./email-sequences').then(m => {
    m.enrollInSequence(user.id, user.email, user.name || user.email.split('@')[0], 'onboarding').catch(console.error)
  }).catch(console.error)

  return {
    user: { id: user.id, email: user.email, name: user.name, isPremium: user.isPremium },
    token
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) throw new Error('INVALID_CREDENTIALS')

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  const token = signToken(user.id)
  return {
    user: { id: user.id, email: user.email, name: user.name, isPremium: user.isPremium },
    token
  }
}

// Express middleware
import { Request, Response, NextFunction } from 'express'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  ;(req as any).userId = decoded.userId
  next()
}

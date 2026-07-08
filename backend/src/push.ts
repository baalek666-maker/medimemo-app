import webpush from 'web-push'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BDlR9ZxDFP2EoDAiS4_yx575nTUaQNPQoofpezALDVjKeAWFGWsB4RWgK1QgNxenA6-Aku3LIQVSaoMq0uTMsfA'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '7ip7iumAVIQ9uqgoxTQiCA-FgR8rSjEDo_CKO1Nuh6Q'
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@medimemo.fr'

// Configure VAPID keys
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

export const vapidPublicKey = VAPID_PUBLIC

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return 0

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    tag: payload.tag || 'medimemo-reminder',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
  })

  let sent = 0
  for (const sub of subs) {
    try {
      const keys = JSON.parse(sub.keys)
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth }
      }
      await webpush.sendNotification(pushSub, jsonPayload)
      sent++
    } catch (err: any) {
      // 404/410 = subscription is dead, remove it
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      } else {
        console.error('[PUSH] Error sending to', sub.endpoint.slice(0, 60), err.statusCode || err.message)
      }
    }
  }
  return sent
}

export async function saveSubscription(userId: string, endpoint: string, keys: { p256dh: string; auth: string }) {
  return prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint } },
    update: { keys: JSON.stringify(keys) },
    create: { userId, endpoint, keys: JSON.stringify(keys) }
  })
}

export async function removeSubscription(userId: string, endpoint: string) {
  return prisma.pushSubscription.deleteMany({ where: { userId, endpoint } })
}

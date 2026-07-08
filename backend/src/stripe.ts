import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
const isTestMode = !stripeSecretKey || stripeSecretKey.startsWith('sk_test_')

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' as any })
  : null

const PRICE_AMOUNT = 5999 // 59.99 EUR in cents
const CURRENCY = 'eur'
const PRODUCT_NAME = 'MediMémo Premium - Abonnement annuel'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export async function createCheckoutSession(userId: string, userEmail: string) {
  if (!stripe) {
    // Mode démo/test : simule un checkout réussi
    console.log('[STRIPE TEST MODE] Simulating checkout for', userEmail)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        stripeCustomerId: 'cus_test_' + userId.slice(0, 8),
        stripeSubId: 'sub_test_' + userId.slice(0, 8)
      }
    })
    return {
      url: `${FRONTEND_URL}/?premium=success&demo=1`,
      sessionId: 'cs_test_' + userId.slice(0, 8)
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: CURRENCY,
        product_data: { name: PRODUCT_NAME, description: "1 an d'accès MediMémo Premium" },
        unit_amount: PRICE_AMOUNT,
        recurring: { interval: 'year' }
      },
      quantity: 1
    }],
    customer_email: userEmail,
    success_url: `${FRONTEND_URL}/?premium=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/?premium=cancel`,
    metadata: { userId }
  })

  return { url: session.url!, sessionId: session.id }
}

import { sendPremiumConfirmationEmail } from './email'

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId) {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string
          }
        })
        // Send premium confirmation email
        if (updated.email) {
          sendPremiumConfirmationEmail(updated.email, updated.name || '').catch(console.error)
        }
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeSubId: sub.id },
        data: { isPremium: false }
      })
      break
    }
  }
}

export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null
  return {
    isPremium: user.isPremium,
    premiumUntil: user.premiumUntil,
    testMode: isTestMode
  }
}

export async function cancelSubscription(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.stripeSubId) return false
  if (stripe && !user.stripeSubId.startsWith('sub_test_')) {
    await stripe.subscriptions.cancel(user.stripeSubId)
  }
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: false }
  })
  return true
}

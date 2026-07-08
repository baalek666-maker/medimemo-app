import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth';

const prisma = new PrismaClient();
const router = Router();

// Generate a unique referral code (8 chars)
function generateCode(prefix = 'MED'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Ensure user has a referral code, create one if missing
async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.referralCode) return user.referralCode;
  const code = generateCode();
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

// GET /api/referral/me — get my referral code + stats
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const code = await ensureReferralCode(userId);

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const total = referrals.length;
    const converted = referrals.filter((r) => r.status === 'converted' || r.status === 'rewarded').length;
    const rewarded = referrals.filter((r) => r.rewardGiven).length;

    res.json({
      code,
      shareUrl: `https://medimemo.fr/r/${code}`,
      stats: { total, converted, rewarded },
      referrals: referrals.map((r) => ({
        status: r.status,
        createdAt: r.createdAt,
        convertedAt: r.convertedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/referral/apply — apply a referral code at signup
router.post('/apply', async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'Code et userId requis' });

    const referrer = await prisma.user.findFirst({ where: { referralCode: code } });
    if (!referrer) return res.status(404).json({ error: 'Code invalide' });
    if (referrer.id === userId) return res.status(400).json({ error: 'Vous ne pouvez pas utiliser votre propre code' });

    // Check if already referred
    const existing = await prisma.referral.findFirst({ where: { referredId: userId } });
    if (existing) return res.status(400).json({ error: 'Déjà parrainé' });

    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        code,
        status: 'pending',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { referredByCode: code },
    });

    res.json({ success: true, message: 'Code de parrainage appliqué' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/referral/convert — called when a referred user upgrades to premium
async function processReferralConversion(userId: string) {
  try {
    const referral = await prisma.referral.findFirst({
      where: { referredId: userId, status: 'pending' },
    });
    if (!referral) return;

    // Mark referral as converted and reward both parties
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'rewarded', rewardGiven: true, convertedAt: new Date() },
    });

    // Reward: referrer gets 1 month free extension, referred user gets 10€ discount already applied
    const referrer = await prisma.user.findUnique({ where: { id: referral.referrerId } });
    if (referrer?.premiumUntil && referrer.premiumUntil > new Date()) {
      const extended = new Date(referrer.premiumUntil);
      extended.setMonth(extended.getMonth() + 1);
      await prisma.user.update({
        where: { id: referrer.id },
        data: { premiumUntil: extended },
      });
    }

    // Add loyalty points to both
    await prisma.user.update({
      where: { id: referral.referrerId },
      data: { loyaltyPoints: { increment: 100 } },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: 50 } },
    });
  } catch (err) {
    console.error('Referral conversion error:', err);
  }
}

// ============ AFFILIATE PROGRAM ============

// POST /api/referral/affiliate/register — become an affiliate
router.post('/affiliate/register', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const existing = await prisma.affiliate.findFirst({ where: { userId } });
    if (existing) return res.json({ affiliateCode: existing.affiliateCode });

    const affiliateCode = generateCode('AFF');
    const affiliate = await prisma.affiliate.create({
      data: { userId, affiliateCode },
    });

    res.json({
      affiliateCode: affiliate.affiliateCode,
      shareUrl: `https://medimemo.fr?a=${affiliate.affiliateCode}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/referral/affiliate/dashboard — affiliate stats
router.get('/affiliate/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const affiliate = await prisma.affiliate.findFirst({
      where: { userId },
      include: {
        conversions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!affiliate) return res.status(404).json({ error: 'Pas encore affilié' });

    res.json({
      affiliateCode: affiliate.affiliateCode,
      shareUrl: `https://medimemo.fr?a=${affiliate.affiliateCode}`,
      stats: {
        clicks: affiliate.clickCount,
        signups: affiliate.signupCount,
        paid: affiliate.paidCount,
        totalEarnings: affiliate.totalEarnings,
        pendingEarnings: affiliate.pendingEarnings,
        conversionRate: affiliate.clickCount > 0
          ? ((affiliate.paidCount / affiliate.clickCount) * 100).toFixed(1) + '%'
          : '0%',
      },
      recentConversions: affiliate.conversions.map((c) => ({
        amount: c.amount,
        status: c.status,
        date: c.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/referral/affiliate/track — track a click (public, no auth)
router.get('/affiliate/track', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Code requis' });

    const affiliate = await prisma.affiliate.findFirst({ where: { affiliateCode: code } });
    if (!affiliate) return res.status(404).json({ error: 'Code invalide' });

    await prisma.$transaction([
      prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { clickCount: { increment: 1 } },
      }),
      prisma.affiliateClick.create({
        data: {
          affiliateId: affiliate.id,
          ipHash: req.ip || null,
          userAgent: req.get('user-agent') || null,
        },
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ GAMIFICATION / BADGES ============

// Seed default badges on first call
const DEFAULT_BADGES = [
  { slug: 'first-step', name: 'Premier pas', description: 'Premier médicament ajouté', icon: '🎯', threshold: 1, type: 'points' },
  { slug: 'week-streak', name: '7 jours', description: '7 jours consécutifs sans oubli', icon: '🔥', threshold: 7, type: 'streak' },
  { slug: 'month-streak', name: 'Champion', description: '30 jours consécutifs', icon: '🏆', threshold: 30, type: 'streak' },
  { slug: 'loyal-member', name: 'Membre fidèle', description: '100 points de fidélité', icon: '⭐', threshold: 100, type: 'points' },
  { slug: 'super-hero', name: 'Super héros', description: '90 jours consécutifs', icon: '💪', threshold: 90, type: 'streak' },
  { slug: 'godfather', name: 'Parrain', description: '5 filleuls parrainés', icon: '👑', threshold: 5, type: 'special' },
];

async function seedBadges() {
  for (const badge of DEFAULT_BADGES) {
    const exists = await prisma.badge.findUnique({ where: { slug: badge.slug } });
    if (!exists) {
      await prisma.badge.create({ data: badge });
    }
  }
}

// GET /api/referral/badges — get all badges + my earned ones
router.get('/badges', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    await seedBadges();

    const [badges, userBadges, user] = await Promise.all([
      prisma.badge.findMany(),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const earnedSlugs = new Set(userBadges.map((ub) => ub.badge.slug));

    res.json({
      loyaltyPoints: user?.loyaltyPoints || 0,
      streakDays: user?.streakDays || 0,
      badges: badges.map((b) => ({
        ...b,
        earned: earnedSlugs.has(b.slug),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/referral/streak/update — update streak when user marks meds as taken
router.post('/streak/update', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = user.streakDays;
    if (user.lastTakenDate) {
      const last = new Date(user.lastTakenDate);
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = user.streakDays + 1;
      } else if (diffDays > 1) {
        newStreak = 1; // streak broken
      }
      // diffDays === 0 means already updated today, no change
    } else {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        streakDays: newStreak,
        lastTakenDate: today,
        loyaltyPoints: { increment: 10 },
      },
    });

    // Auto-award streak badges
    await seedBadges();
    const badges = await prisma.badge.findMany({ where: { type: 'streak' } });
    for (const badge of badges) {
      if (newStreak >= badge.threshold) {
        const has = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
        });
        if (!has) {
          await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        }
      }
    }

    res.json({ streakDays: newStreak, loyaltyPoints: (user.loyaltyPoints || 0) + 10 });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
export { processReferralConversion };

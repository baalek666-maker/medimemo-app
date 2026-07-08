import { useState, useEffect } from 'react'
import { getMyReferral, getBadges, registerAffiliate, getAffiliateDashboard } from './api'

interface ReferralData {
  code: string
  shareUrl: string
  stats: { total: number; converted: number; rewarded: number }
  referrals: { status: string; createdAt: string; convertedAt: string | null }[]
}

interface BadgeData {
  loyaltyPoints: number
  streakDays: number
  badges: {
    id: string
    slug: string
    name: string
    description: string
    icon: string
    threshold: number
    type: string
    earned: boolean
  }[]
}

interface AffiliateData {
  affiliateCode: string
  shareUrl: string
  stats: {
    clicks: number
    signups: number
    paid: number
    totalEarnings: number
    pendingEarnings: number
    conversionRate: string
  }
  recentConversions: { amount: number; status: string; date: string }[]
}

type Tab = 'referral' | 'badges' | 'affiliate'

export default function Referral({ token, onClose }: { token: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('referral')
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [badges, setBadges] = useState<BadgeData | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ref, bdg] = await Promise.all([
        getMyReferral(token),
        getBadges(token),
      ])
      setReferral(ref)
      setBadges(bdg)
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  async function loadAffiliate() {
    try {
      const data = await getAffiliateDashboard(token)
      setAffiliate(data)
    } catch {
      // not registered yet
    }
  }

  async function handleRegisterAffiliate() {
    try {
      await registerAffiliate(token)
      await loadAffiliate()
    } catch (e) {
      console.error('Affiliate register error:', e)
    }
  }

  function copyLink() {
    if (!referral) return
    navigator.clipboard.writeText(referral.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    if (!referral) return
    const text = encodeURIComponent(
      `💊 Plus jamais d'oubli de médicaments ! MediMémo m'envoie un rappel à l'heure exacte. Inscris-toi avec mon code ${referral.code} : `
    )
    window.open(`https://wa.me/?text=${text}${encodeURIComponent(referral.shareUrl)}`, '_blank')
  }

  function shareEmail() {
    if (!referral) return
    const subject = encodeURIComponent('Ne rate plus jamais tes médicaments')
    const body = encodeURIComponent(
      `Salut,\n\nJ'utilise MediMémo pour mes rappels de médicaments et c'est génial.\n\nInscris-toi avec mon code ${referral.code} : ${referral.shareUrl}\n\nÀ bientôt !`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-2xl text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800">🎁 Parrainage & Récompenses</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          ← Retour
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 max-w-2xl mx-auto">
        <TabButton active={tab === 'referral'} onClick={() => setTab('referral')}>
          🎁 Parrainage
        </TabButton>
        <TabButton active={tab === 'badges'} onClick={() => setTab('badges')}>
          🏆 Mes badges
        </TabButton>
        <TabButton active={tab === 'affiliate'} onClick={() => { setTab('affiliate'); if (!affiliate) loadAffiliate() }}>
          💰 Affiliation
        </TabButton>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* REFERRAL TAB */}
        {tab === 'referral' && referral && (
          <div className="space-y-6">
            {/* Hero card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
              <p className="text-sm opacity-90 mb-1">Votre code de parrainage</p>
              <p className="text-4xl font-bold tracking-wider mb-4">{referral.code}</p>
              <div className="flex items-center gap-2 bg-white/20 rounded-xl p-3 backdrop-blur">
                <span className="text-sm truncate flex-1">{referral.shareUrl}</span>
                <button
                  onClick={copyLink}
                  className="bg-white text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50"
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={shareWhatsApp}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium transition"
                >
                  📱 WhatsApp
                </button>
                <button
                  onClick={shareEmail}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2.5 rounded-xl font-medium transition backdrop-blur"
                >
                  ✉️ Email
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Comment ça marche</h3>
              <div className="space-y-3">
                <Step n={1} text="Partagez votre lien à vos proches" icon="📤" />
                <Step n={2} text="Ils créent un compte MediMémo gratuit" icon="👤" />
                <Step n={3} text="S'ils passent Premium, vous gagnez 1 mois offert + 100 points" icon="🎉" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Invités" value={referral.stats.total} color="text-blue-600" />
              <StatCard label="Inscrits" value={referral.stats.converted} color="text-green-600" />
              <StatCard label="Premium" value={referral.stats.rewarded} color="text-purple-600" />
            </div>

            {/* Recent referrals */}
            {referral.referrals.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3">Vos filleuls</h3>
                {referral.referrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-slate-600">
                      Filleul #{i + 1}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BADGES TAB */}
        {tab === 'badges' && badges && (
          <div className="space-y-6">
            {/* Streak + Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-4xl font-bold">{badges.streakDays}</p>
                <p className="text-sm opacity-90 mt-1">jours de suite 🔥</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-4xl font-bold">{badges.loyaltyPoints}</p>
                <p className="text-sm opacity-90 mt-1">points fidélité ⭐</p>
              </div>
            </div>

            {/* Badges grid */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Vos médailles</h3>
              <div className="grid grid-cols-2 gap-4">
                {badges.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-4 text-center transition ${
                      badge.earned
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-amber-300'
                        : 'bg-slate-50 border-2 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className={`text-4xl mb-2 ${badge.earned ? '' : 'grayscale'}`}>
                      {badge.icon}
                    </div>
                    <p className="font-bold text-sm text-slate-800">{badge.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                    {badge.earned && (
                      <span className="inline-block mt-2 text-xs font-medium text-amber-600">
                        ✓ Obtenu
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AFFILIATE TAB */}
        {tab === 'affiliate' && (
          <div className="space-y-6">
            {!affiliate ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Devenez partenaire affilié
                </h3>
                <p className="text-slate-600 mb-6">
                  Gagnez <strong>30% de commission</strong> sur chaque abonnement Premium
                  généré via votre lien. Idéal pour influenceurs, blogueurs santé, et créateurs
                  de contenu.
                </p>
                <ul className="text-left space-y-2 mb-6 max-w-sm mx-auto">
                  <li className="flex items-start gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> 30% par vente (18€/conversion)
                  </li>
                  <li className="flex items-start gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> Paiement mensuel via PayPal
                  </li>
                  <li className="flex items-start gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> Dashboard en temps réel
                  </li>
                  <li className="flex items-start gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> Aucun minimum de ventes
                  </li>
                </ul>
                <button
                  onClick={handleRegisterAffiliate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition"
                >
                  Activer mon compte affilié
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                  <p className="text-sm opacity-90 mb-1">Votre lien affilié</p>
                  <div className="flex items-center gap-2 bg-white/20 rounded-xl p-3 backdrop-blur">
                    <span className="text-sm truncate flex-1">{affiliate.shareUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(affiliate.shareUrl)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {copied ? '✓' : 'Copier'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Clics" value={affiliate.stats.clicks} color="text-blue-600" />
                  <StatCard label="Inscriptions" value={affiliate.stats.signups} color="text-green-600" />
                  <StatCard label="Conversions" value={affiliate.stats.paid} color="text-purple-600" />
                  <StatCard label="Taux" value={affiliate.stats.conversionRate} color="text-orange-600" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-5 border-2 border-green-200">
                    <p className="text-xs text-slate-500 uppercase">En attente</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {affiliate.stats.pendingEarnings.toFixed(2)}€
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl p-5 border-2 border-purple-200">
                    <p className="text-xs text-slate-500 uppercase">Total gagné</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {affiliate.stats.totalEarnings.toFixed(2)}€
                    </p>
                  </div>
                </div>

                {affiliate.recentConversions.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3">Conversions récentes</h3>
                    {affiliate.recentConversions.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm text-slate-600">
                          {new Date(c.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="font-bold text-green-600">
                          +{c.amount.toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
        active
          ? 'bg-slate-800 text-white shadow-md'
          : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function Step({ n, text, icon }: { n: number; text: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
        {n}
      </div>
      <span className="text-slate-700 text-sm">{text}</span>
      <span className="ml-auto text-xl">{icon}</span>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
    converted: { label: 'Inscrit', color: 'bg-blue-100 text-blue-700' },
    rewarded: { label: 'Premium ✓', color: 'bg-green-100 text-green-700' },
  }
  const s = map[status] || map.pending
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
      {s.label}
    </span>
  )
}

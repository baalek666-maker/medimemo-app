import { useState, useEffect } from 'react'
import { Check, X, ChevronLeft, Crown, Sparkles, Clock, Shield, Heart, Users, FileText, Bell, Star, Lock } from 'lucide-react'
import * as api from './api'
import { track } from './analytics'
import { getVariant } from './experiments'

interface PaywallProps {
  user: any
  onBack: () => void
  onSubscribed: () => void
  onLogout: () => void
}

const PREMIUM_FEATURES = [
  { icon: Pill, title: 'Medicaments illimitis', desc: 'Ajoutez autant de medicaments que necessaire' },
  { icon: Users, title: 'Aidants illimitis', desc: 'Famille, infirmiers, voisins - tout le monde peut veiller' },
  { icon: Bell, title: 'Alertes SMS temps reel', desc: 'SMS immediat si un proche oublie sa dose' },
  { icon: FileText, title: 'Rapports PDF pour le medecin', desc: 'Document professionnel a imprimer pour chaque RDV' },
  { icon: Heart, title: 'Base de medicaments francaise', desc: '80+ medicaments pre-configures avec dosages' },
  { icon: Shield, title: 'Support prioritaire', desc: 'Reponse garantie sous 24h, 7j/7' }
]

function Pill(props: any) {
  return <span {...props} />
}

const TESTIMONIALS = [
  { name: 'Martine D.', age: 67, text: 'Mon fils est tranquille maintenant. Il sait si j\'ai pris mes pilules.', city: 'Lyon', rating: 5 },
  { name: 'Jean-Pierre M.', age: 72, text: 'Le rapport PDF, mon medecin adore. Il voit exactement ce que je prends.', city: 'Bordeaux', rating: 5 },
  { name: 'Sophie L.', age: 45, text: 'Je veille sur maman a distance. Le SMS si elle oublie, c\'est genial.', city: 'Paris', rating: 5 }
]

export default function Paywall({ user, onBack, onSubscribed, onLogout }: PaywallProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [urgencyTimer, setUrgencyTimer] = useState(900) // 15 min countdown
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual')

  // A/B test the pricing display
  const pricingVariant = getVariant('premium_pricing', user.id) // 'control' or 'monthly'

  useEffect(() => {
    const interval = setInterval(() => {
      setUrgencyTimer(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSubscribe = async () => {
    setProcessing(true)
    setError('')
    track('premium_subscribe_clicked', { plan: selectedPlan, time_remaining: urgencyTimer })
    try {
      const result = await api.createCheckoutSession(user.id, user.email) as any
      if (result.url) {
        window.location.href = result.url
      }
    } catch (e: any) {
      setError('Erreur lors de la souscription. Reessayez.')
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Annuler votre abonnement Premium ? Vous perdrez tous les avantages.')) return
    track('subscription_cancelled')
    await api.cancelSubscription(user.id)
    onSubscribed()
    alert('Abonnement annule. Desole de vous voir partir.')
  }

  // === Already premium ===
  if (user.isPremium) {
    return (
      <main className="p-5 pb-28 min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Mon compte</h2>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Crown size={28} />
            </div>
            <div>
              <div className="font-bold text-xl">Membre Premium</div>
              <div className="text-amber-100 text-sm">{user.email}</div>
            </div>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="text-sm text-amber-100">Abonnement actif jusqu'au</div>
            <div className="text-xl font-bold">
              {user.premiumUntil ? new Date(user.premiumUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            Vos avantages actifs
          </h3>
          <div className="space-y-2">
            {PREMIUM_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Check size={16} className="text-green-600 shrink-0" />
                <span className="text-slate-700">{f.title}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setShowCancel(!showCancel)} className="text-slate-400 text-sm w-full text-center py-2">
          {showCancel ? 'Annuler' : 'Gerer mon abonnement'}
        </button>

        {showCancel && (
          <button onClick={handleCancel} className="btn-secondary w-full text-red-600 border-red-200">
            Annuler mon abonnement Premium
          </button>
        )}

        <div className="border-t border-slate-200 mt-6 pt-4">
          <button onClick={onLogout} className="text-slate-500 text-sm flex items-center gap-2 mx-auto">
            Se deconnecter
          </button>
        </div>
      </main>
    )
  }

  // === Paywall (not premium) ===
  return (
    <main className="p-5 pb-28 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Urgency banner */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-3 mb-6 flex items-center gap-3">
        <Clock size={20} />
        <div className="flex-1">
          <div className="font-bold text-sm">Offre de lancement -50%</div>
          <div className="text-xs text-white/90">Se termine dans {formatTime(urgencyTimer)}</div>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Crown size={16} />
          MediMemo Premium
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Ne ratez plus jamais une dose
        </h1>
        <p className="text-slate-600 max-w-md mx-auto">
          Rejoignez les milliers de familles qui dorment tranquilles grace au suivi automatique de leurs medicaments.
        </p>
      </div>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex">
          {[1,2,3,4,5].map(i => <Star key={i} size={18} className="text-amber-400 fill-amber-400" />)}
        </div>
        <span className="text-sm text-slate-600">4,8/5 · 12 000+ utilisateurs</span>
      </div>

      {/* Pricing cards */}
      <div className="space-y-3 mb-6">
        {/* Annual - highlighted */}
        <button
          onClick={() => { setSelectedPlan('annual'); track('plan_selected', { plan: 'annual' }) }}
          className={`w-full text-left rounded-2xl p-5 border-2 transition-all relative ${
            selectedPlan === 'annual'
              ? 'border-blue-600 bg-blue-50 shadow-md'
              : 'border-slate-200 bg-white'
          }`}
        >
          {pricingVariant === 'control' && (
            <div className="absolute -top-3 left-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              MEILLEURE OFFRE · -50%
            </div>
          )}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold text-slate-900 mb-1">Annuel</div>
              <div className="text-sm text-slate-600">Facture une fois par an</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">29,99 €</div>
              <div className="text-sm text-slate-600 line-through">59,99 €</div>
              <div className="text-xs text-blue-600 font-medium">soit 2,49 €/mois</div>
            </div>
          </div>
          {selectedPlan === 'annual' && (
            <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
              <Check size={16} /> Plan selectionne
            </div>
          )}
        </button>

        {/* Monthly */}
        <button
          onClick={() => { setSelectedPlan('monthly'); track('plan_selected', { plan: 'monthly' }) }}
          className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
            selectedPlan === 'monthly'
              ? 'border-slate-400 bg-slate-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold text-slate-900 mb-1">Mensuel</div>
              <div className="text-sm text-slate-600">Sans engagement</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">4,99 €</div>
              <div className="text-sm text-slate-600">/mois</div>
            </div>
          </div>
          {selectedPlan === 'monthly' && (
            <div className="mt-3 flex items-center gap-2 text-slate-600 text-sm font-medium">
              <Check size={16} /> Plan selectionne
            </div>
          )}
        </button>
      </div>

      {/* Free vs Premium comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
          <div className="p-3 text-xs font-medium text-slate-500"></div>
          <div className="p-3 text-center text-xs font-bold text-slate-400">Gratuit</div>
          <div className="p-3 text-center text-xs font-bold text-amber-600 bg-amber-50">Premium</div>
        </div>
        {[
          { label: 'Medicaments suivis', free: '2 max', premium: 'Illimite' },
          { label: 'Aidants', free: 'Aucun', premium: 'Illimite' },
          { label: 'Alertes SMS', free: false, premium: true },
          { label: 'Rapport PDF', free: false, premium: true },
          { label: 'Base medicaments FR', free: false, premium: true },
          { label: 'Support prioritaire', free: false, premium: true }
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-3 border-b border-slate-100 last:border-0">
            <div className="p-3 text-xs text-slate-600">{row.label}</div>
            <div className="p-3 text-center">
              {typeof row.free === 'boolean' ? (
                row.free ? <Check size={14} className="text-green-500 mx-auto" /> : <X size={14} className="text-slate-300 mx-auto" />
              ) : (
                <span className="text-xs text-slate-500">{row.free}</span>
              )}
            </div>
            <div className="p-3 text-center bg-amber-50/50">
              {typeof row.premium === 'boolean' ? (
                row.premium ? <Check size={14} className="text-green-600 mx-auto" /> : <X size={14} className="text-slate-300 mx-auto" />
              ) : (
                <span className="text-xs font-bold text-amber-700">{row.premium}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}

      <button
        onClick={handleSubscribe}
        disabled={processing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mb-3"
      >
        {processing ? 'Redirection...' : `Demarrer maintenant · ${selectedPlan === 'annual' ? '29,99 €/an' : '4,99 €/mois'}`}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mb-6">
        <span className="flex items-center gap-1"><Lock size={12} /> Paiement securise Stripe</span>
        <span>·</span>
        <span>Annulation a tout moment</span>
      </div>

      {/* Testimonials */}
      <div className="space-y-3 mb-6">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">
                {t.name[0]}
              </div>
              <div>
                <div className="font-medium text-sm text-slate-900">{t.name}, {t.age} ans</div>
                <div className="text-xs text-slate-500">{t.city}</div>
              </div>
              <div className="ml-auto flex">
                {[1,2,3,4,5].map(j => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
              </div>
            </div>
            <p className="text-sm text-slate-600 italic">"{t.text}"</p>
          </div>
        ))}
      </div>

      {/* Guarantee */}
      <div className="bg-green-50 rounded-2xl p-4 text-center mb-6">
        <Shield size={24} className="text-green-600 mx-auto mb-2" />
        <div className="font-bold text-sm text-slate-900 mb-1">Garantie 30 jours satisfait ou rembourse</div>
        <div className="text-xs text-slate-600">Pas content ? Vous etes rembourse integralement, sans question.</div>
      </div>

      {/* Logout */}
      <button onClick={onLogout} className="text-slate-400 text-sm mx-auto block">
        Se deconnecter
      </button>
    </main>
  )
}

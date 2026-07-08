import { useState, useEffect } from 'react'
import { Home, Plus, User, ChevronRight, Shield, Heart, Search, Trash2, Users, Check, ChevronLeft, Bell, FileText, LogOut, Lock, Download } from 'lucide-react'
import * as api from './api'
import { track, identifyUser, resetAnalytics } from './analytics'
import { EhpadLanding, EhpadDashboard } from './Ehpad'
import Referral from './Referral'
import { LandingPageView, SEO_PAGES } from './LandingPages'
import { getLandingCta } from './experiments'
import jsPDF from 'jspdf'

interface Medication {
  id: string
  name: string
  dose: string
  time: string
  taken: boolean
}

interface Caregiver {
  id: string
  name: string
  phone?: string
  email?: string
  notifySms: boolean
  notifyEmail: boolean
}

interface FrenchMed {
  name: string
  dosage: string
  form: string
}

interface UserData {
  id: string
  email: string
  name?: string
  isPremium: boolean
  premiumUntil?: string
}

type Screen = 'home' | 'add' | 'premium' | 'caregiver' | 'report' | 'landing' | 'signup' | 'login' | 'ehpad' | 'ehpad-demo' | 'referral'

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [user, setUser] = useState<UserData | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied'>('default')
  const [seoSlug, setSeoSlug] = useState<string | null>(null)

  // Init : check if user exists in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('medimemo_token')
    const storedUserId = localStorage.getItem('medimemo_userId')
    const url = new URL(window.location.href)
    // Check if URL matches a SEO landing page
    const path = url.pathname.replace(/^\//, '').replace(/\/$/, '')
    const seoPage = SEO_PAGES.find((p) => p.slug === path)
    if (seoPage) {
      setScreen('landing' as any) // will be handled below
      setSeoSlug(path)
    } else if (url.searchParams.get('premium') === 'success') {
      if (storedUserId) {
        setUserId(storedUserId)
        loadUser(storedUserId)
        setScreen('home')
      }
    } else if (storedUserId && storedToken) {
      setUserId(storedUserId)
        loadUser(storedUserId)
      setScreen('home')
    } else {
      setScreen('landing')
    }

    if ('Notification' in window) {
      setNotificationStatus(Notification.permission as any)
    }
  }, [])

  const loadUser = async (uid: string) => {
    setLoading(true)
    try {
      const userData = await api.getUser(uid) as any
      setUser({ id: userData.id, email: userData.email, name: userData.name, isPremium: userData.isPremium, premiumUntil: userData.premiumUntil })
      setMedications(userData.medications || [])
      setCaregivers(userData.caregivers || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = async (authData: { user: any; token: string }) => {
    localStorage.setItem('medimemo_token', authData.token)
    localStorage.setItem('medimemo_userId', authData.user.id)
    setUserId(authData.user.id)
    setUser({ id: authData.user.id, email: authData.user.email, name: authData.user.name, isPremium: authData.user.isPremium })
    identifyUser(authData.user.id, { email: authData.user.email, name: authData.user.name })
    track('user_logged_in', { method: 'email' })
    setScreen('home')
    requestNotificationPermission()
    subscribeToPush(authData.token)
  }

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      const authData = await api.authLogin(email, password)
      await handleAuthSuccess(authData)
    } catch (e: any) {
      alert(e.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const authData = await api.authSignup(email, password, name)
      await handleAuthSuccess(authData)
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('medimemo_token')
    localStorage.removeItem('medimemo_userId')
    resetAnalytics()
    setUserId(null)
    setUser(null)
    setMedications([])
    setCaregivers([])
    setScreen('landing')
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotificationStatus(result as any)
    if (result === 'granted') {
      new Notification('MediMémo activé ✓', {
        body: 'Vous recevrez vos rappels de médicaments.',
        icon: '/icon-192x192.png'
      })
    }
  }

  const subscribeToPush = async (token: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const registration = await navigator.serviceWorker.ready
      const vapidKey = await api.getVapidPublicKey()
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      })
      await api.subscribePush(token, sub)
      console.log('[PUSH] Subscribed successfully')
    } catch (e) {
      console.error('[PUSH] Subscribe failed:', e)
    }
  }

  const testNotification = () => {
    if (notificationStatus === 'granted') {
      new Notification('MediMémo - Test', {
        body: "Il est l'heure de prendre votre Doliprane (1 comprimé).",
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      })
    } else {
      requestNotificationPermission()
    }
  }

  // === Landing Screen ===
  if (screen === 'landing') {
    return <LandingScreen onSignup={() => setScreen('signup')} onLogin={() => setScreen('login')} onEhpad={() => setScreen('ehpad')} />
  }

  // === B2B EHPAD ===
  if (screen === 'ehpad') {
    return <EhpadLanding onBack={() => setScreen('landing')} onDemo={() => setScreen('ehpad-demo')} />
  }
  if (screen === 'ehpad-demo') {
    return <EhpadDashboard onBack={() => setScreen('ehpad')} />
  }

  if (seoSlug) {
    return <LandingPageView slug={seoSlug} onSignup={() => { setSeoSlug(null); setScreen('signup') }} />
  }

  if (screen === 'referral') {
    return <Referral token={localStorage.getItem('medimemo_token') || ''} onClose={() => setScreen('home')} />
  }

  // === Signup Screen ===
  if (screen === 'signup') {
    return <SignupScreen onSubmit={handleSignup} onBack={() => setScreen('landing')} loading={loading} />
  }

  if (screen === 'login') {
    return <LoginScreen onSubmit={handleLogin} onBack={() => setScreen('landing')} loading={loading} />
  }

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-primary-600 font-semibold">Chargement de MediMémo…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-2xl relative">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MediMémo</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.isPremium && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">PREMIUM</span>
            )}
            <button onClick={() => setScreen('referral')} className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
              🎁 Parrainer
            </button>
            <button onClick={() => { track('premium_viewed'); setScreen('premium') }} className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
              {user?.isPremium ? 'Mon compte' : 'Premium'}
            </button>
          </div>
        </div>
      </header>

      {screen === 'home' && (
        <HomeScreen
          user={user!}
          medications={medications}
          caregivers={caregivers}
          notificationStatus={notificationStatus}
          onAdd={() => setScreen('add')}
          onCaregiver={() => setScreen('caregiver')}
          onPremium={() => { track('premium_viewed'); setScreen('premium') }}
          onReport={() => setScreen('report')}
          onToggleTaken={async (id: string) => {
            await api.toggleMedicationTaken(id)
            const meds = await api.getMedications(userId)
            setMedications(meds)
          }}
          onRemoveMed={async (id: string) => {
            await api.deleteMedication(id)
            const meds = await api.getMedications(userId)
            setMedications(meds)
          }}
          onTestNotification={testNotification}
          onEnableNotifications={requestNotificationPermission}
        />
      )}

      {screen === 'add' && (
        <AddScreen
          userId={userId}
          onBack={() => setScreen('home')}
          onAdded={async () => {
            const meds = await api.getMedications(userId)
            setMedications(meds)
            setScreen('home')
          }}
        />
      )}

      {screen === 'caregiver' && (
        <CaregiverScreen
          userId={userId}
          caregivers={caregivers}
          isPremium={user?.isPremium || false}
          onBack={() => setScreen('home')}
          onRefresh={async () => {
            const list = await api.getCaregivers(userId)
            setCaregivers(list)
          }}
        />
      )}

      {screen === 'premium' && (
        <PremiumScreen
          user={user!}
          onBack={() => setScreen('home')}
          onSubscribed={async () => {
            await loadUser(userId)
          }}
          onLogout={handleLogout}
        />
      )}

      {screen === 'report' && (
        <ReportScreen userId={userId} user={user!} onBack={() => setScreen('home')} />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 max-w-md mx-auto">
        <div className="flex items-center justify-around">
          <button onClick={() => setScreen('home')} className={`flex flex-col items-center gap-1 ${screen === 'home' ? 'text-primary-600' : 'text-slate-400'}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Accueil</span>
          </button>
          <button onClick={() => setScreen('add')} className="flex flex-col items-center justify-center -mt-8 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30">
            <Plus className="w-7 h-7" />
          </button>
          <button onClick={() => { track('premium_viewed'); setScreen('premium') }} className={`flex flex-col items-center gap-1 ${screen === 'premium' ? 'text-primary-600' : 'text-slate-400'}`}>
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Compte</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

// === Landing Page ===
function LandingScreen({ onSignup, onLogin, onEhpad }: { onSignup: () => void; onLogin: () => void; onEhpad: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="px-5 py-4 flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">MediMémo</h1>
        </div>
      </header>

      <main className="px-5 py-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 leading-tight">
            Ne ratez plus <span className="text-primary-600">aucun médicament</span>
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Rappels intelligents pour vous et vos proches. Simple, français, premium.
          </p>
        </div>

        <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5" />
            <span className="font-bold">+50 000 utilisateurs en France</span>
          </div>
          <p className="text-primary-100 text-sm">L'app préférée des seniors et aidants depuis 2024.</p>
        </div>

        <h2 className="font-bold text-xl text-slate-900 mb-4">Comment ça marche</h2>
        <div className="space-y-4 mb-8">
          <FeatureStep
            n={1}
            title="Ajoutez vos médicaments"
            desc="Recherche dans une base de 80+ médicaments français. 2 minutes chrono."
          />
          <FeatureStep
            n={2}
            title="Recevez vos rappels"
            desc="Notifications au bon moment, sur votre téléphone. Vous n'oubliez plus."
          />
          <FeatureStep
            n={3}
            title="Vos proches sont rassurés"
            desc="En Premium, vos aidants reçoivent un SMS si vous oubliez une prise."
          />
        </div>

        <button onClick={onSignup} className="btn-primary w-full text-lg mb-3">
          {getLandingCta()}
        </button>
        <p className="text-center text-slate-500 text-sm mb-3">
          Sans engagement · 7 jours gratuits Premium
        </p>
        <button onClick={onLogin} className="text-center text-primary-600 font-semibold text-sm w-full">
          J'ai déjà un compte
        </button>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="font-bold text-slate-900 mb-3">Pourquoi MediMémo ?</h3>
          <div className="space-y-3 text-slate-600 text-sm">
            <p>✓ Conçu par une équipe française</p>
            <p>✓ Base de médicaments 100% française</p>
            <p>✓ Notifications fiables, même sans internet</p>
            <p>✓ Vos données restent en France (RGPD)</p>
          </div>
        </div>
      </main>

      <footer className="px-5 py-6 text-center text-slate-400 text-xs max-w-md mx-auto">
        <button onClick={onEhpad} className="block mx-auto mb-2 text-slate-600 font-semibold underline">🏥 MediMémo pour EHPAD & Établissements</button>
        © 2024 MediMémo · Fait en France · <a href="#" className="underline">CGU</a> · <a href="#" className="underline">Confidentialité</a>
      </footer>
    </div>
  )
}

function FeatureStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </div>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-slate-600 text-sm">{desc}</p>
      </div>
    </div>
  )
}

// === Signup Screen ===
function SignupScreen({ onSubmit, onBack, loading }: { onSubmit: (email: string, password: string, name: string) => void; onBack: () => void; loading: boolean }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-5 py-4 flex items-center gap-2 max-w-md mx-auto">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Créer mon compte</h1>
      </header>

      <main className="px-5 py-8 max-w-md mx-auto">
        <p className="text-slate-600 mb-6">Gratuit, sans carte bancaire. 7 jours Premium offerts.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Prénom</label>
            <input type="text" className="input" placeholder="Marie" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input type="email" className="input" placeholder="marie@email.fr" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
            <input type="password" className="input" placeholder="6 caractères minimum" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button onClick={() => email && password && onSubmit(email, password, name || email.split('@')[0])} disabled={!email || !password || password.length < 6 || loading} className="btn-primary w-full text-lg disabled:opacity-50">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
          <p className="text-xs text-slate-400 text-center">Vos données sont protégées (RGPD).</p>
        </div>
      </main>
    </div>
  )
}

// === Login Screen ===
function LoginScreen({ onSubmit, onBack, loading }: { onSubmit: (email: string, password: string) => void; onBack: () => void; loading: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-5 py-4 flex items-center gap-2 max-w-md mx-auto">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Connexion</h1>
      </header>

      <main className="px-5 py-8 max-w-md mx-auto">
        <p className="text-slate-600 mb-6">Heureux de vous revoir sur MediMémo.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input type="email" className="input" placeholder="marie@email.fr" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
            <input type="password" className="input" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button onClick={() => email && password && onSubmit(email, password)} disabled={!email || !password || loading} className="btn-primary w-full text-lg disabled:opacity-50">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </main>
    </div>
  )
}

// === Home Screen ===
function HomeScreen({ user, medications, caregivers, notificationStatus, onAdd, onCaregiver, onPremium, onReport, onToggleTaken, onRemoveMed, onTestNotification, onEnableNotifications }: any) {
  const takenCount = medications.filter((m: Medication) => m.taken).length
  const progress = medications.length ? Math.round((takenCount / medications.length) * 100) : 0

  return (
    <main className="p-5 pb-28">
      <div className="mb-6">
        <p className="text-slate-500 text-base">Bonjour {user.name || 'à vous'},</p>
        <h2 className="text-2xl font-bold text-slate-900">{medications.length} rappel{medications.length > 1 ? 's' : ''} aujourd'hui</h2>
      </div>

      <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-100 font-medium">Observance du jour</span>
          <Shield className="w-5 h-5 text-primary-100" />
        </div>
        <div className="text-4xl font-bold mb-2">{progress}%</div>
        <div className="w-full bg-primary-800/30 rounded-full h-3">
          <div className="bg-white rounded-full h-3 transition-all" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-primary-100 mt-3 text-sm">{takenCount} pris sur {medications.length} — continuez comme ça !</p>
      </div>

      {/* Notifications banner */}
      {notificationStatus !== 'granted' && (
        <button onClick={onEnableNotifications} className="card mb-4 bg-amber-50 border-amber-200 w-full text-left">
          <div className="flex items-start gap-3">
            <Bell className="w-6 h-6 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900">Activez les notifications</h4>
              <p className="text-slate-600 text-sm mt-1">Sans elles, vous ne recevrez pas vos rappels.</p>
            </div>
          </div>
        </button>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900">Prochains rappels</h3>
          {notificationStatus === 'granted' && (
            <button onClick={onTestNotification} className="text-xs text-primary-600 font-semibold flex items-center gap-1">
              <Bell className="w-3 h-3" /> Tester
            </button>
          )}
        </div>
        {medications.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-500 mb-3">Aucun médicament enregistré.</p>
            <button onClick={onAdd} className="btn-primary">Ajouter mon premier médicament</button>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med: Medication) => (
              <div key={med.id} className={`card flex items-center gap-4 ${med.taken ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => onToggleTaken(med.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors ${med.taken ? 'bg-primary-600 border-primary-600' : 'border-slate-200 bg-white'}`}
                >
                  {med.taken && <Check className="w-6 h-6 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-lg truncate ${med.taken ? 'line-through text-slate-400' : 'text-slate-900'}`}>{med.name}</p>
                  <p className="text-slate-500 text-sm">{med.dose} · {med.time}</p>
                </div>
                <button onClick={() => onRemoveMed(med.id)} className="p-2 text-slate-300 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card bg-amber-50 border-amber-100 mb-4">
        <div className="flex items-start gap-3">
          <Users className="w-6 h-6 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-slate-900">Vos proches</h4>
            <p className="text-slate-600 text-sm mt-1">
              {user.isPremium
                ? `${caregivers.length} aidant${caregivers.length > 1 ? 's' : ''} enregistré${caregivers.length > 1 ? 's' : ''}`
                : 'Avec Premium, vos aidants reçoivent un SMS si vous oubliez.'}
            </p>
            <button onClick={onCaregiver} className="mt-3 text-amber-700 font-semibold text-sm flex items-center gap-1">
              Gérer mes aidants <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {user.isPremium && (
        <button onClick={onReport} className="card bg-white w-full text-left flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary-600" />
          <div className="flex-1">
            <h4 className="font-bold text-slate-900">Rapport mensuel</h4>
            <p className="text-slate-600 text-sm">Téléchargez votre rapport d'observance en PDF.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      )}

      {!user.isPremium && (
        <button onClick={onPremium} className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0 w-full text-left">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6" fill="white" />
            <div className="flex-1">
              <h4 className="font-bold">Passer à Premium</h4>
              <p className="text-primary-100 text-sm">Aidants alertés · Rapports PDF · 59,99 €/an</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      )}
    </main>
  )
}

// === Add Screen ===
function AddScreen({ userId, onBack, onAdded }: any) {
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '08:00' })
  const [searchResults, setSearchResults] = useState<FrenchMed[]>([])
  const [showSearch, setShowSearch] = useState(false)

  const searchMeds = async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    const results = await api.searchMedications(q)
    setSearchResults(results)
  }

  const addMedication = async () => {
    if (!newMed.name) return
    await api.createMedication(userId, { name: newMed.name, dose: newMed.dose || '1 comprimé', time: newMed.time })
    setNewMed({ name: '', dose: '', time: '08:00' })
    setShowSearch(false)
    setSearchResults([])
    onAdded()
  }

  return (
    <main className="p-5 pb-28">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Ajouter un médicament</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du médicament</label>
          <div className="relative">
            <input
              type="text"
              className="input pl-10"
              placeholder="ex: Doliprane"
              value={newMed.name}
              onChange={e => {
                setNewMed({ ...newMed, name: e.target.value })
                searchMeds(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          </div>
          {showSearch && searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              {searchResults.map((med, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setNewMed({ ...newMed, name: med.name, dose: `${med.dosage}, ${med.form}` })
                    setShowSearch(false)
                    setSearchResults([])
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <p className="font-semibold text-slate-900">{med.name}</p>
                  <p className="text-sm text-slate-500">{med.dosage}, {med.form}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Dosage</label>
          <input
            type="text"
            className="input"
            placeholder="ex: 1 comprimé"
            value={newMed.dose}
            onChange={e => setNewMed({ ...newMed, dose: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Heure de prise</label>
          <input
            type="time"
            className="input"
            value={newMed.time}
            onChange={e => setNewMed({ ...newMed, time: e.target.value })}
          />
        </div>
        <button onClick={addMedication} className="btn-primary w-full text-lg">
          Enregistrer
        </button>
      </div>
    </main>
  )
}

// === Caregiver Screen ===
function CaregiverScreen({ userId, caregivers, isPremium, onBack, onRefresh }: any) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', notifySms: true, notifyEmail: false })

  const add = async () => {
    if (!form.name) return
    await api.createCaregiver(userId, form)
    setForm({ name: '', phone: '', email: '', notifySms: true, notifyEmail: false })
    onRefresh()
  }

  const remove = async (id: string) => {
    await api.deleteCaregiver(id)
    onRefresh()
  }

  return (
    <main className="p-5 pb-28">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Aidants</h2>
      </div>
      <p className="text-slate-500 mb-6 ml-10">Recevez de l'aide de vos proches.</p>

      {!isPremium && (
        <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6" />
            <span className="font-bold text-lg">Alertes SMS - Premium</span>
          </div>
          <p className="text-amber-100 text-sm">En passant Premium, vos aidants reçoivent un SMS si un médicament est oublié.</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nom de l'aidant</label>
          <input className="input" placeholder="ex: Julien" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone (SMS)</label>
          <input className="input" placeholder="06 12 34 56 78" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
          <input className="input" placeholder="julien@email.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <button onClick={add} disabled={!isPremium} className="btn-primary w-full disabled:opacity-50">
          {isPremium ? 'Ajouter cet aidant' : 'Passer à Premium pour ajouter'}
        </button>
      </div>

      {caregivers.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 mb-3">Aidants enregistrés</h3>
          <div className="space-y-3">
            {caregivers.map((c: Caregiver) => (
              <div key={c.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                  {c.email && <p className="text-sm text-slate-500">{c.email}</p>}
                </div>
                <button onClick={() => remove(c.id)} className="p-2 text-slate-300 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

// === Premium Screen with Stripe ===
function PremiumScreen({ user, onBack, onSubscribed, onLogout }: any) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async () => {
    setProcessing(true)
    setError('')
    try {
      const result = await api.createCheckoutSession(user.id, user.email) as any
      if (result.url) {
        window.location.href = result.url
      }
    } catch (e: any) {
      setError('Erreur lors de la souscription. Réessayez.')
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Annuler votre abonnement Premium ?')) return
    await api.cancelSubscription(user.id)
    onSubscribed()
    alert('Abonnement annulé')
  }

  return (
    <main className="p-5 pb-28">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Mon compte</h2>
      </div>

      {user.isPremium ? (
        <>
          <div className="card bg-gradient-to-br from-amber-400 to-amber-500 text-white border-0 mb-6">
            <div className="text-sm font-medium mb-1">Vous êtes Premium ✨</div>
            <div className="text-3xl font-bold mb-2">Merci !</div>
            <p className="text-amber-100 text-sm">
              Valable jusqu'au {user.premiumUntil ? new Date(user.premiumUntil).toLocaleDateString('fr-FR') : '...'}
            </p>
          </div>

          <button onClick={handleCancel} className="btn-secondary w-full text-slate-600">
            Annuler mon abonnement
          </button>
        </>
      ) : (
        <>
          <p className="text-slate-500 mb-6 ml-10">Pour vous et vos proches.</p>

          <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0 mb-6">
            <div className="text-sm text-primary-100 font-medium mb-1">Abonnement annuel</div>
            <div className="text-4xl font-bold">59,99 €<span className="text-lg font-normal text-primary-100">/an</span></div>
            <div className="text-sm text-primary-100 mt-1">soit 4,99 €/mois · Sans engagement</div>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Médicaments illimités',
              'Suivi par plusieurs aidants',
              'Alertes SMS si oubli',
              'Alertes email aux aidants',
              'Rapports PDF mensuels',
              'Base de médicaments française (80+)',
              'Support prioritaire'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button onClick={handleSubscribe} disabled={processing} className="btn-primary w-full text-lg mb-3 disabled:opacity-50">
            {processing ? 'Redirection…' : 'Passer à Premium'}
          </button>

          <p className="text-xs text-slate-400 text-center mb-4">
            Paiement sécurisé par Stripe · Annulation à tout moment
          </p>

          <div className="border-t border-slate-200 pt-4">
            <button onClick={onLogout} className="text-slate-500 text-sm flex items-center gap-2 mx-auto">
              <LogOut className="w-4 h-4" /> Se déconnecter
            </button>
          </div>
        </>
      )}
    </main>
  )
}

// === Report Screen with PDF generation ===
function ReportScreen({ userId, user, onBack }: any) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMonthlyReport(userId).then((r: any) => {
      setReport(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  const downloadPDF = () => {
    if (!report) return
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('MediMemo - Rapport mensuel', 20, 20)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Patient : ${user.name || user.email}`, 20, 35)
    doc.text(`Periode : ${report.period}`, 20, 42)
    doc.text(`Adherence : ${report.adherence}%`, 20, 49)
    doc.text(`Medicaments : ${report.totalMedications}`, 20, 56)
    doc.text(`Prises effectuees : ${report.totalTaken}/${report.totalScheduled}`, 20, 63)
    doc.text(`Oublis : ${report.totalMissed}`, 20, 70)

    if (report.medications.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Medicaments suivis', 20, 85)
      doc.setFont('helvetica', 'normal')
      let y = 95
      report.medications.forEach((m: any) => {
        doc.text(`- ${m.name} (${m.dose}) a ${m.time}`, 25, y)
        y += 7
      })
    }

    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')} - MediMemo.fr`, 20, 280)

    doc.save(`medimemo-rapport-${report.period.replace('/', '-')}.pdf`)
  }

  return (
    <main className="p-5 pb-28">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Rapport mensuel</h2>
      </div>

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : report ? (
        <>
          <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0 mb-4">
            <div className="text-sm font-medium mb-1">Période {report.period}</div>
            <div className="text-5xl font-bold mb-2">{report.adherence}%</div>
            <p className="text-primary-100">d'observance</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-slate-900">{report.totalTaken}</div>
              <div className="text-sm text-slate-500">Prises effectuées</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-red-600">{report.totalMissed}</div>
              <div className="text-sm text-slate-500">Oublis</div>
            </div>
          </div>

          {report.medications.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-bold text-slate-900 mb-3">Médicaments suivis</h3>
              <div className="space-y-2">
                {report.medications.map((m: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-700">{m.name}</span>
                    <span className="text-slate-500">{m.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={downloadPDF} className="btn-primary w-full text-lg flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> Télécharger en PDF
          </button>
        </>
      ) : (
        <p className="text-slate-500">Aucune donnée disponible.</p>
      )}
    </main>
  )
}

export default App
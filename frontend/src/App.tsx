import { useState, useEffect } from 'react'
import { Home, Plus, User, ChevronRight, Shield, Heart, Smartphone, Search, Trash2, Users, Check, ChevronLeft } from 'lucide-react'
import * as api from './api'

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

const USER_EMAIL = 'demo@medimemo.fr'
const USER_NAME = 'Marie'

function App() {
  const [screen, setScreen] = useState<'home' | 'add' | 'premium' | 'caregiver'>('home')
  const [userId, setUserId] = useState<string | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(true)
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '08:00' })
  const [searchResults, setSearchResults] = useState<FrenchMed[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Init user
  useEffect(() => {
    const init = async () => {
      try {
        let stored = localStorage.getItem('medimemo_userId')
        if (!stored) {
          const user = await api.createUser(USER_EMAIL, USER_NAME)
          stored = user.id
        }
        const uid = stored as string
        localStorage.setItem('medimemo_userId', uid)
        setUserId(uid)
        const user = await api.getUser(uid)
        setMedications(user.medications || [])
        setCaregivers(user.caregivers || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const refreshMedications = async () => {
    if (!userId) return
    const meds = await api.getMedications(userId)
    setMedications(meds)
  }

  const refreshCaregivers = async () => {
    if (!userId) return
    const list = await api.getCaregivers(userId)
    setCaregivers(list)
  }

  const toggleTaken = async (id: string) => {
    await api.toggleMedicationTaken(id)
    refreshMedications()
  }

  const addMedication = async () => {
    if (!newMed.name || !userId) return
    await api.createMedication(userId, { name: newMed.name, dose: newMed.dose || '1 comprimé', time: newMed.time })
    setNewMed({ name: '', dose: '', time: '08:00' })
    setShowSearch(false)
    setSearchResults([])
    await refreshMedications()
    setScreen('home')
  }

  const removeMedication = async (id: string) => {
    await api.deleteMedication(id)
    refreshMedications()
  }

  const searchMeds = async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    const results = await api.searchMedications(q)
    setSearchResults(results)
  }

  const selectMed = (med: FrenchMed) => {
    setNewMed({ ...newMed, name: med.name, dose: `${med.dosage}, ${med.form}` })
    setShowSearch(false)
    setSearchResults([])
  }

  const takenCount = medications.filter(m => m.taken).length
  const progress = medications.length ? Math.round((takenCount / medications.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-primary-600 font-semibold">Chargement de MediMémo…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-2xl relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MediMémo</h1>
          </div>
          <button onClick={() => setScreen('premium')} className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
            Premium
          </button>
        </div>
      </header>

      {/* Home Screen */}
      {screen === 'home' && (
        <main className="p-5 pb-28">
          <div className="mb-6">
            <p className="text-slate-500 text-base">Bonjour {USER_NAME},</p>
            <h2 className="text-2xl font-bold text-slate-900">{medications.length} rappel{medications.length > 1 ? 's' : ''} aujourd'hui</h2>
          </div>

          {/* Progress card */}
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

          {/* Today's medications */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Prochains rappels</h3>
            {medications.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-slate-500 mb-3">Aucun médicament enregistré.</p>
                <button onClick={() => setScreen('add')} className="btn-primary">Ajouter mon premier médicament</button>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map(med => (
                  <div key={med.id} className={`card flex items-center gap-4 ${med.taken ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => toggleTaken(med.id)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors ${med.taken ? 'bg-primary-600 border-primary-600' : 'border-slate-200 bg-white'}`}
                    >
                      {med.taken && <Check className="w-6 h-6 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-lg truncate ${med.taken ? 'line-through text-slate-400' : 'text-slate-900'}`}>{med.name}</p>
                      <p className="text-slate-500 text-sm">{med.dose} · {med.time}</p>
                    </div>
                    <button onClick={() => removeMedication(med.id)} className="p-2 text-slate-300 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caregiver teaser */}
          <div className="card bg-amber-50 border-amber-100">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900">Votre proche est-il accompagné ?</h4>
                <p className="text-slate-600 text-sm mt-1">Avec Premium, un aidant reçoit un SMS si un médicament est oublié.</p>
                <button onClick={() => setScreen('caregiver')} className="mt-3 text-amber-700 font-semibold text-sm flex items-center gap-1">
                  Ajouter un aidant <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Add Screen */}
      {screen === 'add' && (
        <main className="p-5 pb-28">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setScreen('home')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
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
                      onClick={() => selectMed(med)}
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
      )}

      {/* Caregiver Screen */}
      {screen === 'caregiver' && (
        <CaregiverScreen
          userId={userId!}
          caregivers={caregivers}
          onBack={() => setScreen('home')}
          onRefresh={refreshCaregivers}
        />
      )}

      {/* Premium Screen */}
      {screen === 'premium' && (
        <main className="p-5 pb-28">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setScreen('home')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">MediMémo Premium</h2>
          </div>
          <p className="text-slate-500 mb-6 ml-10">Pour vous et vos proches.</p>

          <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0 mb-6">
            <div className="text-sm text-primary-100 font-medium mb-1">Abonnement annuel</div>
            <div className="text-4xl font-bold">59,99 €<span className="text-lg font-normal text-primary-100">/an</span></div>
            <div className="text-sm text-primary-100 mt-1">soit 4,99 €/mois</div>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Médicaments illimités',
              'Suivi par plusieurs aidants',
              'Alertes SMS si oubli',
              'Rapports PDF mensuels',
              'Base de médicaments française',
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

          <button className="btn-primary w-full text-lg mb-3">
            Passer à Premium
          </button>
          <button onClick={() => setScreen('home')} className="btn-secondary w-full text-lg">
            Retour
          </button>
        </main>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 max-w-md mx-auto">
        <div className="flex items-center justify-around">
          <button onClick={() => setScreen('home')} className={`flex flex-col items-center gap-1 ${screen === 'home' ? 'text-primary-600' : 'text-slate-400'}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Accueil</span>
          </button>
          <button onClick={() => setScreen('add')} className="flex flex-col items-center justify-center -mt-8 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30">
            <Plus className="w-7 h-7" />
          </button>
          <button onClick={() => setScreen('premium')} className={`flex flex-col items-center gap-1 ${screen === 'premium' ? 'text-primary-600' : 'text-slate-400'}`}>
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Premium</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

function CaregiverScreen({ userId, caregivers, onBack, onRefresh }: { userId: string; caregivers: Caregiver[]; onBack: () => void; onRefresh: () => void }) {
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

      <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-6 h-6" />
          <span className="font-bold text-lg">Alerte Premium</span>
        </div>
        <p className="text-amber-100 text-sm">En passant Premium, vos aidants reçoivent un SMS si un médicament est oublié.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nom de l'aidant</label>
          <input className="input" placeholder="ex: Julien" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone</label>
          <input className="input" placeholder="06 12 34 56 78" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
          <input className="input" placeholder="julien@email.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <button onClick={add} className="btn-primary w-full">Ajouter cet aidant</button>
      </div>

      {caregivers.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 mb-3">Aidants enregistrés</h3>
          <div className="space-y-3">
            {caregivers.map(c => (
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

export default App

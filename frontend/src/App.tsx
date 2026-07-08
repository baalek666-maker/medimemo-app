import { useState } from 'react'
import { Home, Plus, Bell, User, ChevronRight, Shield, Heart, Smartphone } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dose: string
  time: string
  taken: boolean
}

function App() {
  const [screen, setScreen] = useState<'home' | 'add' | 'premium'>('home')
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: 'Doliprane', dose: '1 comprimé', time: '08:00', taken: false },
    { id: '2', name: 'Levothyrox', dose: '1 comprimé', time: '07:00', taken: true },
  ])
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '08:00' })

  const toggleTaken = (id: string) => {
    setMedications(meds => meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m))
  }

  const addMedication = () => {
    if (!newMed.name) return
    setMedications([...medications, {
      id: Date.now().toString(),
      name: newMed.name,
      dose: newMed.dose || '1 comprimé',
      time: newMed.time,
      taken: false
    }])
    setNewMed({ name: '', dose: '', time: '08:00' })
    setScreen('home')
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-4">
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
          {/* Hero greeting */}
          <div className="mb-6">
            <p className="text-slate-500 text-base">Bonjour,</p>
            <h2 className="text-2xl font-bold text-slate-900">Aujourd'hui, 2 rappels</h2>
          </div>

          {/* Progress card */}
          <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-primary-100 font-medium">Observance du jour</span>
              <Shield className="w-5 h-5 text-primary-100" />
            </div>
            <div className="text-4xl font-bold mb-2">50%</div>
            <div className="w-full bg-primary-800/30 rounded-full h-3">
              <div className="bg-white rounded-full h-3 w-1/2"></div>
            </div>
            <p className="text-primary-100 mt-3 text-sm">1 pris sur 2 — continuez comme ça !</p>
          </div>

          {/* Today's medications */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Prochains rappels</h3>
            <div className="space-y-3">
              {medications.map(med => (
                <div key={med.id} className={`card flex items-center gap-4 ${med.taken ? 'opacity-60' : ''}`}>
                  <button
                    onClick={() => toggleTaken(med.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${med.taken ? 'bg-primary-600 border-primary-600' : 'border-slate-200 bg-white'}`}
                  >
                    {med.taken && <span className="text-white text-xl">✓</span>}
                  </button>
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${med.taken ? 'line-through text-slate-400' : 'text-slate-900'}`}>{med.name}</p>
                    <p className="text-slate-500">{med.dose} · {med.time}</p>
                  </div>
                  <Bell className={`w-5 h-5 ${med.taken ? 'text-slate-300' : 'text-primary-600'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Premium teaser */}
          <div className="card bg-amber-50 border-amber-100">
            <div className="flex items-start gap-3">
              <Smartphone className="w-6 h-6 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900">Votre proche est-il accompagné ?</h4>
                <p className="text-slate-600 text-sm mt-1">Avec Premium, un aidant reçoit un SMS si un médicament est oublié.</p>
                <button onClick={() => setScreen('premium')} className="mt-3 text-amber-700 font-semibold text-sm flex items-center gap-1">
                  Découvrir <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Add Screen */}
      {screen === 'add' && (
        <main className="p-5 pb-28">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Ajouter un médicament</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du médicament</label>
              <input
                type="text"
                className="input"
                placeholder="ex: Doliprane"
                value={newMed.name}
                onChange={e => setNewMed({ ...newMed, name: e.target.value })}
              />
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

      {/* Premium Screen */}
      {screen === 'premium' && (
        <main className="p-5 pb-28">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">MediMémo Premium</h2>
          <p className="text-slate-500 mb-6">Pour vous et vos proches.</p>

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
                  <span className="text-green-600 text-sm">✓</span>
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

export default App

import { useEffect, useState } from 'react'
import * as api from './api'
import { track } from './analytics'

// === B2B EHPAD Landing ===
export function EhpadLanding({ onBack, onDemo }: { onBack: () => void; onDemo: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm mb-8 flex items-center gap-1">
            ← Retour à MediMémo
          </button>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-emerald-500/20 text-emerald-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                Pour EHPAD & Établissements de santé
              </span>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Pilule observance de vos résidents
              </h1>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                MediMémo EHPAD centralise le suivi des prises médicamenteuses de tous vos résidents.
                Alertes temps réel, taux d'observance, rapports d'inspection — tout sur un seul écran.
              </p>
              <button
                onClick={() => { track('ehpad_demo_clicked'); onDemo() }}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors mr-3"
              >
                Voir la démo →
              </button>
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-slate-300 hover:text-white font-semibold text-lg px-6 py-4"
              >
                Demander un devis
              </button>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-700 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-slate-400">Taux d'observance moyen</p>
                    <p className="text-3xl font-bold text-emerald-400">92%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Alertes aujourd'hui</p>
                    <p className="text-3xl font-bold text-amber-400">3</p>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-2">Résidents suivis</p>
                  <p className="text-2xl font-bold">87 résidents · 12 étages</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl">✅</p>
                    <p className="text-xs text-slate-400 mt-1">À l'heure</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl">⏰</p>
                    <p className="text-xs text-slate-400 mt-1">En attente</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3 text-center">
                    <p className="text-2xl">⚠️</p>
                    <p className="text-xs text-slate-400 mt-1">Manquée</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Tout ce dont votre établissement a besoin</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🏥', title: 'Dashboard global', desc: "Vue d'ensemble de tous les résidents, par étage, par service. Taux d'observance en temps réel." },
            { icon: '🔔', title: 'Alertes instantanées', desc: 'Notification immédiate au personnel soignant en cas de prise manquée. SMS, push, email.' },
            { icon: '📊', title: 'Rapports ARS / HAS', desc: "Génération automatique des rapports d'observance pour les inspections et audits." },
            { icon: '💊', title: 'Plan de prise', desc: 'Gestion centralisée des prescriptions. Mise à jour en temps réel par le pharmacien.' },
            { icon: '👥', title: 'Multi-utilisateurs', desc: 'Comptes pour soignants, infirmiers, médecins-coordonnateurs. Rôles et permissions.' },
            { icon: '🔐', title: 'Conforme RGPD', desc: "Hébergement de données de santé. Chiffrement bout-en-bout. Logs d'audit complets." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Tarification EHPAD</h2>
          <p className="text-slate-600 mb-12">Tarif dégressif selon le nombre de résidents</p>
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100">
            <div className="text-5xl font-bold text-slate-900 mb-2">
              3€<span className="text-2xl text-slate-400">/résident/mois</span>
            </div>
            <p className="text-slate-500 mb-8">Minimum 50 résidents · Facturation annuelle</p>
            <ul className="text-left space-y-3 mb-8 max-w-md mx-auto">
              {[
                'Tableau de bord temps réel',
                'Alertes SMS illimitées',
                'Rapports ARS / HAS automatiques',
                'Multi-utilisateurs illimités',
                'Support dédié 7j/7',
                'Formation du personnel incluse',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700">
                  <span className="text-emerald-500 text-xl">✓</span> {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg py-4 rounded-xl transition-colors"
            >
              Planifier une démo
            </button>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div id="contact" className="bg-slate-900 text-white py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Parlons de votre établissement</h2>
          <p className="text-slate-400 mb-8">Réponse sous 24h · Démo personnalisée gratuite</p>
          <a href="mailto:ehpad@medimemo.fr" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors">
            ehpad@medimemo.fr
          </a>
        </div>
      </div>
    </div>
  )
}

// === B2B EHPAD Dashboard (demo preview) ===
export function EhpadDashboard({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [residentDetail, setResidentDetail] = useState<any>(null)

  useEffect(() => {
    api.getEhpadDashboard().then((d: any) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const loadResident = async (id: string) => {
    setSelected(id)
    const detail = await api.getResidentDetail(id)
    setResidentDetail(detail)
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Chargement...</div>

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-900">←</button>
          <h1 className="text-lg font-bold text-slate-900">EHPAD Les Glycines — Dashboard</h1>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">B2B DEMO</span>
      </div>

      {/* Summary cards */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Résidents suivis</p>
            <p className="text-2xl font-bold text-slate-900">{data.summary.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Observance moyenne</p>
            <p className={`text-2xl font-bold ${data.summary.avgAdherence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{data.summary.avgAdherence}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Prises manquées</p>
            <p className={`text-2xl font-bold ${data.summary.missedToday === 0 ? 'text-emerald-600' : 'text-red-500'}`}>{data.summary.missedToday}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Alertes critiques</p>
            <p className={`text-2xl font-bold ${data.summary.criticalAlerts === 0 ? 'text-emerald-600' : 'text-red-500'}`}>{data.summary.criticalAlerts}</p>
          </div>
        </div>

        {/* Resident list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chambre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Résident</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Médicaments</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Observance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Dernière prise</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.residents.map((r: any) => (
                <tr key={r.id} onClick={() => loadResident(r.id)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-700">{r.room}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.medications}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.adherence >= 90 ? 'bg-emerald-500' : r.adherence >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.adherence}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{r.adherence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.lastDose || '—'}</td>
                  <td className="px-4 py-3">
                    {r.missedToday === 0 ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">✅ OK</span>
                    ) : (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium">⚠️ {r.missedToday} manquée(s)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resident detail modal */}
      {selected && residentDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Ch. {residentDetail.room} — {residentDetail.name}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>
            <div className="space-y-3">
              {residentDetail.medicationsList?.map((m: any, i: number) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-500">{m.dosage}</p>
                    </div>
                    <span className="text-xs text-slate-400">{m.schedule.join(', ')}</span>
                  </div>
                  <div className="flex gap-2">
                    {m.takenToday.map((taken: boolean, j: number) => (
                      <span key={j} className={`text-xs px-2 py-1 rounded font-medium ${taken ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {taken ? '✅ Pris' : '⏳ En attente'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

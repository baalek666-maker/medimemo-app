import { useState } from 'react'
import { ChevronLeft, Download, Trash2, Shield, FileText, ChevronRight, AlertTriangle } from 'lucide-react'
import * as api from './api'
import { track } from './analytics'

interface SettingsProps {
  user: any
  onBack: () => void
  onLogout: () => void
  onAccountDeleted: () => void
}

export default function Settings({ user, onBack, onLogout, onAccountDeleted }: SettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [privacy, setPrivacy] = useState<any>(null)

  const handleExport = async () => {
    setExporting(true)
    track('gdpr_export_clicked')
    try {
      const blob = await api.exportUserData(user.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `medimemo-donnees-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      track('gdpr_export_success')
    } catch (e) {
      alert('Erreur lors de l export de vos donnees.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    track('gdpr_delete_confirmed')
    try {
      await api.deleteUserData(user.id)
      track('gdpr_delete_success')
      localStorage.removeItem('medimemo_token')
      localStorage.removeItem('medimemo_userId')
      onAccountDeleted()
    } catch (e) {
      alert('Erreur lors de la suppression.')
      setDeleting(false)
    }
  }

  const handleShowPrivacy = async () => {
    if (!privacy) {
      try {
        const data = await api.getPrivacyPolicy()
        setPrivacy(data.policy)
      } catch (e) {
        // ignore
      }
    }
    setShowPrivacy(!showPrivacy)
  }

  return (
    <main className="p-5 pb-28 min-h-screen bg-slate-50">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Reglages</h2>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-slate-900">{user.email}</div>
            <div className="text-sm text-slate-500">
              {user.isPremium ? 'Membre Premium' : 'Compte gratuit'}
            </div>
          </div>
        </div>
      </div>

      {/* RGPD Section */}
      <div className="mb-2 px-1">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <Shield size={14} /> Vos donnees (RGPD)
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
        {/* Export data */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 disabled:opacity-50"
        >
          <Download size={20} className="text-blue-600" />
          <div className="flex-1 text-left">
            <div className="font-medium text-slate-900 text-sm">Exporter mes donnees</div>
            <div className="text-xs text-slate-500">Telechargez toutes vos donnees (JSON)</div>
          </div>
          {exporting ? (
            <span className="text-xs text-slate-400">En cours...</span>
          ) : (
            <ChevronRight size={18} className="text-slate-300" />
          )}
        </button>

        {/* Privacy policy */}
        <button
          onClick={handleShowPrivacy}
          className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
          <FileText size={20} className="text-slate-600" />
          <div className="flex-1 text-left">
            <div className="font-medium text-slate-900 text-sm">Politique de confidentialite</div>
            <div className="text-xs text-slate-500">Voir comment nous protegeons vos donnees</div>
          </div>
          <ChevronRight size={18} className={`text-slate-300 transition-transform ${showPrivacy ? 'rotate-90' : ''}`} />
        </button>

        {/* Delete data */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={20} className="text-red-500" />
          <div className="flex-1 text-left">
            <div className="font-medium text-red-600 text-sm">Supprimer mon compte</div>
            <div className="text-xs text-slate-500">Effacement definitif de toutes vos donnees</div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>

      {/* Privacy policy expandable */}
      {showPrivacy && privacy && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <h4 className="font-bold text-slate-900 mb-3">Politique de confidentialite</h4>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <div className="font-medium text-slate-900 mb-1">Finalite</div>
              <p>{privacy.purpose}</p>
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1">Base legale</div>
              <p>{privacy.legalBasis}</p>
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1">Donnees collectees</div>
              <ul className="list-disc list-inside space-y-1">
                {privacy.dataCollected?.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1">Conservation</div>
              <p>{privacy.retention}</p>
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1">Vos droits</div>
              <ul className="list-disc list-inside space-y-1">
                {privacy.rights?.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1">Contact RGPD</div>
              <p>{privacy.contact}</p>
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1">Reclamation CNIL</div>
              <p>{privacy.cnil}</p>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
        <div className="text-center text-xs text-slate-400">
          <div className="font-medium text-slate-600 mb-1">MediMemo v1.0</div>
          <div>Pense pour les seniors et leurs aidants</div>
          <div className="mt-1">Fait avec soin en France</div>
        </div>
      </div>

      <button onClick={onLogout} className="text-slate-400 text-sm w-full text-center py-2">
        Se deconnecter
      </button>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Supprimer definitivement ?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Cette action est <strong>irreversible</strong>. Toutes vos donnees seront effacees :
            </p>
            <ul className="text-sm text-slate-500 space-y-1 mb-5 list-disc list-inside">
              <li>Vos medicaments et historique de prises</li>
              <li>Vos aidants et leurs coordonnees</li>
              <li>Vos badges et points de fidelite</li>
              <li>Votre compte et votre email</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-medium text-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer tout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

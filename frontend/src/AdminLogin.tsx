import { useState } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export function AdminLogin({ onAuth }: { onAuth: (token: string) => void }) {
  const [token, setToken] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (token.trim()) {
      onAuth(token.trim())
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MediMemo Admin</h1>
          <p className="text-slate-400 text-sm mt-2">Acces reserve</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token administrateur</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={show ? 'text' : 'password'}
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(false) }}
                placeholder="Collez votre token admin"
                className="w-full pl-10 pr-10 py-3 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-primary-500 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">Token requis</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Se connecter
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Zone restreinte. Acces autorise uniquement avec un token valide.
        </p>
      </div>
    </div>
  )
}

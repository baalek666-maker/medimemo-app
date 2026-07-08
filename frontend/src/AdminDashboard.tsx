import { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, Mail, Activity, Crown, ChevronLeft, ChevronRight, LogOut, Pill, Heart } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function AdminDashboard({ adminToken, onLogout }: { adminToken: string; onLogout: () => void }) {
  const [metrics, setMetrics] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'users' | 'revenue'>('overview')

  useEffect(() => {
    loadMetrics()
    loadRevenue()
  }, [])

  useEffect(() => {
    if (tab === 'users') loadUsers(page)
  }, [tab, page])

  async function loadMetrics() {
    try {
      const res = await fetch(`${API_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      setMetrics(await res.json())
    } catch { /* */ } finally { setLoading(false) }
  }

  async function loadUsers(p: number) {
    try {
      const res = await fetch(`${API_URL}/api/admin/users?page=${p}&limit=50`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch { /* */ }
  }

  async function loadRevenue() {
    try {
      const res = await fetch(`${API_URL}/api/admin/revenue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      setRevenue(await res.json())
    } catch { /* */ }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-400">Chargement...</p></div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">MediMemo Admin</h1>
            <p className="text-xs text-slate-400">Dashboard de gestion</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-sm text-slate-400 hover:text-red-500 flex items-center gap-1">
          <LogOut className="w-4 h-4" /> Quitter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {(['overview', 'users', 'revenue'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {t === 'overview' ? 'Vue d ensemble' : t === 'users' ? 'Utilisateurs' : 'Revenus'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={<Users className="w-5 h-5" />} label="Utilisateurs" value={metrics.users.total} sub={`${metrics.users.recentSignups} cette semaine`} color="blue" />
              <KpiCard icon={<Crown className="w-5 h-5" />} label="Premium" value={metrics.users.premium} sub={`Conversion ${metrics.revenue.conversionRate}`} color="amber" />
              <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Revenus annuels" value={`${metrics.revenue.estimatedMonthly.toFixed(0)} EUR`} sub={`${metrics.revenue.pricePerYear} EUR/user/an`} color="green" />
              <KpiCard icon={<Mail className="w-5 h-5" />} label="Emails envoyes" value={metrics.emails.sent} sub={`${metrics.emails.pending} en attente`} color="purple" />
            </div>

            {/* Content stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard icon={<Pill className="w-5 h-5" />} label="Medicaments suivis" value={metrics.content.medications} />
              <InfoCard icon={<Heart className="w-5 h-5" />} label="Aidants connectes" value={metrics.content.caregivers} />
              <InfoCard icon={<TrendingUp className="w-5 h-5" />} label="Croissance hebdo" value={`${metrics.users.recentSignups} nouveaux`} />
            </div>

            {/* Revenue breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Repartition utilisateurs</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Gratuit</span>
                  <span className="text-sm font-semibold text-slate-900">{metrics.users.free}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${metrics.users.total > 0 ? (metrics.users.free / metrics.users.total) * 100 : 0}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Premium</span>
                  <span className="text-sm font-semibold text-amber-600">{metrics.users.premium}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${metrics.users.total > 0 ? (metrics.users.premium / metrics.users.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Inscrit le</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Plan</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Meds</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Aidants</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-slate-900">{u.name || u.email}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      {u.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium"><Crown className="w-3 h-3" /> Premium</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">Gratuit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{u._count?.medications || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{u._count?.caregivers || 0}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{u.streakDays || 0}j</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 text-sm text-slate-500 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Precedent
              </button>
              <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 text-sm text-slate-500 disabled:opacity-30"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {tab === 'revenue' && revenue && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Revenu total" value={`${revenue.totalRevenue.toFixed(0)} EUR`} color="green" />
              <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="ARPU" value={`${revenue.avgRevenuePerUser} EUR`} color="blue" />
              <KpiCard icon={<Users className="w-5 h-5" />} label="Conversions" value={revenue.monthly.reduce((s: number, m: any) => s + m.premium, 0)} color="amber" />
            </div>

            {/* Monthly chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Croissance mensuelle</h3>
              {revenue.monthly.length === 0 ? (
                <p className="text-slate-400 text-sm">Pas encore de donnees</p>
              ) : (
                <div className="space-y-2">
                  {revenue.monthly.map((m: any) => (
                    <div key={m.month} className="flex items-center gap-4">
                      <span className="text-sm text-slate-500 w-20">{m.month}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                        <div className="bg-primary-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(m.signups * 10, 5)}%` }}>
                          <span className="text-xs text-white font-medium">{m.signups}</span>
                        </div>
                      </div>
                      <span className="text-xs text-amber-600 font-medium w-16 text-right">{m.premium} premium</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-slate-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function InfoCard({ icon, label, value }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">{icon}</div>
      <div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  )
}

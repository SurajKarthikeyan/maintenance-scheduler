import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { alertsApi } from '../api/alerts'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'

export default function Alerts() {
  const [filter, setFilter] = useState('active')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', filter],
    queryFn: () => alertsApi.getAll(filter === 'active' ? { resolved: false } : filter === 'resolved' ? { resolved: true } : {}),
    refetchInterval: 60000,
  })

  const resolve = useMutation({
    mutationFn: alertsApi.resolve,
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })

  const triggerCheck = useMutation({
    mutationFn: alertsApi.triggerCheck,
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })

  const alerts = data?.data?.data || []

  return (
    <div className="p-8">
      <PageHeader
        title="Alerts"
        subtitle="Automated overdue and maintenance alerts"
        action={
          <button onClick={() => triggerCheck.mutate()}
            disabled={triggerCheck.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={triggerCheck.isPending ? 'animate-spin' : ''} />
            {triggerCheck.isPending ? 'Checking...' : 'Run Check Now'}
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        {[
          { key: 'active',   label: 'Active' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'all',      label: 'All' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 border border-gray-800 hover:border-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No alerts</p>
          <p className="text-sm text-gray-600 mt-1">All machines are within their maintenance schedule</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.alert_id}
              className={`bg-gray-900 border rounded-xl p-5 flex items-start justify-between transition-all ${
                alert.resolved ? 'border-gray-800 opacity-60' :
                alert.alert_type === 'Critical' ? 'border-red-500/20' :
                alert.alert_type === 'Overdue' ? 'border-orange-500/20' : 'border-yellow-500/20'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 p-2 rounded-lg ${
                  alert.alert_type === 'Critical' ? 'bg-red-500/10' :
                  alert.alert_type === 'Overdue' ? 'bg-orange-500/10' : 'bg-yellow-500/10'
                }`}>
                  <AlertTriangle size={16} className={
                    alert.alert_type === 'Critical' ? 'text-red-400' :
                    alert.alert_type === 'Overdue' ? 'text-orange-400' : 'text-yellow-400'
                  } />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{alert.machine_name}</p>
                    <StatusBadge status={alert.alert_type} />
                  </div>
                  <p className="text-sm text-gray-400">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Raised: {new Date(alert.created_at).toLocaleString()}
                    {alert.resolved_at && ` · Resolved: ${new Date(alert.resolved_at).toLocaleString()}`}
                  </p>
                </div>
              </div>

              {!alert.resolved && (
                <button onClick={() => resolve.mutate(alert.alert_id)}
                  disabled={resolve.isPending}
                  className="ml-4 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/10 transition-colors disabled:opacity-50 whitespace-nowrap">
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
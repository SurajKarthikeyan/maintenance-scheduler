const STATUS_STYLES = {
  'Operational':       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Needs Maintenance': 'bg-amber-500/10  text-amber-400  border border-amber-500/20',
  'Under Maintenance': 'bg-blue-500/10   text-blue-400   border border-blue-500/20',
  'Scheduled':         'bg-blue-500/10   text-blue-400   border border-blue-500/20',
  'Pending':           'bg-amber-500/10  text-amber-400  border border-amber-500/20',
  'In Progress':       'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'Completed':         'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Critical':          'bg-red-500/10    text-red-400    border border-red-500/20',
  'Overdue':           'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'Due Soon':          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}
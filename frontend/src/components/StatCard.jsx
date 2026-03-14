// eslint-disable-next-line no-unused-vars
export default function StatCard({ label, value, icon: Icon, color = 'cyan', sub }) {
  const colors = {
    cyan:    'text-cyan-400    bg-cyan-500/10',
    red:     'text-red-400     bg-red-500/10',
    amber:   'text-amber-400   bg-amber-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple:  'text-purple-400  bg-purple-500/10',
  }
  const [text, bg] = (colors[color] || colors.cyan).split(' ')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4">
      <div className={`${bg} p-2.5 rounded-lg`}>
        <Icon size={20} className={text} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
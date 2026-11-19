import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw } from 'lucide-react'
import { PageHead } from './Dashboard'
import { SeverityTag } from '../components/ui'
import { useWorkspace } from '../workspace'

const FILTERS = [
  ['all', 'All'],
  ['critical', 'Critical'],
  ['warning', 'Warning'],
  ['suggestion', 'Suggestion'],
]

export default function Findings() {
  const ws = useWorkspace()
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const rows = ws.findings.filter((x) => filter === 'all' || x.sev === filter)
  const openCount = ws.findings.filter((x) => !x.resolved).length

  async function toggleResolved(finding) {
    setBusyId(finding.id)
    setError('')
    try {
      await ws.resolveFinding(finding.id, !finding.resolved)
    } catch (e) {
      setError(e.message || 'Could not update this finding. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHead title="Findings" sub={`${openCount} open across all repositories`}>
        <div role="group" aria-label="Filter by severity" className="inline-flex rounded-md border border-line bg-sheet p-0.5 text-[14px] font-semibold">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`rounded px-3 py-1.5 transition-colors ${filter === key ? 'bg-ink text-paper' : 'text-soft hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
      </PageHead>

      {error && <p role="alert" className="mb-4 rounded-md border border-pen/30 bg-pen/5 p-3 text-[13.5px] text-pen">{error}</p>}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-line bg-sheet p-8 text-center text-soft">No findings with this severity. Try another filter.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-sheet">
          {rows.map((finding) => {
            const done = Boolean(finding.resolved)
            const busy = busyId === finding.id
            return (
              <li key={finding.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className={`min-w-0 flex-1 ${done ? 'opacity-60' : ''}`}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <SeverityTag sev={finding.sev} />
                    <span className="text-[13px] text-soft">{finding.cat}</span>
                    {done && <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-semibold text-leaf">Resolved</span>}
                  </div>
                  <p className={`max-w-[70ch] text-[15px] leading-snug ${done ? 'line-through' : ''}`}>{ws.settings.lang === 'ta' && finding.ta ? finding.ta : finding.msg}</p>
                  {finding.fix && <p className="mt-2 max-w-[75ch] rounded-md bg-paper px-3 py-2 text-[13px] leading-relaxed text-soft"><strong className="text-ink">Suggested fix:</strong> {finding.fix}</p>}
                  <p className="mt-1.5 font-mono text-[12.5px] text-soft">
                    {finding.file}:{finding.line} ·{' '}
                    <Link to={`${ws.base}/pulls/${finding.pr}`} className="underline underline-offset-2 hover:text-ink">
                      {finding.repo} #{finding.number ?? finding.pr}
                    </Link>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleResolved(finding)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13.5px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${done ? 'border-leaf bg-leaf/10 text-leaf' : 'border-line hover:border-ink'}`}
                >
                  {done ? <RotateCcw size={14} /> : <Check size={15} strokeWidth={3} />}
                  {busy ? 'Saving…' : done ? 'Reopen' : 'Mark resolved'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

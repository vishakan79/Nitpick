import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
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
  const seed = ws.findings
  const [f, setF] = useState('all')
  const [resolved, setResolved] = useState({})
  const rows = seed.filter((x) => f === 'all' || x.sev === f)
  const openCount = seed.filter((x) => !resolved[x.id]).length

  return (
    <div>
      <PageHead title="Findings" sub={`${openCount} open across all repositories`}>
        <div role="group" aria-label="Filter by severity" className="inline-flex rounded-md border border-line bg-sheet p-0.5 text-[14px] font-semibold">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)} className={`rounded px-3 py-1.5 transition-colors ${f === k ? 'bg-ink text-paper' : 'text-soft hover:text-ink'}`}>
              {l}
            </button>
          ))}
        </div>
      </PageHead>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-line bg-sheet p-8 text-center text-soft">No findings with this severity. Try another filter.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-sheet">
          {rows.map((x) => {
            const done = resolved[x.id]
            return (
              <li key={x.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className={`min-w-0 flex-1 ${done ? 'opacity-50' : ''}`}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <SeverityTag sev={x.sev} />
                    <span className="text-[13px] text-soft">{x.cat}</span>
                  </div>
                  <p className={`max-w-[70ch] text-[15px] leading-snug ${done ? 'line-through' : ''}`}>{ws.settings.lang === 'ta' && x.ta ? x.ta : x.msg}</p>
                  <p className="mt-1.5 font-mono text-[12.5px] text-soft">
                    {x.file}:{x.line} ·{' '}
                    <Link to={`${ws.base}/pulls/${x.pr}`} className="underline underline-offset-2 hover:text-ink">
                      {x.repo} #{x.number ?? x.pr}
                    </Link>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResolved((r) => ({ ...r, [x.id]: !r[x.id] }))}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13.5px] font-semibold transition-colors ${
                    done ? 'border-leaf bg-leaf/10 text-leaf' : 'border-line hover:border-ink'
                  }`}
                >
                  {done && <Check size={15} strokeWidth={3} />}
                  {done ? 'Resolved' : 'Mark resolved'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

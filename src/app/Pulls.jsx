import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from './Dashboard'
import { ScoreBadge, StatusPill } from '../components/DashboardParts'
import { useWorkspace } from '../workspace'

const FILTERS = [
  ['all', 'All'],
  ['reviewed', 'Reviewed'],
  ['running', 'Reviewing'],
  ['queued', 'In queue'],
]

export default function Pulls() {
  const ws = useWorkspace()
  const [f, setF] = useState('all')
  const rows = ws.prs.filter((p) => f === 'all' || p.status === f)
  return (
    <div>
      <PageHead title="Pull requests" sub={`${rows.length} shown`}>
        <div role="group" aria-label="Filter by status" className="inline-flex rounded-md border border-line bg-sheet p-0.5 text-[14px] font-semibold">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)} className={`rounded px-3 py-1.5 transition-colors ${f === k ? 'bg-ink text-paper' : 'text-soft hover:text-ink'}`}>
              {l}
            </button>
          ))}
        </div>
      </PageHead>
      <div className="overflow-x-auto rounded-lg border border-line bg-sheet scroll-thin">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="border-b border-line bg-paper/60 text-[12.5px] text-soft">
            <tr>
              <th className="px-5 py-3 font-medium">Pull request</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Findings</th>
              <th className="px-5 py-3 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper/50">
                <td className="px-5 py-3.5">
                  <Link to={`${ws.base}/pulls/${p.id}`} className="font-semibold hover:underline">
                    #{p.number ?? p.id} {p.title}
                  </Link>
                  <div className="text-[12.5px] text-soft">
                    {p.repo} · {p.author} · {p.when}
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <StatusPill status={p.status} />
                </td>
                <td className="px-3 py-3.5">
                  {p.status === 'reviewed' ? (
                    <span className="flex gap-3 font-mono text-[13px]">
                      <span className="text-pen">{p.c} critical</span>
                      <span className="text-[#9A6B00]">{p.w} warning</span>
                      <span className="text-azure">{p.s} tips</span>
                    </span>
                  ) : (
                    <span className="text-soft">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <ScoreBadge score={p.score} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-soft">
                  No pull requests here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

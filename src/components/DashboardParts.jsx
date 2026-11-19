import { Link } from 'react-router-dom'
import { CountUp, SeverityBars, TrendChart } from './Charts'
import { prs, trend } from '../data'

export function Panel({ title, aside, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-lg border border-line bg-sheet p-5 ${className}`}>
      {(title || aside) && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[18px] font-bold">{title}</h2>
          {aside && <div className="text-[13px] text-soft">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

const STATS = [
  { label: 'Pull requests reviewed', to: 128, note: '18 more than last month' },
  { label: 'Issues caught', to: 342, note: '47 critical, 118 warnings' },
  { label: 'Median review time', to: 38, suffix: 's', note: 'from open to first comment' },
  { label: 'Average score', to: 81, note: 'up from 74 in October' },
]

export function StatRow() {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-sheet lg:grid-cols-4">
      {STATS.map((s, i) => (
        <div key={s.label} className={`p-5 ${i % 2 ? 'border-l border-line' : ''} ${i > 0 ? 'lg:border-l' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''}`}>
          <dt className="text-[13px] text-soft">{s.label}</dt>
          <dd className="mt-1 font-display text-[38px] font-extrabold leading-none tracking-tight">
            <CountUp to={s.to} suffix={s.suffix} />
          </dd>
          <dd className="mt-2 text-[12.5px] text-soft">{s.note}</dd>
        </div>
      ))}
    </dl>
  )
}

export function TrendPanel() {
  return (
    <Panel title="Quality score" aside="Last 30 days">
      <TrendChart data={trend} />
    </Panel>
  )
}

export function SeverityPanel() {
  return (
    <Panel title="Findings by severity" aside="342 total">
      <SeverityBars
        counts={[
          { sev: 'critical', n: 47 },
          { sev: 'warning', n: 118 },
          { sev: 'suggestion', n: 177 },
        ]}
      />
      <p className="mt-5 border-t border-line pt-4 text-[13.5px] leading-relaxed text-soft">
        Security issues are the most common critical finding. Most warnings are database queries inside loops.
      </p>
    </Panel>
  )
}

export function StatusPill({ status }) {
  const map = {
    reviewed: 'bg-leaf/10 text-leaf',
    running: 'bg-azure/10 text-azure',
    queued: 'bg-ink/[0.07] text-soft',
  }
  const label = { reviewed: 'Reviewed', running: 'Reviewing', queued: 'In queue' }
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${map[status]}`}>{label[status]}</span>
}

export function ScoreBadge({ score }) {
  if (score == null) return <span className="text-soft">-</span>
  const cls = score >= 85 ? 'bg-leaf/10 text-leaf' : score >= 65 ? 'bg-hl/50 text-ink' : 'bg-pen/10 text-pen'
  return <span className={`inline-grid h-7 min-w-[40px] place-items-center rounded-md px-2 font-mono text-[13px] font-semibold ${cls}`}>{score}</span>
}

export function ReviewsTable({ rows = prs, linked = true }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[520px] text-left text-[14px]">
        <thead className="text-[12.5px] text-soft">
          <tr>
            <th className="pb-2 font-medium">Pull request</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className="py-3 pr-4">
                {linked ? (
                  <Link to={`/app/pulls/${p.id}`} className="font-semibold hover:underline">
                    #{p.id} {p.title}
                  </Link>
                ) : (
                  <span className="font-semibold">
                    #{p.id} {p.title}
                  </span>
                )}
                <div className="text-[12.5px] text-soft">
                  {p.repo} · {p.author} · {p.when}
                </div>
              </td>
              <td className="py-3 pr-4">
                <StatusPill status={p.status} />
              </td>
              <td className="py-3 text-right">
                <ScoreBadge score={p.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

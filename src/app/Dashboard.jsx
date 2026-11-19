import { Link } from 'react-router-dom'
import { Panel, ReviewsTable, SeverityPanel, StatRow, TrendPanel } from '../components/DashboardParts'
import { SeverityTag } from '../components/ui'
import { useWorkspace } from '../workspace'

export function PageHead({ title, sub, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[34px] font-extrabold leading-none">{title}</h1>
        {sub && <p className="mt-2 text-[15px] text-soft">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const ws = useWorkspace()
  const open = ws.findings.filter((f) => f.sev === 'critical').slice(0, 4)
  return (
    <div className="space-y-4">
      <PageHead title="Dashboard" sub={`Last 30 days across ${ws.repos.filter((r) => r.on).length} ${ws.repos.filter((r) => r.on).length === 1 ? 'repository' : 'repositories'}`} />
      <StatRow />
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <TrendPanel />
        <SeverityPanel />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent reviews" aside={<Link to={`${ws.base}/pulls`} className="font-semibold text-ink underline underline-offset-2">View all</Link>}>
          <ReviewsTable rows={undefined} />
        </Panel>
        <Panel title="Critical findings" aside={<Link to={`${ws.base}/findings`} className="font-semibold text-ink underline underline-offset-2">View all</Link>}>
          {open.length === 0 && <p className="text-[14.5px] text-soft">No critical findings. Nice.</p>}
          <ul className="space-y-4">
            {open.map((f) => (
              <li key={f.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="mb-1 flex items-center gap-2">
                  <SeverityTag sev={f.sev} />
                  <span className="text-[13px] text-soft">{f.cat}</span>
                </div>
                <p className="text-[14.5px] leading-snug">{f.msg}</p>
                <p className="mt-1 font-mono text-[12px] text-soft">
                  {f.file}:{f.line}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

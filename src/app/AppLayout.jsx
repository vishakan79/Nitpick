import { Link, NavLink, Outlet } from 'react-router-dom'
import { GitPullRequest, LayoutDashboard, ListChecks, Settings as Cog, ShieldAlert } from 'lucide-react'
import { Logo } from '../components/ui'
import { repos } from '../data'

const NAV = [
  ['/app', 'Dashboard', LayoutDashboard, true],
  ['/app/pulls', 'Pull requests', GitPullRequest],
  ['/app/findings', 'Findings', ShieldAlert],
  ['/app/rules', 'Rules', ListChecks],
  ['/app/settings', 'Settings', Cog],
]

function NavItem({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium transition-colors ${
          isActive ? 'bg-ink text-paper' : 'text-soft hover:bg-paper hover:text-ink'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  )
}

export default function AppLayout() {
  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-sheet p-4 lg:flex">
        <Link to="/" className="px-2 py-2" aria-label="Nitpick home">
          <Logo />
        </Link>
        <nav className="mt-6 space-y-1" aria-label="App">
          {NAV.map(([to, l, I, end]) => (
            <NavItem key={to} to={to} label={l} Icon={I} end={end} />
          ))}
        </nav>
        <div className="mt-8 px-3">
          <p className="mb-2 text-[13px] font-semibold text-soft">Repositories</p>
          <ul className="space-y-2">
            {repos.map((r) => (
              <li key={r.name} className="flex items-center gap-2.5 text-[14px]">
                <span className={`h-2 w-2 rounded-full ${r.on ? 'bg-leaf' : 'bg-soft/40'}`} />
                <span className={r.on ? '' : 'text-soft'}>{r.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex items-center gap-3 rounded-md border border-line bg-paper p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-display text-[15px] font-bold text-hl">A</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-semibold">Arun Kumar</p>
            <p className="truncate text-[12.5px] text-soft">Pro, 412 of 1,000 reviews</p>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-line bg-sheet lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" aria-label="Nitpick home">
            <Logo />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 scroll-thin" aria-label="App">
          {NAV.map(([to, l, I, end]) => (
            <NavItem key={to} to={to} label={l} Icon={I} end={end} />
          ))}
        </nav>
      </div>

      <div className="border-b border-ink bg-hl px-4 py-2 text-center text-[13.5px] font-medium">
        You are in a demo workspace with sample data. Nothing here is connected to GitHub yet.
      </div>

      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}

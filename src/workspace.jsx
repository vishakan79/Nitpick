import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import * as sample from './data'
import { api, clearToken, getToken } from './api'

const Ctx = createContext(null)
export const useWorkspace = () => useContext(Ctx)

export function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`
  return `${Math.round(s / 86400)} d ago`
}

const DEMO_STATS = [
  { label: 'Pull requests reviewed', to: 128, note: '18 more than last month' },
  { label: 'Issues caught', to: 342, note: '47 critical, 118 warnings' },
  { label: 'Median review time', to: 38, suffix: 's', note: 'from open to first comment' },
  { label: 'Average score', to: 81, note: 'up from 74 in October' },
]

function useDemo() {
  const [rules, setRules] = useState(sample.initialRules)
  const [repos, setRepos] = useState(sample.repos.map((r) => ({ name: `arun/${r.name}`, on: r.on })))
  const [settings, setSettings] = useState({ lang: 'en', strictness: 'balanced', failCheck: false })
  return useMemo(
    () => ({
      demo: true,
      base: '/demo',
      user: { name: 'Arun Kumar', initial: 'A', sub: 'Pro, 412 of 1,000 reviews' },
      stats: DEMO_STATS,
      counts: [
        { sev: 'critical', n: 47 },
        { sev: 'warning', n: 118 },
        { sev: 'suggestion', n: 177 },
      ],
      trend: sample.trend,
      trendDates: null,
      prs: sample.prs,
      findings: sample.findings,
      rules,
      repos,
      settings,
      addRule: async (text) => setRules((r) => [{ id: Date.now(), text, on: true }, ...r]),
      toggleRule: async (id, on) => setRules((rs) => rs.map((x) => (x.id === id ? { ...x, on } : x))),
      deleteRule: async (id) => setRules((rs) => rs.filter((x) => x.id !== id)),
      saveSettings: async (s) => setSettings(s),
      toggleRepo: async (name, on) => setRepos((rs) => rs.map((x) => (x.name === name ? { ...x, on } : x))),
      loadPull: async () => null,
    }),
    [rules, repos, settings],
  )
}

function normalize(d) {
  const s = d.stats
  const n = (v) => Number(v) || 0
  const total = n(s.critical) + n(s.warnings) + n(s.tips)
  const scores = d.stats.trend.map((t) => t.score)
  return {
    stats: [
      { label: 'Pull requests reviewed', to: n(s.reviewed), note: `${d.pulls.length} pull requests seen so far` },
      { label: 'Issues caught', to: total, note: `${n(s.critical)} critical, ${n(s.warnings)} warnings` },
      { label: 'Median review time', to: n(s.median_seconds), suffix: 's', note: 'from open to first comment' },
      { label: 'Average score', to: n(s.avg_score), note: n(s.reviewed) ? 'across reviewed pull requests' : 'no reviews yet' },
    ],
    counts: [
      { sev: 'critical', n: n(s.critical) },
      { sev: 'warning', n: n(s.warnings) },
      { sev: 'suggestion', n: n(s.tips) },
    ],
    trend: scores.some((x) => x != null) ? fillGaps(scores) : [],
    trendDates: d.stats.trend.map((t) => t.date),
    prs: d.pulls.map((p) => ({ ...p, when: ago(p.when), c: n(p.c), w: n(p.w), s: n(p.s) })),
    findings: d.findings.map((f) => ({
      id: f.id,
      pr: f.pullId,
      number: f.number,
      repo: f.repo,
      file: f.file,
      line: f.line,
      sev: f.severity,
      cat: f.category,
      msg: f.en,
      ta: f.ta,
      fix: f.fix,
    })),
    rules: d.rules.map((r) => ({ id: r.id, text: r.description ? `${r.name}. ${r.description}` : r.name, on: r.enabled })),
    repos: d.repos.map((r) => ({ name: r.fullName, on: r.enabled })),
    settings: d.settings,
  }
}

function fillGaps(a) {
  const first = a.find((x) => x != null)
  let last = first
  return a.map((x) => {
    if (x != null) last = x
    return last
  })
}

function useLive() {
  const [state, setState] = useState({ status: 'loading' })
  const [counter, setCounter] = useState(0)

  const load = useCallback(async () => {
    try {
      const [me, stats, pulls, findings, rules, settings, repos] = await Promise.all([
        api('/api/me'),
        api('/api/stats'),
        api('/api/pulls'),
        api('/api/findings'),
        api('/api/rules'),
        api('/api/settings'),
        api('/api/repos').catch(() => []),
      ])
      setState({ status: 'ready', me, ...normalize({ stats, pulls, findings, rules, settings, repos }) })
    } catch (e) {
      setState((s) => (s.status === 'ready' ? s : { status: e.status === 401 ? 'auth' : 'error', message: e.message }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, counter])

  const busy = state.status === 'ready' && state.prs.some((p) => p.status === 'queued' || p.status === 'running')
  useEffect(() => {
    if (!busy) return undefined
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [busy, load])

  const act = useCallback(
    async (fn) => {
      await fn()
      await load()
    },
    [load],
  )

  const value = useMemo(() => {
    if (state.status !== 'ready') return null
    return {
      demo: false,
      base: '/app',
      user: { name: state.me.name || state.me.login, initial: (state.me.login || '?')[0].toUpperCase(), sub: `@${state.me.login}` },
      ...state,
      addRule: (text) => act(() => api('/api/rules', { method: 'POST', body: { name: text, description: '' } })),
      toggleRule: (id, on) => act(() => api(`/api/rules/${id}`, { method: 'PUT', body: { enabled: on } })),
      deleteRule: (id) => act(() => api(`/api/rules/${id}`, { method: 'DELETE' })),
      saveSettings: (s) => act(() => api('/api/settings', { method: 'PUT', body: s })),
      toggleRepo: (name, on) => act(() => api('/api/repos/toggle', { method: 'POST', body: { fullName: name, enabled: on } })),
      loadPull: (id) => api(`/api/pulls/${id}`),
    }
  }, [state, act])

  return { state, value, retry: () => setCounter((c) => c + 1) }
}

function Screen({ children }) {
  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-[420px]">{children}</div>
    </div>
  )
}

function LiveProvider({ children }) {
  const { state, value, retry } = useLive()
  if (!getToken() || state.status === 'auth') return <Navigate to="/login" replace />
  if (state.status === 'loading')
    return (
      <Screen>
        <p className="font-display text-[26px] font-bold">Loading your workspace</p>
        <p className="mt-2 text-[15px] text-soft">The server sleeps when nobody uses it. The first load can take up to a minute.</p>
      </Screen>
    )
  if (state.status === 'error')
    return (
      <Screen>
        <p className="font-display text-[26px] font-bold">Could not reach the server</p>
        <p className="mt-2 text-[15px] text-soft">{state.message}</p>
        <button type="button" onClick={retry} className="mt-5 rounded-md border-2 border-ink bg-hl px-5 py-2.5 font-semibold">
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            clearToken()
            window.location.href = '/login'
          }}
          className="mt-3 block w-full text-[14px] text-soft underline"
        >
          Sign out
        </button>
      </Screen>
    )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function DemoProvider({ children }) {
  const value = useDemo()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function WorkspaceProvider({ demo, children }) {
  return demo ? <DemoProvider>{children}</DemoProvider> : <LiveProvider>{children}</LiveProvider>
}

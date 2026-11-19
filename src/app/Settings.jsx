import { useState } from 'react'
import { Check } from 'lucide-react'
import { PageHead } from './Dashboard'
import { Button, LangToggle, Switch } from '../components/ui'
import { Panel } from '../components/DashboardParts'
import { repos as seed } from '../data'

export default function Settings() {
  const [lang, setLang] = useState('en')
  const [strict, setStrict] = useState('balanced')
  const [checks, setChecks] = useState(false)
  const [repos, setRepos] = useState(seed)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  return (
    <div className="max-w-[820px]">
      <PageHead title="Settings" sub="These apply to every repository Nitpick watches." />
      <div className="space-y-4">
        <Panel title="Explanation language">
          <p className="mb-4 max-w-[58ch] text-[14.5px] leading-relaxed text-soft">Comments on GitHub are written in this language. Tanglish mixes Tamil and English.</p>
          <LangToggle lang={lang} onChange={setLang} />
        </Panel>

        <Panel title="How strict should reviews be?">
          <div role="radiogroup" aria-label="Review strictness" className="grid gap-3 sm:grid-cols-3">
            {[
              ['light', 'Light', 'Only critical issues and clear bugs.'],
              ['balanced', 'Balanced', 'Bugs, security and slow code.'],
              ['strict', 'Strict', 'Everything, including style and tests.'],
            ].map(([k, t, d]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={strict === k}
                onClick={() => setStrict(k)}
                className={`rounded-md border-2 p-4 text-left transition-colors ${strict === k ? 'border-ink bg-hl/40' : 'border-line hover:border-ink'}`}
              >
                <span className="block font-display text-[17px] font-bold">{t}</span>
                <span className="mt-1 block text-[13.5px] leading-snug text-soft">{d}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Status check">
          <div className="flex items-center justify-between gap-6">
            <p className="max-w-[56ch] text-[14.5px] leading-relaxed text-soft">Fail the GitHub status check when Nitpick finds a critical issue, so the pull request cannot merge until it is fixed.</p>
            <Switch on={checks} onChange={setChecks} label="Fail status check on critical findings" />
          </div>
        </Panel>

        <Panel title="Repositories">
          <ul className="divide-y divide-line">
            {repos.map((r) => (
              <li key={r.name} className="flex items-center justify-between py-3">
                <span className="font-mono text-[14px]">arun/{r.name}</span>
                <Switch on={r.on} onChange={(v) => setRepos((rs) => rs.map((x) => (x.name === r.name ? { ...x, on: v } : x)))} label={`Review ${r.name}`} />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex items-center gap-4 pt-2">
          <Button type="button" onClick={save}>
            Save changes
          </Button>
          <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-[14px] font-semibold text-leaf transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
            <Check size={16} strokeWidth={3} />
            Saved
          </span>
        </div>
      </div>
    </div>
  )
}

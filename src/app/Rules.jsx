import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PageHead } from './Dashboard'
import { Button, Switch } from '../components/ui'
import { initialRules } from '../data'

export default function Rules() {
  const [rules, setRules] = useState(initialRules)
  const [text, setText] = useState('')

  const add = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setRules((r) => [{ id: Date.now(), text: t, on: true }, ...r])
    setText('')
  }

  return (
    <div>
      <PageHead title="Rules" sub="Write a rule as a plain sentence. Nitpick checks every pull request against the rules that are on." />

      <form onSubmit={add} className="mb-6 flex flex-col gap-3 rounded-lg border-2 border-ink bg-sheet p-4 shadow-[5px_5px_0_0_#FFD84A] sm:flex-row">
        <label htmlFor="rule" className="sr-only">
          New rule
        </label>
        <input
          id="rule"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="For example: Never log request bodies that contain passwords."
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-soft/70 focus:border-ink focus:outline-none"
        />
        <Button type="submit">Add rule</Button>
      </form>

      {rules.length === 0 ? (
        <p className="rounded-lg border border-line bg-sheet p-8 text-center text-soft">No rules yet. Add one above and Nitpick will start checking it on the next pull request.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-sheet">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className={`text-[15.5px] leading-snug ${r.on ? '' : 'text-soft'}`}>{r.text}</span>
              <span className="flex items-center gap-4">
                <Switch on={r.on} onChange={(v) => setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, on: v } : x)))} label={`Rule: ${r.text}`} />
                <button type="button" aria-label={`Delete rule: ${r.text}`} onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))} className="text-soft transition-colors hover:text-pen">
                  <Trash2 size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

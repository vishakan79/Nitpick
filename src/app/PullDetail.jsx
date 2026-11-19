import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DiffBlock } from '../components/Diff'
import { LangToggle, SeverityTag } from '../components/ui'
import { ScoreRing } from '../components/Charts'
import { StatusPill } from '../components/DashboardParts'
import { comments, detailDiff, prs } from '../data'

export default function PullDetail() {
  const { id } = useParams()
  const pr = prs.find((p) => String(p.id) === id)
  const [lang, setLang] = useState('en')

  if (!pr) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-[32px] font-extrabold">Pull request not found</h1>
        <Link to="/app/pulls" className="mt-3 inline-block font-semibold underline underline-offset-2">
          Back to pull requests
        </Link>
      </div>
    )
  }

  const flagged = detailDiff.lines.filter((l) => l.c)
  const reviewed = pr.status === 'reviewed'

  return (
    <div>
      <Link to="/app/pulls" className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-soft hover:text-ink">
        <ArrowLeft size={16} />
        Pull requests
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight sm:text-[38px]">
            #{pr.id} {pr.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14.5px] text-soft">
            <span>{pr.repo}</span>
            <span>opened by {pr.author}</span>
            <span>{pr.when}</span>
            <StatusPill status={pr.status} />
          </p>
        </div>
        {reviewed && (
          <div className="flex items-center gap-5 rounded-lg border border-line bg-sheet px-5 py-4">
            <ScoreRing score={pr.score} />
            <dl className="space-y-1 text-[14px]">
              <div className="flex gap-2"><dt className="w-20 text-soft">Critical</dt><dd className="font-mono font-semibold">{pr.c}</dd></div>
              <div className="flex gap-2"><dt className="w-20 text-soft">Warnings</dt><dd className="font-mono font-semibold">{pr.w}</dd></div>
              <div className="flex gap-2"><dt className="w-20 text-soft">Tips</dt><dd className="font-mono font-semibold">{pr.s}</dd></div>
            </dl>
          </div>
        )}
      </div>

      {!reviewed ? (
        <div className="rounded-lg border border-line bg-sheet p-8 text-center">
          <p className="font-display text-[22px] font-bold">{pr.status === 'running' ? 'Nitpick is reading this pull request' : 'This pull request is waiting in the queue'}</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-soft">Comments appear here and on GitHub as soon as the review finishes. Small changes usually take under a minute.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[20px] font-bold">Changes with comments</h2>
              <LangToggle lang={lang} onChange={setLang} />
            </div>
            <DiffBlock file={detailDiff.file} lines={detailDiff.lines} lang={lang} />
          </div>
          <aside className="rounded-lg border border-line bg-sheet p-5">
            <h2 className="mb-4 font-display text-[18px] font-bold">Findings in this file</h2>
            <ul className="space-y-4">
              {flagged.map((l) => {
                const c = comments[l.c]
                return (
                  <li key={l.c} className="border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="mb-1 flex items-center gap-2">
                      <SeverityTag sev={c.sev} />
                      <span className="text-[13px] text-soft">{c.cat}</span>
                    </div>
                    <p className="font-mono text-[12px] text-soft">Line {l.n}</p>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      )}
    </div>
  )
}

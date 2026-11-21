import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CommentBlock, DiffBlock } from '../components/Diff'
import { LangToggle, SeverityTag } from '../components/ui'
import { ScoreRing } from '../components/Charts'
import { StatusPill } from '../components/DashboardParts'
import { comments, detailDiff } from '../data'
import { useWorkspace } from '../workspace'

function NotFound({ base }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-[32px] font-extrabold">Pull request not found</h1>
      <Link to={`${base}/pulls`} className="mt-3 inline-block font-semibold underline underline-offset-2">
        Back to pull requests
      </Link>
    </div>
  )
}

export default function PullDetail() {
  const { id } = useParams()
  const ws = useWorkspace()
  const base = ws.base
  const pr = ws.prs.find((p) => String(p.id) === id)
  const [detail, setDetail] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')

  useEffect(() => {
    if (ws.demo || !pr || pr.status !== 'reviewed') return
    let alive = true
    ws.loadPull(id).then((d) => alive && setDetail(d)).catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pr?.status])

  async function retryReview() {
    setRetrying(true)
    setRetryError('')
    try {
      await ws.retryPull(id)
    } catch (e) {
      setRetryError(e.message || 'Could not queue this review. Please try again.')
    } finally {
      setRetrying(false)
    }
  }

  if (!pr) return <NotFound base={base} />

  const reviewed = pr.status === 'reviewed'
  const flagged = detailDiff.lines.filter((l) => l.c)

  return (
    <div>
      <Link to={`${base}/pulls`} className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-soft hover:text-ink">
        <ArrowLeft size={16} />
        Pull requests
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight sm:text-[38px]">
            #{pr.number ?? pr.id} {pr.title}
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
          <p className="font-display text-[22px] font-bold">
            {pr.status === 'running' ? 'Nitpick is reading this pull request' : pr.status === 'failed' ? 'The review did not finish' : 'This pull request is waiting in the queue'}
          </p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-soft">
            {pr.status === 'failed'
              ? 'The automated review could not finish. Check the configured AI provider and retry the review without creating another pull request.'
              : 'Comments appear here and on GitHub as soon as the review finishes. Small changes usually take under a minute.'}
          </p>
          {pr.status === 'failed' && (
            <div className="mt-5">
              {retryError && <p role="alert" className="mb-3 text-[13px] text-pen">{retryError}</p>}
              <button type="button" onClick={retryReview} disabled={retrying} className="rounded-md border-2 border-ink bg-hl px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50">
                {retrying ? 'Queueing review…' : 'Retry review'}
              </button>
            </div>
          )}
        </div>
      ) : ws.demo ? (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[20px] font-bold">Changes with comments</h2>
            </div>
            <DiffBlock file={detailDiff.file} lines={detailDiff.lines} />
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
      ) : (
        <div className="max-w-[860px]">
          {detail?.summary && <p className="mb-5 text-[15px] text-soft">{detail.summary}</p>}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[20px] font-bold">Comments posted on GitHub</h2>
          </div>
          {!detail ? (
            <p className="text-soft">Loading comments</p>
          ) : detail.findings.length === 0 ? (
            <p className="rounded-lg border border-line bg-sheet p-8 text-center text-[15px] text-soft">Nitpick found nothing to flag in this pull request.</p>
          ) : (
            <ul className="space-y-6">
              {detail.findings.map((f) => (
                <li key={f.id}>
                  <p className="font-mono text-[12.5px] text-soft">
                    {f.file}:{f.line}
                  </p>
                  <div className="-ml-12">
                    <CommentBlock c={{ sev: f.severity, cat: f.category, en: f.en, fix: f.fix }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

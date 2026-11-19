import { SeverityTag, RichText } from './ui'
import { SEV, comments } from '../data'

export function CommentBlock({ c, lang }) {
  return (
    <div className={`my-2 ml-12 mr-3 border-l-4 bg-sheet py-3 pl-4 pr-4 font-sans ${SEV[c.sev].edge} shadow-[0_1px_0_0_#D3D9E6]`}>
      <div className="mb-1.5 flex items-center gap-2 text-[13px]">
        <SeverityTag sev={c.sev} />
        <span className="font-semibold">{c.cat}</span>
        <span className="text-soft">Nitpick</span>
      </div>
      <p className="max-w-[62ch] whitespace-normal text-[14px] leading-relaxed text-ink">
        <RichText text={lang === 'ta' ? c.ta : c.en} />
      </p>
      {c.fix && (
        <pre className="mt-2.5 overflow-x-auto rounded bg-ink px-3 py-2 font-mono text-[12px] leading-5 text-paper scroll-thin">
          <span className="select-none text-hl">+ </span>
          {c.fix}
        </pre>
      )}
    </div>
  )
}

const KIND = {
  add: 'bg-[#E1F5EA]',
  del: 'bg-[#FBE4E5]',
  ctx: '',
}

export function DiffBlock({ file, lines, lang = 'en', showComments = true }) {
  return (
    <div className="overflow-hidden rounded-md border border-ink bg-white">
      <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2 font-mono text-[12px] text-soft">
        <span className="truncate">{file}</span>
      </div>
      <div className="overflow-x-auto scroll-thin py-1 font-mono text-[13px] leading-[26px]">
        {lines.map((l) => (
          <div key={l.n}>
            <div className={`flex min-w-max ${KIND[l.k]}`}>
              <span className="w-10 shrink-0 select-none pr-3 text-right text-soft/70">{l.n}</span>
              <span className={`w-5 shrink-0 select-none ${l.k === 'add' ? 'text-leaf' : 'text-soft/60'}`}>{l.k === 'add' ? '+' : ''}</span>
              <span className="whitespace-pre pr-6">{l.t}</span>
            </div>
            {showComments && l.c && <CommentBlock c={comments[l.c]} lang={lang} />}
          </div>
        ))}
      </div>
    </div>
  )
}

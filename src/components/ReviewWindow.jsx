import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { comments } from '../data'
import { SeverityTag, RichText } from './ui'

// Each line is plain text, or an array mixing text and flagged spans.
const LINES = [
  { n: 1, parts: ['@GetMapping("/orders/{id}")'] },
  { n: 2, parts: ['public Order find(@PathVariable String id) {'] },
  { n: 3, mark: 'sql', parts: ['    String sql = ', { flag: true, text: '"SELECT * FROM orders WHERE id = \'" + id + "\'"' }, ';'] },
  { n: 4, parts: ['    Order o = jdbc.queryForObject(sql, mapper);'] },
  { n: 5, parts: ['    for (Item i : o.getItems()) {'] },
  { n: 6, mark: 'nplus1', parts: ['        i.setProduct(', { flag: true, text: 'productRepo.findById(i.getProductId())' }, ');'] },
  { n: 7, parts: ['    }'] },
  { n: 8, parts: ['    return o;'] },
  { n: 9, parts: ['}'] },
]

// step: 1 mark line 3, 2 comment, 3 mark line 6, 4 comment, 5 summary
const SCHEDULE = [
  [600, 1],
  [1400, 2],
  [3400, 3],
  [4100, 4],
  [5800, 5],
]

function Flag({ on, children }) {
  return (
    <span className="relative">
      {children}
      <motion.span
        aria-hidden="true"
        className="squig absolute -bottom-[3px] left-0 right-0 h-[4px] origin-left"
        initial={false}
        animate={{ scaleX: on ? 1 : 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    </span>
  )
}

function Comment({ id }) {
  const c = comments[id]
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className={`mb-2 ml-12 mr-3 mt-1 border-l-4 bg-sheet py-3 pl-4 pr-4 font-sans shadow-[0_1px_0_0_#D3D9E6] ${c.sev === 'critical' ? 'border-pen' : 'border-hl'}`}>
        <div className="mb-1.5 flex items-center gap-2 text-[13px]">
          <SeverityTag sev={c.sev} />
          <span className="font-semibold">{c.cat}</span>
        </div>
        <p className="whitespace-normal text-[13.5px] leading-relaxed">
          <RichText text={c.en} />
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-ink px-3 py-1.5 font-mono text-[11.5px] leading-5 text-paper scroll-thin">
          <span className="select-none text-hl">+ </span>
          {c.fix}
        </pre>
      </div>
    </motion.div>
  )
}

export default function ReviewWindow() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (reduce) {
      setStep(5)
      return
    }
    setStep(0)
    const timers = SCHEDULE.map(([t, s]) => setTimeout(() => setStep(s), t))
    return () => timers.forEach(clearTimeout)
  }, [run, reduce])

  const marked = (line) => (line.mark === 'sql' ? step >= 1 : line.mark === 'nplus1' ? step >= 3 : false)
  const commented = (line) => (line.mark === 'sql' ? step >= 2 : line.mark === 'nplus1' ? step >= 4 : false)

  return (
    <div className="hard w-full overflow-hidden rounded-lg border-2 border-ink bg-white text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-paper px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">Add order lookup</p>
          <p className="truncate font-mono text-[12px] text-soft">order-service #214 · OrderController.java</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            aria-label="Replay the review"
            className="grid h-8 w-8 place-items-center rounded-md border border-line bg-sheet text-soft transition-colors hover:border-ink hover:text-ink"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="ruled min-h-[470px] overflow-x-auto py-2 font-mono text-[13px] leading-[28px] scroll-thin sm:min-h-[500px]">
        {LINES.map((line) => (
          <div key={line.n}>
            <div className="relative flex min-w-max">
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 right-0 origin-left bg-hl/50"
                initial={false}
                animate={{ scaleX: marked(line) ? 1 : 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute left-1.5 top-[10px] h-2 w-2 rounded-full bg-pen"
                initial={false}
                animate={{ scale: marked(line) ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.25 }}
              />
              <span className="relative w-12 shrink-0 select-none pr-4 text-right text-soft/70">{line.n}</span>
              <span className="relative whitespace-pre pr-6">
                {line.parts.map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={i}>{p}</span>
                  ) : (
                    <Flag key={i} on={marked(line)}>
                      {p.text}
                    </Flag>
                  )
                )}
              </span>
            </div>
            <AnimatePresence>{commented(line) && <Comment id={line.mark} />}</AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink bg-paper px-4 py-3 text-[13px]">
        <AnimatePresence mode="wait">
          {step >= 5 ? (
            <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold">Review posted to GitHub</span>
              <span className="text-soft">1 critical, 1 warning</span>
              <span className="rounded bg-ink px-2 py-0.5 font-mono text-[12px] text-hl">score 54</span>
            </motion.div>
          ) : (
            <motion.div key="work" exit={{ opacity: 0 }} className="flex items-center gap-2 text-soft">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-azure opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-azure" />
              </span>
              Nitpick is reading the diff
            </motion.div>
          )}
        </AnimatePresence>
        <span className="font-mono text-[12px] text-soft">38s</span>
      </div>
    </div>
  )
}

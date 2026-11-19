import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { SEV } from '../data'

export function CountUp({ to, suffix = '', duration = 1.1 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, to, { duration, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduce, to, duration])
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (iso) => {
  const [, m, d] = iso.split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`
}

export function TrendChart({ data, dates, className = '' }) {
  const reduce = useReducedMotion()
  const w = 700
  const h = 210
  const pad = { l: 42, r: 14, t: 14, b: 30 }
  const points = data
    .map((value, i) => ({ i, score: value == null ? null : Number(value) }))
    .filter((point) => point.score != null && Number.isFinite(point.score))
  const lowest = points.length ? Math.min(...points.map((point) => point.score)) : 60
  const min = Math.max(0, Math.min(60, Math.floor(lowest / 10) * 10))
  const max = 100
  const x = (i) => pad.l + ((w - pad.l - pad.r) * i) / Math.max(data.length - 1, 1)
  const y = (value) => pad.t + (h - pad.t - pad.b) * (1 - (value - min) / (max - min))
  const line = points
    .map((point, index) => (index ? 'L' : 'M') + x(point.i).toFixed(1) + ' ' + y(point.score).toFixed(1))
    .join(' ')
  const first = points[0]
  const lastPoint = points[points.length - 1]
  const area = points.length > 1
    ? line + ' L' + x(lastPoint.i).toFixed(1) + ' ' + (h - pad.b) + ' L' + x(first.i).toFixed(1) + ' ' + (h - pad.b) + ' Z'
    : ''
  const ticks = []
  for (let tick = min; tick <= max; tick += 10) ticks.push(tick)
  const lastIndex = Math.max(data.length - 1, 0)
  const labelIndexes = [...new Set([
    0,
    Math.round(lastIndex * 0.25),
    Math.round(lastIndex * 0.5),
    Math.round(lastIndex * 0.75),
    lastIndex,
  ])]
  const labels = labelIndexes.map((i) => [
    i,
    dates && dates[i] ? fmt(dates[i]) : 'Day ' + (i + 1),
  ])
  const animationKey = points.map((point) => point.i + ':' + point.score).join('|')
  const latestDate = lastPoint && dates && dates[lastPoint.i] ? fmt(dates[lastPoint.i]) : 'latest review day'
  const aria = points.length
    ? 'Quality score trend over the last 30 days. ' + points.length + ' review days recorded. Latest score ' + lastPoint.score + ' on ' + latestDate + '.'
    : 'No completed reviews in the last 30 days.'

  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} className={'w-full ' + className} role="img" aria-label={aria}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.l} x2={w - pad.r} y1={y(tick)} y2={y(tick)} stroke="#D3D9E6" strokeWidth="1" />
          <text x={pad.l - 8} y={y(tick) + 4} textAnchor="end" fontSize="14" fill="#4A5670" fontFamily="Instrument Sans">
            {tick}
          </text>
        </g>
      ))}
      {labels.map(([i, label]) => (
        <text key={label + '-' + i} x={x(i)} y={h - 8} textAnchor={i === 0 ? 'start' : i === lastIndex ? 'end' : 'middle'} fontSize="14" fill="#4A5670" fontFamily="Instrument Sans">
          {label}
        </text>
      ))}
      {area && (
        <motion.path
          key={'area-' + animationKey}
          d={area}
          fill="#FFD84A"
          fillOpacity="0.4"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.9 }}
        />
      )}
      {points.length > 1 && (
        <motion.path
          key={'line-' + animationKey}
          d={line}
          fill="none"
          stroke="#0D1526"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 1.5, ease: 'easeInOut' }}
        />
      )}
      {lastPoint && (
        <motion.circle
          key={'latest-' + animationKey}
          cx={x(lastPoint.i)}
          cy={y(lastPoint.score)}
          r="6"
          fill="#E4484F"
          stroke="#FAFBFE"
          strokeWidth="2.5"
          initial={reduce ? false : { r: 0, opacity: 0 }}
          whileInView={{ r: 6, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : points.length > 1 ? 1.15 : 0.15 }}
        >
          <title>{'Score ' + lastPoint.score + ' on ' + latestDate}</title>
        </motion.circle>
      )}
    </svg>
  )
}

export function SeverityBars({ counts }) {
  const total = counts.reduce((a, c) => a + c.n, 0) || 1
  const reduce = useReducedMotion()
  return (
    <ul className="space-y-4">
      {counts.map((c) => (
        <li key={c.sev}>
          <div className="mb-1.5 flex justify-between text-[14px]">
            <span>{SEV[c.sev].label}</span>
            <span className="font-mono text-[13px]">{c.n}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-paper">
            <motion.div
              className="h-full rounded-full"
              style={{ background: SEV[c.sev].bar }}
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${(c.n / total) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ScoreRing({ score, size = 96 }) {
  const reduce = useReducedMotion()
  const r = 40
  const circ = 2 * Math.PI * r
  const color = score >= 85 ? '#157A52' : score >= 65 ? '#C98A00' : '#E4484F'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#D3D9E6" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={reduce ? false : { strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display text-[28px] font-extrabold">{score}</div>
    </div>
  )
}

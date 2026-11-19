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

export function TrendChart({ data, className = '' }) {
  const reduce = useReducedMotion()
  const w = 700
  const h = 210
  const pad = { l: 42, r: 14, t: 14, b: 30 }
  const min = 60
  const max = 100
  const x = (i) => pad.l + ((w - pad.l - pad.r) * i) / (data.length - 1)
  const y = (v) => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min))
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)} ${h - pad.b} L${x(0)} ${h - pad.b} Z`
  const last = data.length - 1
  const ticks = [60, 70, 80, 90, 100]
  const labels = [
    [0, 'Oct 19'],
    [7, 'Oct 26'],
    [14, 'Nov 2'],
    [21, 'Nov 9'],
    [29, 'Nov 18'],
  ]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full ${className}`} role="img" aria-label="Quality score rising from 71 to 90 over 30 days">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="#D3D9E6" strokeWidth="1" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="14" fill="#4A5670" fontFamily="Instrument Sans">
            {t}
          </text>
        </g>
      ))}
      {labels.map(([i, t]) => (
        <text key={t} x={x(i)} y={h - 8} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} fontSize="14" fill="#4A5670" fontFamily="Instrument Sans">
          {t}
        </text>
      ))}
      <motion.path d={area} fill="#FFD84A" fillOpacity="0.4" initial={reduce ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.9 }} />
      <motion.path
        d={line}
        fill="none"
        stroke="#0D1526"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      <circle cx={x(last)} cy={y(data[last])} r="6" fill="#E4484F" stroke="#FAFBFE" strokeWidth="2.5" />
    </svg>
  )
}

export function SeverityBars({ counts }) {
  const total = counts.reduce((a, c) => a + c.n, 0)
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

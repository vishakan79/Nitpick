import { Link } from 'react-router-dom'
import { SEV } from '../data'

export function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#0D1526" />
      <rect x="7" y="19" width="18" height="6" rx="1" fill="#FFD84A" />
      <path d="M9 23V9l14 14V9" fill="none" stroke="#FAFBFE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 27q2-2 4 0t4 0t4 0t4 0" fill="none" stroke="#E4484F" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display text-[22px] font-extrabold tracking-tight ${className}`}>
      <LogoMark />
      Nitpick
    </span>
  )
}

const VARIANTS = {
  primary:
    'bg-ink text-paper border-2 border-ink shadow-[4px_4px_0_0_#FFD84A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#FFD84A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
  ghost: 'bg-transparent text-ink border-2 border-ink hover:bg-ink hover:text-paper',
  light:
    'bg-hl text-ink border-2 border-hl shadow-[4px_4px_0_0_#FAFBFE] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#FAFBFE]',
  quiet: 'bg-sheet text-ink border border-line hover:border-ink',
}

export function Button({ as, variant = 'primary', className = '', children, ...props }) {
  const Comp = as === 'link' ? Link : as === 'a' ? 'a' : 'button'
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2.5 rounded-md px-5 py-3 text-[15px] font-semibold transition-[transform,box-shadow,background-color,color] duration-150 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function SeverityTag({ sev, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold leading-5 ${SEV[sev].tag}`}>
      {children || SEV[sev].label}
    </span>
  )
}

// Renders text with `inline code` segments
export function RichText({ text }) {
  return text.split('`').map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded bg-ink/[0.07] px-1.5 py-0.5 font-mono text-[0.86em]">
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export function LangToggle({ lang, onChange, className = '' }) {
  return (
    <div role="group" aria-label="Explanation language" className={`inline-flex rounded-md border border-line bg-paper p-0.5 text-[13px] font-semibold ${className}`}>
      {[
        ['en', 'English'],
        ['ta', 'Tanglish'],
      ].map(([k, label]) => (
        <button
          key={k}
          type="button"
          aria-pressed={lang === k}
          onClick={() => onChange(k)}
          className={`rounded px-3 py-1 transition-colors ${lang === k ? 'bg-ink text-paper' : 'text-soft hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border-2 border-ink transition-colors ${on ? 'bg-hl' : 'bg-paper'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

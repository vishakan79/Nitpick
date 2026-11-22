import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check, Linkedin, Menu, X } from 'lucide-react'
import { Button, GithubIcon, Logo, LogoMark, Switch, RichText } from '../components/ui'
import ReviewWindow from '../components/ReviewWindow'
import Illustration from '../components/Illustration'
import { DiffBlock } from '../components/Diff'
import { TrendChart } from '../components/Charts'
import { SeverityPanel, StatRow, TrendPanel, ReviewsTable, Panel } from '../components/DashboardParts'
import { catches, comments, faq, initialRules, trend, prs } from '../data'

const LINKEDIN = 'https://www.linkedin.com/in/vishakan-s/'
const GITHUB_PROFILE = 'https://github.com/vishakan79'

const LINKS = [
  ['How it works', '#how'],
  ['What it catches', '#catches'],
  ['Security', '#security'],
  ['Founder', '#founder'],
  ['FAQ', '#faq'],
]

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur" aria-label="Main">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5">
        <a href="#top" aria-label="Nitpick home">
          <Logo />
        </a>
        <ul className="hidden items-center gap-7 text-[15px] font-medium md:flex">
          {LINKS.map(([l, h]) => (
            <li key={h}>
              <a href={h} className="text-soft transition-colors hover:text-ink">
                {l}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="px-2 text-[15px] font-semibold hover:underline">
            Sign in
          </Link>
          <Button as="link" to="/login" className="!py-2">
            <GithubIcon className="h-4 w-4" />
            Install on GitHub
          </Button>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-line bg-sheet md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-paper px-5 pb-5 md:hidden">
          <ul className="py-2">
            {LINKS.map(([l, h]) => (
              <li key={h}>
                <a href={h} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-[16px] font-medium">
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <Button as="link" to="/login" className="mt-3 w-full">
            <GithubIcon className="h-4 w-4" />
            Install on GitHub
          </Button>
        </div>
      )}
    </nav>
  )
}

function Hero() {
  return (
    <header id="top" className="px-5 pb-6 pt-14 text-center sm:pt-20">
      <h1 className="mx-auto max-w-[17ch] text-[46px] font-extrabold leading-[0.98] sm:text-[72px]">
        Your pull requests, reviewed in seconds.
      </h1>
      <p className="mx-auto mt-6 max-w-[60ch] text-[18px] leading-relaxed text-soft sm:text-[19px]">
        Nitpick is an AI reviewer for GitHub. It reads every pull request the moment it opens and comments on the exact lines with security holes, bugs and slow queries, so your team fixes them before the code ships.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button as="link" to="/login">
          <GithubIcon className="h-5 w-5" />
          Install on GitHub
        </Button>
        <Button as="a" href="#proof" variant="ghost">
          See a real review
          <ArrowRight size={17} />
        </Button>
      </div>
      <ul className="mx-auto mt-6 flex max-w-[760px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] text-soft">
        {['Free for public repositories', 'Open source', 'Never merges or approves', 'Review posted in seconds'].map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <Check size={16} strokeWidth={3} className="text-leaf" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-14 max-w-[880px] px-0 sm:px-2">
        <ReviewWindow />
      </div>
    </header>
  )
}

function InPlainWords() {
  const rows = [
    ['What is it?', 'A code reviewer that runs by itself. Connect your GitHub repositories once, and every pull request gets a review without anyone asking for it.'],
    [
      'What problem does it solve?',
      'Human reviewers are busy, so pull requests wait for days and simple mistakes slip through: a query built from user input, a missing null check, a password typed into the code. Nitpick finds these within seconds of the pull request opening.',
    ],
    ['Who is it for?', 'Developers and small teams who want a fast first review: students building projects, open source maintainers, and teams without a free senior reviewer.'],
    ['What does it not do?', 'It never merges, approves or edits your code. It only leaves comments, and your team decides what to fix.'],
  ]
  return (
    <section aria-labelledby="plain-words" className="mx-auto max-w-[1120px] px-5 pb-6 pt-16 sm:pt-24">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <h2 id="plain-words" className="max-w-[14ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">
          What Nitpick does, in plain words.
        </h2>
        <dl className="divide-y divide-line border-y border-line">
          {rows.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-display text-[20px] font-bold leading-tight">{q}</dt>
              <dd className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const PROOF_PR = 'https://github.com/vishakan79/testingNitpick/pull/3'

function RealReview() {
  const found = [
    ['critical', 'SQL injection', 'ReportExporter.java:13', 'A query is built by joining a user-supplied value into the SQL text.'],
    ['critical', 'Command injection', 'ReportExporter.java:20', 'A shell command is built from an unvalidated file name.'],
    ['critical', 'SQL injection', 'ReportExporter.java:26', 'An id is concatenated into SQL inside a loop.'],
    ['warning', 'N+1 query', 'ReportExporter.java:26', 'A separate database query runs for every item in the list.'],
    ['warning', 'Hardcoded secret', 'ReportExporter.java:6', 'An API token is written directly in the source code.'],
    ['warning', 'Swallowed exception', 'ReportExporter.java:36', 'An error is caught and ignored, so failures disappear silently.'],
  ]
  return (
    <section id="proof" className="border-y-2 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <h2 className="max-w-[16ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">Not a mock-up. A real review.</h2>
            <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-paper/75">
              We opened a pull request with a deliberately flawed file. Nitpick found six problems and posted them on the exact lines in about three seconds. Open the pull request on GitHub and check every comment yourself.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4">
              {[
                ['6', 'issues flagged'],
                ['~3s', 'to review'],
                ['3', 'critical'],
              ].map(([n, l]) => (
                <div key={l} className="border-t-2 border-hl pt-3">
                  <dt className="font-display text-[36px] font-extrabold leading-none text-hl">{n}</dt>
                  <dd className="mt-1 text-[14px] text-paper/70">{l}</dd>
                </div>
              ))}
            </dl>
            <Button as="a" href={PROOF_PR} target="_blank" rel="noopener noreferrer" variant="light" className="mt-8">
              <GithubIcon className="h-5 w-5" />
              Open the pull request
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
            <p className="mt-3 text-[13px] text-paper/60">A test repository, 40 lines of code. This is the first review on the pull request; later commits were reviewed too. Timing measured on a warm server.</p>
          </div>
          <ul className="divide-y divide-paper/15 rounded-lg border border-paper/20 bg-paper/5">
            {found.map(([sev, t, where, d]) => (
              <li key={where + t} className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${sev === 'critical' ? 'bg-pen text-white' : 'bg-hl text-ink'}`}>
                    {sev === 'critical' ? 'Critical' : 'Warning'}
                  </span>
                  <span className="font-display text-[18px] font-bold">{t}</span>
                  <span className="ml-auto font-mono text-[12.5px] text-paper/60">{where}</span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-paper/75">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Audience() {
  const people = [
    ['Startups and small teams', 'No senior reviewer free? Nitpick gives every pull request a consistent first pass, so the team ships faster without lowering the bar.'],
    ['Open source maintainers', 'Contributors get instant, specific feedback. You spend your time on design and direction instead of repeating the same comments.'],
    ['Students and bootcamp learners', 'Get a real code review on every project, with explanations of why something is a problem and how to fix it.'],
    ['Solo developers', 'Nobody to review your code? Nitpick is the second pair of eyes that never gets tired or busy.'],
  ]
  return (
    <section aria-labelledby="audience" className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
      <h2 id="audience" className="max-w-[20ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">Made for people who ship code.</h2>
      <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
        {people.map(([t, d]) => (
          <div key={t} className="border-t-2 border-ink pt-4">
            <h3 className="font-display text-[22px] font-bold leading-tight">{t}</h3>
            <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-soft">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Benefits() {
  const items = [
    ['Faster merges', 'The first review happens in seconds, so authors fix the obvious problems before a teammate opens the pull request. Reviewers start from a cleaner change.'],
    ['Fewer bugs in production', 'Query built from user input, missing null check, secret typed into the code: the mistakes that cause incidents are flagged on the line where they were written.'],
    ['The same standard every time', 'Write your team rules as plain sentences. Nitpick applies them to every pull request, on a Friday evening as much as on a Monday morning.'],
    ['Juniors learn while they ship', 'Each comment explains what is wrong, why it matters and how to fix it, so the feedback teaches instead of just blocking.'],
  ]
  return (
    <section aria-labelledby="benefits" className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
      <h2 id="benefits" className="max-w-[22ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">
        What your team gets.
      </h2>
      <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
        {items.map(([t, d]) => (
          <div key={t} className="border-t-2 border-ink pt-4">
            <h3 className="font-display text-[22px] font-bold leading-tight">{t}</h3>
            <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-soft">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Security() {
  const items = [
    ['Your repository is not stored', 'Nitpick reads the diff of a pull request, sends it to the AI model, and drops it once the comments are posted. It keeps the findings, file names and scores so your dashboard works.'],
    ['What leaves GitHub', 'The pull request diff is sent to the AI provider (Groq) to write the review. Nothing else from your repository is sent.'],
    ['It cannot merge or approve', 'Nitpick only posts review comments. It never merges, approves, closes or edits your code.'],
    ['Signed events only', 'Every GitHub event is checked against its HMAC-SHA256 signature before anything is queued. Unsigned requests are rejected.'],
    ['Encrypted access tokens', 'Your GitHub access token is encrypted at rest. Sign in uses GitHub OAuth, and you can revoke access at any time in your GitHub settings.'],
    ['Open source', 'Every line is public on GitHub, so your team can read exactly what runs on your pull requests.'],
  ]
  return (
    <section id="security" className="border-y-2 border-ink bg-sheet">
      <div className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
        <h2 className="max-w-[20ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">Clear about what it sees and what it does.</h2>
        <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-soft">
          A tool that reads your code should say plainly what it does with it. Nitpick currently works on public repositories.
        </p>
        <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([t, d]) => (
            <div key={t}>
              <dt className="flex items-start gap-2.5 font-display text-[19px] font-bold leading-tight">
                <Check size={20} strokeWidth={3} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
                {t}
              </dt>
              <dd className="mt-2 pl-[30px] text-[15px] leading-relaxed text-soft">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Founder() {
  const [broken, setBroken] = useState(false)
  return (
    <section id="founder" className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
      <div className="grid items-center gap-10 md:grid-cols-[240px_1fr] md:gap-16">
        <div className="mx-auto w-[200px] md:w-full">
          {broken ? (
            <div className="grid aspect-square place-items-center rounded-xl border-2 border-ink bg-hl font-display text-[64px] font-extrabold shadow-[8px_8px_0_0_#0D1526]">VS</div>
          ) : (
            <img
              src="https://github.com/vishakan79.png?size=480"
              alt="Vishakan S"
              width="240"
              height="240"
              loading="lazy"
              onError={() => setBroken(true)}
              className="aspect-square w-full rounded-xl border-2 border-ink bg-paper object-cover shadow-[8px_8px_0_0_#0D1526]"
            />
          )}
        </div>
        <div>
          <h2 className="text-[36px] font-extrabold leading-[1.02] sm:text-[48px]">Built by Vishakan S, founder.</h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-soft">
            Vishakan builds Java full-stack and AI products. He started Nitpick because first-round review comments are slow and repetitive, and a machine can say them in seconds. He built it end to end: the Spring Boot backend, the review pipeline, the React app and the deployment.
          </p>
          <p className="mt-3 max-w-[58ch] text-[17px] leading-relaxed text-soft">Questions, feedback or a project to discuss? Message him directly.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button as="a" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              <Linkedin size={18} aria-hidden="true" />
              Connect on LinkedIn
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
            <Button as="a" href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer" variant="ghost">
              <GithubIcon className="h-5 w-5" />
              GitHub profile
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Languages() {
  const langs = ['Java', 'Kotlin', 'TypeScript', 'JavaScript', 'Python', 'Go', 'SQL']
  return (
    <section aria-label="Supported languages" className="mx-auto max-w-[1120px] px-5 py-12">
      <div className="flex flex-col items-center gap-4 border-y border-line py-6 sm:flex-row sm:justify-between">
        <p className="text-[15px] text-soft">Tuned for the code most teams ship</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {langs.map((l) => (
            <li key={l} className="rounded-full border border-line bg-sheet px-3.5 py-1 font-mono text-[13px]">
              {l}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Timeline({ title, tone, items }) {
  return (
    <div>
      <h3 className={`mb-6 font-display text-[22px] font-bold ${tone === 'muted' ? 'text-soft' : ''}`}>{title}</h3>
      <ol className="relative space-y-6 border-l-2 border-ink/20 pl-7">
        {items.map((it) => (
          <li key={it.t} className="relative">
            <span
              className={`absolute -left-[37px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 ${it.good ? 'border-ink bg-hl' : it.bad ? 'border-pen bg-paper' : 'border-ink/40 bg-paper'}`}
            />
            <p className="font-mono text-[12.5px] text-soft">{it.t}</p>
            <p className={`mt-0.5 text-[16px] leading-snug ${tone === 'muted' ? 'text-soft' : 'font-medium'}`}>{it.d}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function BeforeAfter() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
      <h2 className="max-w-[20ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">The obvious comments should not take two days.</h2>
      <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-soft">
        Most first-round review comments are the same few things: a missing null check, a query built from user input, a test nobody wrote. Nitpick says them in the first minute, so your teammates can spend their time on the design.
      </p>
      <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-0">
        <div className="md:border-r md:border-line md:pr-12">
          <Timeline
            title="Without Nitpick"
            tone="muted"
            items={[
              { t: 'Mon 10:02', d: 'Pull request opened' },
              { t: 'Mon to Wed', d: 'Waiting for a reviewer to have time' },
              { t: 'Wed 16:30', d: 'First comment: missing null check on line 42', bad: true },
              { t: 'Thu 11:15', d: 'Second round: this query is built from user input', bad: true },
              { t: 'Thu 17:40', d: 'Merged' },
            ]}
          />
        </div>
        <div className="md:pl-12">
          <Timeline
            title="With Nitpick"
            items={[
              { t: 'Mon 10:02', d: 'Pull request opened' },
              { t: 'Mon 10:03', d: 'Nitpick flags the null check, the SQL query and a missing test', good: true },
              { t: 'Mon 10:40', d: 'Author fixes all three and pushes' },
              { t: 'Mon 14:10', d: 'A teammate reviews the design, not the typos', good: true },
              { t: 'Mon 15:00', d: 'Merged' },
            ]}
          />
        </div>
      </div>
      <p className="mt-8 text-[13px] text-soft">An example timeline, not measured data.</p>
    </section>
  )
}

function Flow() {
  const reduce = useReducedMotion()
  const nodes = [
    ['Pull request', 'opened on GitHub'],
    ['Webhook and queue', 'verified, then queued'],
    ['AI review', 'file by file'],
    ['Inline comments', 'posted to the PR'],
  ]
  const xs = [4, 262, 520, 778]
  return (
    <svg viewBox="0 0 980 120" className="hidden w-full md:block" role="img" aria-label="Pull request, then webhook and queue, then AI review, then inline comments">
      {nodes.map(([t, s], i) => (
        <g key={t}>
          <rect x={xs[i] + 5} y="21" width="196" height="76" rx="8" fill="#0D1526" />
          <rect x={xs[i]} y="16" width="196" height="76" rx="8" fill={i === 2 ? '#FFD84A' : '#FAFBFE'} stroke="#0D1526" strokeWidth="2.2" />
          <text x={xs[i] + 98} y="50" textAnchor="middle" fontSize="16.5" fontWeight="700" fill="#0D1526" style={{ fontFamily: '"Bricolage Grotesque Variable", sans-serif' }}>
            {t}
          </text>
          <text x={xs[i] + 98} y="72" textAnchor="middle" fontSize="13.5" fill="#4A5670" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
            {s}
          </text>
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <motion.path
            d={`M${xs[i] + 204} 54 H${xs[i + 1] - 8}`}
            stroke="#0D1526"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.5 }}
          />
          <motion.path
            d={`M${xs[i + 1] - 15} 47 L${xs[i + 1] - 6} 54 L${xs[i + 1] - 15} 61`}
            stroke="#0D1526"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.2, delay: 0.75 + i * 0.5 }}
          />
        </g>
      ))}
    </svg>
  )
}

function HowItWorks() {
  const steps = [
    ['Connect a repository', 'Sign in with GitHub and choose which repositories Nitpick watches. It asks to read pull requests and write review comments, nothing else.'],
    ['Open a pull request as usual', 'GitHub tells Nitpick about it. The event is checked, queued and answered in milliseconds, so GitHub never waits on the review.'],
    ['Read the comments on the lines', 'Nitpick posts one review with inline comments sorted by severity. Fix them, push, and it reviews only the new commits.'],
  ]
  return (
    <section id="how" className="border-y-2 border-ink bg-sheet">
      <div className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
        <h2 className="max-w-[22ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">Install once. Every pull request gets reviewed.</h2>
        <div className="mt-12">
          <Flow />
        </div>
        <ol className="mt-4 grid gap-10 md:mt-12 md:grid-cols-3 md:gap-8">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-hl font-display text-[18px] font-extrabold">{i + 1}</span>
              <div>
                <h3 className="text-[20px] font-bold leading-tight">{t}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-soft">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Catches() {
  const [i, setI] = useState(0)
  const cur = catches[i]
  return (
    <section id="catches" className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
      <h2 className="max-w-[20ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">It comments on the line, not the whole file.</h2>
      <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-soft">Pick a kind of problem to see what a Nitpick comment looks like on a real change.</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div role="tablist" aria-label="Kinds of findings" className="flex gap-2 overflow-x-auto pb-1 scroll-thin lg:flex-col lg:overflow-visible">
          {catches.map((c, idx) => (
            <button
              key={c.key}
              role="tab"
              id={`tab-${c.key}`}
              aria-selected={i === idx}
              aria-controls="catch-panel"
              onClick={() => setI(idx)}
              className={`shrink-0 rounded-md border-2 px-4 py-3 text-left transition-colors lg:w-full ${
                i === idx ? 'border-ink bg-ink text-paper' : 'border-line bg-sheet hover:border-ink'
              }`}
            >
              <span className="block font-display text-[17px] font-bold leading-tight">{c.title}</span>
              <span className={`mt-1 hidden text-[13px] leading-snug lg:block ${i === idx ? 'text-paper/75' : 'text-soft'}`}>{c.blurb}</span>
            </button>
          ))}
        </div>
        <div id="catch-panel" role="tabpanel" className="min-w-0" aria-labelledby={`tab-${cur.key}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[14px] text-soft lg:hidden">{cur.blurb}</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={cur.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <DiffBlock file={cur.file} lines={cur.lines} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function FeatureRows() {
  const [rules, setRules] = useState(initialRules.slice(0, 4))
  const toggle = (id) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, on: !r.on } : r)))
  return (
    <section className="mx-auto max-w-[1120px] space-y-20 px-5 pb-16 sm:space-y-28 sm:pb-24">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="text-[32px] font-extrabold leading-[1.05] sm:text-[44px]">Your team's rules, in your own words.</h2>
          <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-soft">
            Write a rule as a sentence. Nitpick checks every pull request against the rules you have switched on and flags the lines that break them. No config file, no regex.
          </p>
        </div>
        <div className="rounded-lg border-2 border-ink bg-sheet p-2 shadow-[6px_6px_0_0_#FFD84A]">
          <ul>
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 border-b border-line px-3 py-3.5 last:border-0">
                <span className={`text-[15px] leading-snug ${r.on ? '' : 'text-soft line-through decoration-soft/40'}`}>{r.text}</span>
                <Switch on={r.on} onChange={() => toggle(r.id)} label={`Rule: ${r.text}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="order-2 grid gap-3 md:order-1">
          <div className="rounded-lg border border-line bg-sheet p-4">
            <p className="mb-1.5 text-[13px] font-semibold text-soft">English</p>
            <p className="text-[15px] leading-relaxed">
              <RichText text={comments.nplus1.en} />
            </p>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-[32px] font-extrabold leading-[1.05] sm:text-[44px]">Explained the way you would explain it to a teammate.</h2>
          <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-soft">
            A comment you understand at once gets fixed at once. Each finding says what is wrong, why it matters and how to fix it.
          </p>
        </div>
      </div>

      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="text-[32px] font-extrabold leading-[1.05] sm:text-[44px]">A score that shows whether you are getting better.</h2>
          <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-soft">
            Every review gets a score from 0 to 100, weighted by severity. Watch the trend per repository and see which kinds of mistakes keep coming back.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-sheet p-4">
          <TrendChart data={trend} />
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <section id="dashboard" className="border-y-2 border-ink bg-paper">
      <div className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[20ch] text-[36px] font-extrabold leading-[1.02] sm:text-[52px]">Everything Nitpick found, in one place.</h2>
          <Button as="link" to="/demo" variant="ghost">
            Open the demo dashboard
            <ArrowRight size={17} />
          </Button>
        </div>
        <div className="hard mt-10 overflow-hidden rounded-lg border-2 border-ink bg-paper">
          <div className="flex items-center gap-3 border-b-2 border-ink bg-sheet px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <i className="h-3 w-3 rounded-full bg-pen" />
              <i className="h-3 w-3 rounded-full bg-hl" />
              <i className="h-3 w-3 rounded-full bg-leaf" />
            </span>
            <span className="rounded bg-paper px-3 py-0.5 font-mono text-[12px] text-soft">nitpick.vercel.app/app</span>
          </div>
          <div className="space-y-4 p-4 sm:p-6">
            <StatRow />
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <TrendPanel />
              <SeverityPanel />
            </div>
            <Panel title="Recent reviews" aside="Sample data">
              <ReviewsTable rows={prs.slice(0, 4)} linked={false} />
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}

function UnderTheHood() {
  const items = [
    ['Signed webhooks', 'Every GitHub event is checked against its HMAC-SHA256 signature before anything else happens.'],
    ['A message queue', 'Events go onto RabbitMQ and are answered straight away. Workers do the slow model calls in the background, and a Postgres backup queue means no review is lost if the broker is down.'],
    ['Safe retries', 'GitHub resends deliveries that time out. Each delivery ID is stored once, so a retry never creates a second review.'],
    ['Model fallbacks', 'If the AI model is retired or rate-limited, Nitpick retries and switches to a backup model automatically.'],
    ['Diffs split by file', 'Large changes are cut into per-file pieces that fit the model, skipping lockfiles and generated code.'],
    ['Rate limits and caching', 'Redis limits how fast the assistant can be used and caches your repository list. If Redis is down, Nitpick keeps working.'],
  ]
  const stack = ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'RabbitMQ', 'Redis', 'Groq', 'React']
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 className="text-[36px] font-extrabold leading-[1.02] sm:text-[48px]">Built like a service you would put in production.</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {stack.map((s) => (
              <li key={s} className="rounded-md border border-ink bg-sheet px-3 py-1 font-mono text-[13px]">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {items.map(([t, d]) => (
            <div key={t} className="border-t-2 border-ink pt-3">
              <dt className="font-display text-[19px] font-bold">{t}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-soft">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[820px] px-5 py-16 sm:py-24">
      <h2 className="text-[36px] font-extrabold leading-[1.02] sm:text-[48px]">Questions people ask first</h2>
      <div className="mt-8 border-t-2 border-ink">
        {faq.map((f) => (
          <details key={f.q} className="group border-b border-line py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[18px] font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink text-[18px] leading-none transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-[60ch] pb-5 text-[16px] leading-relaxed text-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-5 pb-16 sm:pb-24">
      <div className="mx-auto grid max-w-[1120px] items-center gap-8 overflow-hidden rounded-xl border-2 border-ink bg-ink p-8 text-paper sm:p-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="max-w-[16ch] text-[38px] font-extrabold leading-[1.02] sm:text-[56px]">Your next pull request deserves a second pair of eyes.</h2>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button as="link" to="/login" variant="light">
              <GithubIcon className="h-5 w-5" />
              Install on GitHub
            </Button>
            <Button as="a" href={LINKEDIN} target="_blank" rel="noopener noreferrer" variant="ghostLight">
              Talk to the founder
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
            <span className="w-full text-[14px] text-paper/70">Free for public repositories</span>
          </div>
        </div>
        <Illustration className="mx-auto w-full max-w-[340px]" />
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <LogoMark size={24} />
          <p className="text-[14px] text-soft">Nitpick, an AI reviewer for GitHub pull requests.</p>
        </div>
        <ul className="flex flex-wrap gap-6 text-[14px] font-medium">
          <li>
            <a href="https://github.com/vishakan79/Nitpick" className="hover:underline">
              Source on GitHub
            </a>
          </li>
          <li>
            <Link to="/demo" className="hover:underline">
              Demo dashboard
            </Link>
          </li>
          <li>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Founder on LinkedIn
            </a>
          </li>
          <li>
            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Founder on GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div>
      <Nav />
      <Hero />
      <InPlainWords />
      <RealReview />
      <BeforeAfter />
      <Benefits />
      <Audience />
      <HowItWorks />
      <Catches />
      <FeatureRows />
      <DashboardPreview />
      <UnderTheHood />
      <Security />
      <Founder />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}

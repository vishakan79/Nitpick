import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, Bot, RotateCcw, Sparkles, UserRound } from 'lucide-react'
import { api } from '../api'
import { PageHead } from './Dashboard'
import { useWorkspace } from '../workspace'

const STARTERS = [
  'Summarize my latest pull request reviews',
  'What are my most important security risks?',
  'Suggest fixes for my open findings',
  'Which team rules are being violated most?',
]

export default function Assistant() {
  const ws = useWorkspace()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  async function send(text = input) {
    const question = text.trim()
    if (!question || sending) return
    if (question.length > 4000) {
      setError('Please keep your message under 4,000 characters.')
      return
    }
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }))
    const next = [...messages, { id: Date.now(), role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setSending(true)
    setError('')
    try {
      const result = await api('/api/assistant/chat', {
        method: 'POST',
        body: { message: question, history },
      })
      setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', content: result.reply }])
    } catch (e) {
      setError(e.message || 'The assistant could not respond. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (ws.demo) {
    return (
      <div>
        <PageHead title="AI Assistant" sub="Ask questions about code quality, security, performance and review findings." />
        <div className="rounded-lg border border-line bg-sheet p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-hl/60"><Sparkles size={23} /></div>
          <h2 className="mt-4 font-display text-[22px] font-bold">Your AI assistant is available in your workspace</h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-soft">Sign in with GitHub to ask Groq-powered questions about your own pull requests, findings and team rules. Demo mode uses sample data and does not send it to the AI service.</p>
          <Link to="/login" className="mt-5 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-hl px-5 py-2.5 text-[14px] font-semibold">Sign in with GitHub</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHead title="AI Assistant" sub="Groq-powered help grounded in your repositories, reviews, findings and rules." />
      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-line bg-sheet">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-hl"><Sparkles size={20} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[16px] font-bold">Nitpick Assistant</h2>
            <p className="text-[12.5px] text-soft">Uses your workspace data · Powered by Groq</p>
          </div>
          <button type="button" onClick={() => { setMessages([]); setError('') }} disabled={sending || messages.length === 0} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[12.5px] font-semibold text-soft hover:text-ink disabled:opacity-40">
            <RotateCcw size={14} /> New chat
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-[620px] py-8">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-hl"><Bot size={24} /></div>
              <h3 className="font-display text-[25px] font-extrabold">What can I help you improve?</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-soft">I can explain your latest reviews, prioritise security issues, suggest code fixes and help you understand your team's rules. Answers are based on your signed-in workspace data.</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button key={starter} type="button" disabled={sending} onClick={() => send(starter)} className="rounded-md border border-line bg-paper p-3 text-left text-[13.5px] font-medium transition-colors hover:border-ink hover:bg-hl/30 disabled:opacity-50">{starter}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${message.role === 'user' ? 'bg-ink text-paper' : 'bg-hl'}`}>
                  {message.role === 'user' ? <UserRound size={16} /> : <Bot size={17} />}
                </div>
                <div className={`max-w-[85%] rounded-lg px-4 py-3 text-[14px] leading-relaxed ${message.role === 'user' ? 'bg-ink text-paper' : 'border border-line bg-paper text-ink'}`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-3 text-[13.5px] text-soft">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-hl"><Bot size={17} /></div>
              <span>Nitpick is checking your workspace…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && <p role="alert" className="mx-5 mb-2 rounded-md border border-pen/30 bg-pen/5 px-3 py-2 text-[13px] text-pen">{error}</p>}
        <form onSubmit={(event) => { event.preventDefault(); send() }} className="border-t border-line p-4 sm:p-5">
          <div className="flex items-end gap-2 rounded-lg border border-line bg-paper p-2 focus-within:border-ink">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }} maxLength={4000} rows={2} placeholder="Ask about your reviews, code, security or next steps…" className="max-h-40 min-h-[48px] flex-1 resize-y bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-soft" aria-label="Message Nitpick Assistant" />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-ink text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35"><ArrowUp size={19} /></button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11.5px] text-soft">
            <span>Enter to send · Shift + Enter for a new line</span>
            <span>{input.length}/4,000</span>
          </div>
        </form>
      </section>
    </div>
  )
}

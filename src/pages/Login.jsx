import { Link, useSearchParams } from 'react-router-dom'
import { API } from '../api'
import { Button, GithubIcon, Logo } from '../components/ui'
import Illustration from '../components/Illustration'

export default function Login() {
  const [params] = useSearchParams()
  const failed = params.get('error')
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-14">
        <Link to="/" aria-label="Nitpick home">
          <Logo />
        </Link>
        <div className="mx-auto w-full max-w-[400px] py-12">
          <h1 className="text-[40px] font-extrabold leading-[1.05]">Sign in to Nitpick</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-soft">
            Use your GitHub account. Nitpick asks to read pull requests and post review comments, and nothing more.
          </p>
          <Button type="button" onClick={() => { window.location.href = `${API}/auth/github` }} className="mt-8 w-full">
            <GithubIcon className="h-5 w-5" />
            Continue with GitHub
          </Button>
          {failed && (
            <p role="alert" className="mt-4 rounded-md border border-pen bg-pen/10 p-3 text-[13.5px] leading-relaxed">
              GitHub sign-in did not finish. Try again, and approve the access request on GitHub.
            </p>
          )}
          <p className="mt-4 text-[14px] text-soft">
            Just looking?{' '}
            <Link to="/demo" className="font-semibold text-ink underline underline-offset-2">
              Open the demo workspace
            </Link>
          </p>
        </div>
        <p className="text-[13px] text-soft">
          <Link to="/" className="underline underline-offset-2">
            Back to the website
          </Link>
        </p>
      </div>
      <div className="hidden items-center justify-center border-l-2 border-ink bg-hl lg:flex">
        <div className="max-w-[460px] px-10">
          <Illustration className="w-full" />
          <p className="mt-8 font-display text-[28px] font-bold leading-tight">Every pull request, read before anyone else opens it.</p>
        </div>
      </div>
    </div>
  )
}

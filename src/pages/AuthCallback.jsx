import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../api'

export default function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const m = window.location.hash.match(/token=([^&]+)/)
    if (m) {
      setToken(decodeURIComponent(m[1]))
      window.history.replaceState(null, '', '/auth/callback')
      navigate('/app', { replace: true })
    } else {
      navigate('/login?error=missing_token', { replace: true })
    }
  }, [navigate])
  return (
    <div className="grid min-h-screen place-items-center">
      <p className="font-display text-[24px] font-bold">Signing you in</p>
    </div>
  )
}

export const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const KEY = 'nitpick.token'

export function getToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
export function setToken(t) {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* storage unavailable */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${getToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    clearToken()
    throw Object.assign(new Error('Your session has expired.'), { status: 401 })
  }
  if (!res.ok) {
    let msg = ''
    try {
      msg = (await res.json()).error || ''
    } catch {
      /* no body */
    }
    throw Object.assign(new Error(msg || `Request failed (${res.status})`), { status: res.status })
  }
  return res.status === 204 ? null : res.json()
}

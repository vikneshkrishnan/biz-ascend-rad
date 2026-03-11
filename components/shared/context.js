'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { DEMO_PROFILE, demoApiFetch } from '@/lib/mockData'

// ===== DEMO MODE =====
let _demoMode = false
export function setDemoMode(v) { _demoMode = v }
export function isDemoMode() { return _demoMode }

// ===== API HELPER =====
export async function apiFetch(path, opts = {}) {
  if (_demoMode) return demoApiFetch(path, opts)
  const url = `/api${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ===== AUTH CONTEXT =====
export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

// ===== HASH ROUTER =====
export function useRouter() {
  const [hash, setHash] = useState('')
  useEffect(() => {
    const update = () => setHash(window.location.hash.slice(1) || '/')
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigate = useCallback((path) => { window.location.hash = path }, [])
  return { hash, navigate }
}

export function matchRoute(hash) {
  if (!hash || hash === '/') return { page: 'dashboard' }
  if (hash === '/projects') return { page: 'projects' }
  if (hash === '/projects/new') return { page: 'createProject' }
  if (hash === '/users') return { page: 'users' }
  if (hash === '/forgot-password') return { page: 'forgotPassword' }
  const projectDetail = hash.match(/^\/projects\/([^/]+)$/)
  if (projectDetail) return { page: 'projectDetail', id: projectDetail[1] }
  const screener = hash.match(/^\/projects\/([^/]+)\/screener$/)
  if (screener) return { page: 'screener', id: screener[1] }
  const diagnostic = hash.match(/^\/projects\/([^/]+)\/diagnostic$/)
  if (diagnostic) return { page: 'diagnostic', id: diagnostic[1] }
  const scores = hash.match(/^\/projects\/([^/]+)\/scores$/)
  if (scores) return { page: 'scores', id: scores[1] }
  const assess = hash.match(/^\/assess\/([^/]+)$/)
  if (assess) return { page: 'publicAssess', token: assess[1] }
  return { page: 'notFound' }
}

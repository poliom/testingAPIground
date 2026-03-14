'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/orders', label: 'Orders', icon: '🛒' },
  { href: '/docs', label: 'API Docs', icon: '📖' },
]

export default function Nav({ onLoginClick }: { onLoginClick?: () => void }) {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    if (token && email) {
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refresh_token')
    const accessToken = localStorage.getItem('access_token')

    if (refreshToken && accessToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {})
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    setUserEmail(null)
    window.location.reload()
  }

  return (
    <nav className="w-64 min-h-screen bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">API Ground</h1>
        <p className="text-slate-400 text-xs mt-1">REST Training Ground</p>
      </div>

      <ul className="flex-1 p-4 space-y-1">
        {navLinks.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="p-4 border-t border-slate-700">
        {mounted && userEmail ? (
          <div className="space-y-2">
            <div className="px-3 py-2 bg-slate-700 rounded-lg">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm text-white truncate font-medium">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  )
}

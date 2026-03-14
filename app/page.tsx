'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Stats {
  users: number
  products: number
  orders: number
  sessions: number
}

function StatCard({
  label,
  value,
  icon,
  href,
  color,
}: {
  label: string
  value: number | string
  icon: string
  href: string
  color: string
}) {
  return (
    <Link href={href} className="block">
      <div
        className={`bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{icon}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>View</span>
        </div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0, sessions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('access_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      try {
        const [usersRes, productsRes, ordersRes] = await Promise.allSettled([
          fetch('/api/users?size=1', { headers }),
          fetch('/api/products?size=1'),
          fetch('/api/orders?size=1', { headers }),
        ])

        const newStats: Stats = { users: 0, products: 0, orders: 0, sessions: 0 }

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const data = await usersRes.value.json()
          newStats.users = data.total ?? 0
        }

        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          const data = await productsRes.value.json()
          newStats.products = data.total ?? 0
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
          const data = await ordersRes.value.json()
          newStats.orders = data.total ?? 0
        }

        setStats(newStats)
      } catch {
        // Stats will remain 0 on error
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickLinks = [
    { href: '/users', label: 'Manage Users', description: 'View and manage user accounts', icon: '👥' },
    { href: '/products', label: 'Manage Products', description: 'Add, edit, and delete products', icon: '📦' },
    { href: '/orders', label: 'Manage Orders', description: 'Track and update orders', icon: '🛒' },
    { href: '/docs', label: 'API Documentation', description: 'Interactive Swagger UI docs', icon: '📖' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Testing API Ground</h1>
        <p className="text-slate-500 mt-2">
          REST API Training Ground — CRUD, JWT Auth, Swagger UI
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Users"
          value={loading ? '...' : stats.users}
          icon="👥"
          href="/users"
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Total Products"
          value={loading ? '...' : stats.products}
          icon="📦"
          href="/products"
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Total Orders"
          value={loading ? '...' : stats.orders}
          icon="🛒"
          href="/orders"
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          label="Active Sessions"
          value={loading ? '...' : stats.sessions}
          icon="🔑"
          href="/docs"
          color="bg-purple-100 text-purple-700"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ href, label, description, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {label}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">API Endpoints Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Auth</h3>
            <ul className="space-y-1 text-slate-500">
              <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/auth/register</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/auth/login</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/auth/refresh</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/auth/logout</code></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Resources</h3>
            <ul className="space-y-1 text-slate-500">
              <li><code className="bg-slate-100 px-1 rounded text-xs">GET/POST /api/users</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">GET/PUT/PATCH/DELETE /api/users/:id</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">GET/POST /api/products</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">GET/POST /api/orders</code></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Special</h3>
            <ul className="space-y-1 text-slate-500">
              <li><code className="bg-slate-100 px-1 rounded text-xs">PUT /api/users/:id/role</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/users/:id/permissions</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/users/:id/avatar</code></li>
              <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/swagger.json</code></li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Open interactive API docs →
          </Link>
        </div>
      </div>
    </div>
  )
}

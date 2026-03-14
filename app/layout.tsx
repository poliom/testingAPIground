'use client'

import './globals.css'
import { useState } from 'react'
import Nav from '@/components/Nav'
import AuthModal from '@/components/AuthModal'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <html lang="en">
      <head>
        <title>Testing API Ground</title>
        <meta name="description" content="REST API Training Ground — CRUD, JWT Auth, Swagger UI" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <Nav onLoginClick={() => setShowLogin(true)} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
        <AuthModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
        />
      </body>
    </html>
  )
}

'use client'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="p-4 bg-slate-800 text-white">
        <h1 className="text-xl font-bold">Testing API Ground — API Documentation</h1>
        <p className="text-slate-300 text-sm mt-1">
          Use <code className="bg-slate-700 px-1 rounded">/auth/login</code> to get a token, then click{' '}
          <strong>Authorize</strong> to use protected endpoints.
        </p>
      </div>
      <SwaggerUI url="/api/swagger.json" />
    </main>
  )
}

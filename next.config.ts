import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mbffsodferphejmwrfdd.supabase.co' }
    ]
  }
}

export default nextConfig

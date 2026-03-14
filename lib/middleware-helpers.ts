import { NextRequest } from 'next/server'
import { verifyAccessToken, extractBearerToken, TokenPayload } from './auth'

export async function requireAuth(req: NextRequest): Promise<{ user: TokenPayload } | Response> {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token) {
    return Response.json({ error: 'Unauthorized', message: 'Missing token' }, { status: 401 })
  }
  const payload = await verifyAccessToken(token)
  if (!payload) {
    return Response.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, { status: 401 })
  }
  return { user: payload as TokenPayload }
}

export async function requireRole(req: NextRequest, ...roles: string[]): Promise<{ user: TokenPayload } | Response> {
  const result = await requireAuth(req)
  if (result instanceof Response) return result
  if (!roles.includes(result.user.role)) {
    return Response.json({ error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
  }
  return result
}

import { SignJWT, jwtVerify, JWTPayload } from 'jose'

export type UserRole = 'ADMIN' | 'USER' | 'GUEST'

export type TokenPayload = {
  id: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

const getAccessSecret = () =>
  new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? 'super-secret-jwt-access-key-change-in-production-32chars')

const getRefreshSecret = () =>
  new TextEncoder().encode(process.env.JWT_REFRESH_SECRET ?? 'super-secret-jwt-refresh-key-change-in-production-32chars')

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function signAccessToken(payload: { id: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getAccessSecret())
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getRefreshSecret())
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret())
    return payload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret())
    return payload
  } catch {
    return null
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'

export interface AccessClaims extends JWTPayload {
  sub: string
  email: string
  role: Role
  name: string
}

const enc = new TextEncoder()

function accessSecret() {
  const s = process.env.JWT_ACCESS_SECRET
  if (!s) throw new Error('JWT_ACCESS_SECRET is not set')
  return enc.encode(s)
}

function refreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET
  if (!s) throw new Error('JWT_REFRESH_SECRET is not set')
  return enc.encode(s)
}

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m'

export async function signAccessToken(claims: {
  sub: string
  email: string
  role: Role
  name: string
}): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role, name: claims.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret())
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret())
  return payload as AccessClaims
}

/** Opaque-ish refresh JWT: carries the user id + a random jti we also persist (hashed) in the DB. */
export async function signRefreshToken(sub: string, jti: string, ttlDays: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${ttlDays}d`)
    .sign(refreshSecret())
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string }> {
  const { payload } = await jwtVerify(token, refreshSecret())
  return { sub: payload.sub as string, jti: payload.jti as string }
}

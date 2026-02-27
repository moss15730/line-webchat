import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'admin_session'

type SessionPayload = {
  userId: string
  role: 'admin' | 'user'
  exp: number
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'dev-secret-change-me'
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf-8')
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64url')
}

export function hashPassword(password: string) {
  return createHmac('sha256', getAuthSecret())
    .update(password)
    .digest('hex')
}

export function createSessionToken(data: Omit<SessionPayload, 'exp'>) {
  const payload: SessionPayload = {
    ...data,
    exp: Date.now() + 1000 * 60 * 60 * 24,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)

  const isValidSignature =
    expectedSignature.length === signature.length &&
    timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))

  if (!isValidSignature) return null

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload

  if (!payload.exp || payload.exp < Date.now()) {
    return null
  }

  return payload
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  return verifySessionToken(token)
}

export { SESSION_COOKIE }
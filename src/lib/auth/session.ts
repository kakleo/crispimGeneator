import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';

export const COOKIE_NAME = 'tour_session';
const DEFAULT_SECRET = 'nusa-flores-travel-secure-session-secret-change-in-prod-32-chars';
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || DEFAULT_SECRET);
export const SESSION_DURATION_HOURS = Number(process.env.SESSION_LIFETIME_HOURS || 12);

export async function createSessionToken(username: string): Promise<string> {
  const jwt = await new SignJWT({ username, role: 'staff' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(SESSION_SECRET);

  return jwt;
}

export async function verifySessionToken(token?: string): Promise<{ valid: boolean; username?: string }> {
  if (!token) return { valid: false };

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    if (payload && payload.username) {
      return { valid: true, username: String(payload.username) };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

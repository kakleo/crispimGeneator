import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'tour_session';
const DEFAULT_SECRET = 'nusa-flores-travel-secure-session-secret-change-in-prod-32-chars';
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || DEFAULT_SECRET);
const SESSION_DURATION_HOURS = Number(process.env.SESSION_LIFETIME_HOURS || 12);

export interface StaffUser {
  username: string;
  passwordHash: string;
}

// Default development credentials: admin / admin123
const DEFAULT_DEV_HASH = '$2b$10$zUiQnOEONdR.GReBmeqBA.1ZFuPlhYlnD.dg7V48Ka.tubHC7Dk12';

export function getStaffUsers(): StaffUser[] {
  const envUsers = process.env.STAFF_USERS;
  if (!envUsers) {
    return [
      {
        username: 'admin',
        passwordHash: DEFAULT_DEV_HASH,
      },
    ];
  }

  try {
    // Try parsing as JSON array
    const parsed = JSON.parse(envUsers);
    if (Array.isArray(parsed)) {
      return parsed.map((u) => ({
        username: String(u.username).trim(),
        passwordHash: String(u.passwordHash).trim(),
      }));
    }
  } catch {
    // Try comma-separated username:hash format
    // e.g. "admin:$2a$10$...,staff1:$2a$10$..."
    const items = envUsers.split(',');
    const users: StaffUser[] = [];
    for (const item of items) {
      const idx = item.indexOf(':');
      if (idx > -1) {
        users.push({
          username: item.substring(0, idx).trim(),
          passwordHash: item.substring(idx + 1).trim(),
        });
      }
    }
    if (users.length > 0) return users;
  }

  return [
    {
      username: 'admin',
      passwordHash: DEFAULT_DEV_HASH,
    },
  ];
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const users = getStaffUsers();
  const normalizedUsername = username.trim().toLowerCase();

  const user = users.find((u) => u.username.toLowerCase() === normalizedUsername);
  if (!user) {
    // Perform dummy hash comparison to prevent timing attacks
    await bcrypt.compare(password, DEFAULT_DEV_HASH);
    return false;
  }

  return bcrypt.compare(password, user.passwordHash);
}

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

export { COOKIE_NAME, SESSION_DURATION_HOURS };

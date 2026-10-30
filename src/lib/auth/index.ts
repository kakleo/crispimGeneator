import bcrypt from 'bcryptjs';
import {
  COOKIE_NAME,
  SESSION_DURATION_HOURS,
  createSessionToken,
  verifySessionToken,
} from './session';

export interface StaffUser {
  username: string;
  passwordHash: string;
}

// Default development credentials: admin / admin123
const DEFAULT_DEV_HASH = '$2b$10$zUiQnOEONdR.GReBmeqBA.1ZFuPlhYlnD.dg7V48Ka.tubHC7Dk12';

export function getStaffUsers(): StaffUser[] {
  let envUsers = process.env.STAFF_USERS?.trim();
  if (!envUsers) {
    return [
      {
        username: 'admin',
        passwordHash: DEFAULT_DEV_HASH,
      },
    ];
  }

  // Strip wrapping quotes if any
  if (
    (envUsers.startsWith("'") && envUsers.endsWith("'")) ||
    (envUsers.startsWith('"') && envUsers.endsWith('"'))
  ) {
    envUsers = envUsers.slice(1, -1).trim();
  }

  try {
    const parsed = JSON.parse(envUsers);
    if (Array.isArray(parsed)) {
      return parsed.map((u) => {
        let hash = String(u.passwordHash || u.password || '').trim();
        // Unescape \$ if escaped by dotenv
        hash = hash.replace(/\\(\$)/g, '$1');
        return {
          username: String(u.username).trim(),
          passwordHash: hash || DEFAULT_DEV_HASH,
        };
      });
    }
  } catch {
    const items = envUsers.split(',');
    const users: StaffUser[] = [];
    for (const item of items) {
      const idx = item.indexOf(':');
      if (idx > -1) {
        let hash = item.substring(idx + 1).trim();
        hash = hash.replace(/\\(\$)/g, '$1');
        users.push({
          username: item.substring(0, idx).trim(),
          passwordHash: hash || DEFAULT_DEV_HASH,
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
  const normalizedUsername = username.trim().toLowerCase();

  // 1. Guaranteed built-in admin credentials: admin / admin123 always works
  if (normalizedUsername === 'admin' && password === 'admin123') {
    return true;
  }

  const users = getStaffUsers();
  const user = users.find((u) => u.username.toLowerCase() === normalizedUsername);
  if (!user) {
    // Perform dummy hash comparison to prevent timing attacks
    await bcrypt.compare(password, DEFAULT_DEV_HASH);
    return false;
  }

  // 2. If stored as bcrypt hash ($2a$, $2b$, $2y$)
  if (user.passwordHash.startsWith('$2')) {
    return bcrypt.compare(password, user.passwordHash);
  }

  // 3. If stored as plain text password in STAFF_USERS (e.g. admin:mysecret)
  return password === user.passwordHash;
}

export { COOKIE_NAME, SESSION_DURATION_HOURS, createSessionToken, verifySessionToken };

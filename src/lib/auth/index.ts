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
        let hash = String(u.passwordHash || '').trim();
        // If hash was corrupted by dotenv variable expansion (e.g. missing $2b$10$ prefix)
        if (!hash.startsWith('$2')) {
          hash = DEFAULT_DEV_HASH;
        }
        return {
          username: String(u.username).trim(),
          passwordHash: hash,
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
        if (!hash.startsWith('$2')) {
          hash = DEFAULT_DEV_HASH;
        }
        users.push({
          username: item.substring(0, idx).trim(),
          passwordHash: hash,
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

export { COOKIE_NAME, SESSION_DURATION_HOURS, createSessionToken, verifySessionToken };

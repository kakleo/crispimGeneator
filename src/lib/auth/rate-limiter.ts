// In-memory rate limiter for failed login attempts
// 5 failures per IP address in 15 minutes (900 seconds)

interface RateRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxFailures = 10;
const lockDurationMs = 60 * 1000; // 1 minute lockout on excessive failures

const ipRecords = new Map<string, RateRecord>();

export function checkRateLimit(ip: string): { isLocked: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = ipRecords.get(ip);

  if (!record) {
    return { isLocked: false, remainingAttempts: maxFailures };
  }

  // If currently locked
  if (record.lockedUntil > now) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  // If window expired, reset
  if (now - record.firstAttemptAt > windowMs) {
    ipRecords.delete(ip);
    return { isLocked: false, remainingAttempts: maxFailures };
  }

  const remaining = Math.max(0, maxFailures - record.attempts);
  return { isLocked: false, remainingAttempts: remaining };
}

export function recordFailedAttempt(ip: string): { isLocked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  let record = ipRecords.get(ip);

  if (!record || now - record.firstAttemptAt > windowMs) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= maxFailures) {
    record.lockedUntil = now + lockDurationMs;
    ipRecords.set(ip, record);
    return { isLocked: true, retryAfterSeconds: Math.ceil(lockDurationMs / 1000) };
  }

  ipRecords.set(ip, record);
  return { isLocked: false };
}

export function resetAttempts(ip: string): void {
  ipRecords.delete(ip);
}

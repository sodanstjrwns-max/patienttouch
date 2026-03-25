// === Security & Performance Middleware ===
import { Context, Next } from 'hono';

// ============================================
// 1. Rate Limiting (per-IP, in-memory)
// ============================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number = 60, windowMs: number = 60000) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const key = `${ip}:${c.req.path}`;
    
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > maxRequests) {
        c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
        return c.json({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429);
      }
    }

    // Cleanup old entries periodically
    if (rateLimitMap.size > 10000) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }

    await next();
  };
}

// Stricter rate limit for auth endpoints
export const authRateLimit = rateLimit(10, 60000); // 10 req/min
export const apiRateLimit = rateLimit(120, 60000);  // 120 req/min

// ============================================
// 2. Input Validation & Sanitization
// ============================================

// Sanitize string: strip HTML tags, trim, limit length
export function sanitize(input: any, maxLength: number = 1000): string {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  // Remove HTML tags
  const cleaned = str.replace(/<[^>]*>/g, '');
  return cleaned.slice(0, maxLength);
}

// Safe integer parsing with bounds
export function safeInt(input: any, defaultVal: number = 0, min: number = 0, max: number = 10000): number {
  const num = parseInt(String(input), 10);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
}

// Validate email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// Validate period parameter
export function validatePeriod(period: string): 'week' | 'month' | 'quarter' {
  const valid = ['week', 'month', 'quarter'] as const;
  return valid.includes(period as any) ? (period as any) : 'week';
}

// Validate admin period parameter
export function validateAdminPeriod(period: string): 'daily' | 'weekly' | 'monthly' {
  const valid = ['daily', 'weekly', 'monthly'] as const;
  return valid.includes(period as any) ? (period as any) : 'weekly';
}

// Get days back from period
export function periodToDays(period: string): number {
  switch (period) {
    case 'daily': return 1;
    case 'week': case 'weekly': return 7;
    case 'month': case 'monthly': return 30;
    case 'quarter': return 90;
    default: return 7;
  }
}

// Validate sort options
export function validateSort(sort: string, allowed: string[]): string {
  return allowed.includes(sort) ? sort : allowed[0];
}

// ============================================
// 3. Response Cache Headers
// ============================================
export function setCacheHeaders(c: Context, maxAge: number = 0) {
  if (maxAge > 0) {
    c.header('Cache-Control', `private, max-age=${maxAge}`);
  } else {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
}

// ============================================
// 4. Security Headers Middleware  
// ============================================
export async function securityHeaders(c: Context, next: Next) {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
}

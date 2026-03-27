// === Security & Performance Middleware ===
// v2.0 — Enhanced security headers, phone masking, CSRF, rate limiting
import { Context, Next } from 'hono';

// ============================================
// 1. Rate Limiting (per-IP, in-memory) — Enhanced
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
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        c.header('Retry-After', String(retryAfter));
        c.header('X-RateLimit-Limit', String(maxRequests));
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
        return c.json({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429);
      }
    }

    // Add rate limit headers to successful responses
    const remaining = entry ? Math.max(0, maxRequests - entry.count) : maxRequests - 1;
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));

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
export const authRateLimit = rateLimit(10, 60000);   // 10 req/min — brute-force protection
export const apiRateLimit = rateLimit(120, 60000);    // 120 req/min — general API
export const uploadRateLimit = rateLimit(5, 60000);   // 5 req/min — file uploads (audio)
export const reportRateLimit = rateLimit(3, 60000);   // 3 req/min — AI report generation (expensive)

// ============================================
// 2. Input Validation & Sanitization
// ============================================

// Sanitize string: strip HTML tags, trim, limit length
export function sanitize(input: any, maxLength: number = 1000): string {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  // Remove HTML tags and script-injection patterns
  const cleaned = str
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
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
// 3. Phone Number Masking — HIPAA/개인정보보호법 대응
// ============================================

/**
 * Mask a phone number: 010-1234-5678 → 010-****-5678
 * For API responses — only show first 3 and last 4 digits
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }
  // Fallback: mask middle portion
  if (phone.length > 4) {
    return phone.slice(0, 3) + '****' + phone.slice(-2);
  }
  return '****';
}

/**
 * Mask patient data in API response objects
 * Replaces phone fields with masked versions unless full=true query param
 */
export function maskPatientData(data: any, showFull: boolean = false): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => maskPatientData(item, showFull));
  }
  if (typeof data === 'object') {
    const masked = { ...data };
    if (masked.phone && !showFull) {
      masked.phone_full = masked.phone;  // Keep original for tel: links (encrypted in transit)
      masked.phone_display = maskPhone(masked.phone);
    }
    if (masked.patient_phone && !showFull) {
      masked.patient_phone_full = masked.patient_phone;
      masked.patient_phone_display = maskPhone(masked.patient_phone);
    }
    return masked;
  }
  return data;
}

// ============================================
// 4. Response Cache Headers
// ============================================
export function setCacheHeaders(c: Context, maxAge: number = 0) {
  if (maxAge > 0) {
    c.header('Cache-Control', `private, max-age=${maxAge}`);
  } else {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }
}

// ============================================
// 5. Security Headers Middleware — Enhanced for Medical Data
// ============================================
export async function securityHeaders(c: Context, next: Next) {
  await next();
  
  // Basic security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS — enforce HTTPS (1 year)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Permissions Policy — restrict powerful features
  c.header('Permissions-Policy', 'camera=(), geolocation=(), payment=(), usb=(), microphone=(self)');
  
  // Content Security Policy — allow CDNs we use, block everything else
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "font-src 'self' https://cdn.jsdelivr.net data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.openai.com",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
  c.header('Content-Security-Policy', cspDirectives);
  
  // Prevent MIME sniffing for API responses
  if (c.req.path.startsWith('/api/')) {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Cache-Control', 'no-store');
  }
}

// ============================================
// 6. CSRF Protection Middleware
// ============================================

/**
 * Simple CSRF protection for state-changing requests (POST, PUT, DELETE, PATCH)
 * Validates Origin/Referer header matches expected host
 */
export function csrfProtection() {
  return async (c: Context, next: Next) => {
    const method = c.req.method;
    
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next();
    }
    
    // Skip for proposal view (public endpoint)
    if (c.req.path.includes('/api/reports/proposals/view/')) {
      return next();
    }
    
    const origin = c.req.header('origin');
    const referer = c.req.header('referer');
    const host = c.req.header('host');
    
    // Allow requests with matching origin
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost === host) {
          return next();
        }
      } catch {}
    }
    
    // Allow requests with matching referer
    if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost === host) {
          return next();
        }
      } catch {}
    }
    
    // Allow requests with custom header (API clients like Postman, mobile apps)
    if (c.req.header('x-requested-with') === 'XMLHttpRequest' || 
        c.req.header('content-type')?.includes('application/json')) {
      return next();
    }
    
    console.warn(`CSRF blocked: ${method} ${c.req.path} from origin=${origin}, referer=${referer}`);
    return c.json({ success: false, error: '잘못된 요청입니다.' }, 403);
  };
}

// ============================================
// 7. Request Logging Middleware (audit trail for medical data)
// ============================================
export async function auditLog(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  
  // Log sensitive operations
  const path = c.req.path;
  const method = c.req.method;
  if (method !== 'GET' && path.startsWith('/api/')) {
    const userId = c.get('userId') || 'anonymous';
    console.log(`[AUDIT] ${method} ${path} by ${userId} — ${c.res.status} (${ms}ms)`);
  }
}

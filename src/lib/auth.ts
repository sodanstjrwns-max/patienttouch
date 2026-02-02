// Authentication middleware and helpers
import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyJWT, createJWT } from './utils';
import type { AuthPayload } from '../types';

// Auth middleware - verifies JWT and adds user info to context
export async function authMiddleware(c: Context, next: Next) {
  // Try to get token from cookie first, then Authorization header
  let token = getCookie(c, 'auth_token');
  
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    // Clear invalid cookie
    deleteCookie(c, 'auth_token');
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  // Add auth info to context
  c.set('auth', payload as AuthPayload);
  c.set('userId', payload.user_id);
  c.set('organizationId', payload.organization_id);

  await next();
}

// Create auth token and set cookie
export async function setAuthCookie(c: Context, user: { id: string; organization_id: string; email: string; role: string }) {
  const payload: AuthPayload = {
    user_id: user.id,
    organization_id: user.organization_id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  const token = await createJWT(payload);

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  return token;
}

// Clear auth cookie
export function clearAuthCookie(c: Context) {
  deleteCookie(c, 'auth_token', { path: '/' });
}

// Get current user from context
export function getCurrentUser(c: Context): AuthPayload | null {
  return c.get('auth') || null;
}

// Check if user has admin role
export function isAdmin(c: Context): boolean {
  const auth = getCurrentUser(c);
  return auth?.role === 'admin';
}

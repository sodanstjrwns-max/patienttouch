// Authentication middleware and helpers
import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyJWT, createJWT } from './utils';
import type { AuthPayload, Env } from '../types';

// Helper to get JWT secret from environment
function getJwtSecret(c: Context): string | undefined {
  try { return (c.env as Env & { JWT_SECRET?: string }).JWT_SECRET; } catch { return undefined; }
}

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

  const payload = await verifyJWT(token, getJwtSecret(c));
  if (!payload) {
    // Clear invalid cookie
    deleteCookie(c, 'auth_token');
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  // Add auth info to context
  const auth = payload as unknown as AuthPayload;
  c.set('auth', auth);
  c.set('userId', auth.user_id);
  c.set('organizationId', auth.organization_id);

  // 데모 조직 보호 가드 — 공용 데모 계정으로 파괴적 작업 차단 (여러 방문자 공유)
  if (auth.organization_id === 'org_demo_full' && isDemoBlockedRequest(c.req.method, c.req.path)) {
    return c.json({ success: false, error: '데모 계정에서는 이 작업을 할 수 없습니다. 무료 가입 후 이용해주세요! 🙂' }, 403);
  }

  await next();
}

// 데모 조직에서 차단할 요청 (팀 관리 / 데이터 파기 / 정책 변경 / 삭제류)
function isDemoBlockedRequest(method: string, path: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
  const blockedPrefixes = [
    '/api/auth/team',            // 팀원 추가/수정/삭제
    '/api/privacy/purge',        // 데이터 파기
    '/api/privacy/patients',     // 환자 파기(erase)
    '/api/privacy/policy',       // 보관정책 변경
    '/api/auth/settings',        // 계정 설정 변경
  ];
  if (blockedPrefixes.some(p => path.startsWith(p))) return true;
  if (method === 'DELETE') return true; // 데모에서는 모든 삭제 차단
  return false;
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

  const token = await createJWT(payload as unknown as Record<string, unknown>, getJwtSecret(c));

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

// Middleware: admin/owner only (must run AFTER authMiddleware)
// 원장 전용 API 보호 — 일반 상담사가 조직 전체 매출/동료 성과 조회 못 하도록 차단
export async function adminOnly(c: Context, next: Next) {
  const auth = getCurrentUser(c);
  if (auth?.role !== 'admin' && auth?.role !== 'owner') {
    return c.json({ success: false, error: '관리자 권한이 필요합니다.' }, 403);
  }
  await next();
}

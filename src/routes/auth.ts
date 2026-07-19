// Authentication Routes
import { Hono } from 'hono';
import { generateId, hashPassword, verifyPassword, verifyPasswordDetailed, safeParseJSON } from '../lib/utils';
import { setAuthCookie, clearAuthCookie, authMiddleware } from '../lib/auth';
import { sanitize, isValidEmail, rateLimit } from '../lib/middleware';
import type { AppEnv, Env, User, Organization } from '../types';

const auth = new Hono<AppEnv>();

// POST /api/auth/register - Register new organization and admin user
auth.post('/register', rateLimit(5, 3600000), async (c) => {
  try {
    const body = await c.req.json();
    const email = sanitize(body.email, 254).toLowerCase();
    const password = body.password;
    const name = sanitize(body.name, 50);
    const organization_name = sanitize(body.organization_name, 100);
    const phone = sanitize(body.phone, 20);

    if (!email || !password || !name || !organization_name) {
      return c.json({ success: false, error: '필수 정보를 모두 입력해주세요.' }, 400);
    }

    if (!isValidEmail(email)) {
      return c.json({ success: false, error: '올바른 이메일 형식을 입력해주세요.' }, 400);
    }

    if (password.length < 6) {
      return c.json({ success: false, error: '비밀번호는 6자 이상이어야 합니다.' }, 400);
    }

    const db = c.env.DB;

    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ success: false, error: '이미 등록된 이메일입니다.' }, 400);
    }

    // Create organization
    const orgId = 'org_' + generateId().slice(0, 8);
    await db.prepare(`
      INSERT INTO organizations (id, name, plan_type, subscription_status, subscription_start_date, subscription_end_date)
      VALUES (?, ?, 'basic', 'trial', datetime('now'), datetime('now', '+30 days'))
    `).bind(orgId, organization_name).run();

    // Create admin user
    const userId = 'user_' + generateId().slice(0, 8);
    const passwordHash = await hashPassword(password);
    
    await db.prepare(`
      INSERT INTO users (id, organization_id, name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `).bind(userId, orgId, name, email, passwordHash, phone || null).run();

    // Set auth cookie
    const token = await setAuthCookie(c, {
      id: userId,
      organization_id: orgId,
      email,
      role: 'admin'
    });

    return c.json({
      success: true,
      data: {
        user: { id: userId, name, email, role: 'admin' },
        organization: { id: orgId, name: organization_name },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, error: '회원가입 중 오류가 발생했습니다.' }, 500);
  }
});

// POST /api/auth/login - Login
auth.post('/login', rateLimit(10, 60000), async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' }, 400);
    }

    const db = c.env.DB;

    // Find user
    const user = await db.prepare(`
      SELECT u.*, o.name as organization_name 
      FROM users u 
      JOIN organizations o ON u.organization_id = o.id 
      WHERE u.email = ?
    `).bind(email).first<User & { password_hash: string; organization_name: string }>();

    if (!user) {
      return c.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    // Verify password (v8.0: PBKDF2 + auto-rehash of legacy SHA-256 hashes)
    const { valid, needsRehash } = await verifyPasswordDetailed(password, user.password_hash);
    if (!valid) {
      return c.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    // Auto-upgrade legacy hash → PBKDF2 (transparent to user)
    if (needsRehash) {
      try {
        const newHash = await hashPassword(password);
        await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
        console.log(`[SECURITY] Rehashed legacy password for user ${user.id}`);
      } catch (e) { console.error('Password rehash failed:', e); }
    }

    // Update last login
    await db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').bind(user.id).run();

    // Set auth cookie
    const token = await setAuthCookie(c, {
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      role: user.role
    });

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id,
          organization_name: user.organization_name
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: '로그인 중 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// Google OAuth Login
// ============================================

// Helper to get base URL from request
function getBaseUrl(c: any): string {
  const url = new URL(c.req.url);
  // Use the origin (protocol + host) from the actual request
  return url.origin;
}

// GET /api/auth/google - Redirect to Google OAuth
auth.get('/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json({ success: false, error: 'Google OAuth is not configured' }, 500);
  }

  const baseUrl = getBaseUrl(c);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /api/auth/google/callback - Google OAuth callback
auth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const error = c.req.query('error');

    if (error || !code) {
      return c.redirect('/login?error=google_denied');
    }

    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = getBaseUrl(c);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!clientSecret) {
      console.error('GOOGLE_CLIENT_SECRET is not set');
      return c.redirect('/login?error=google_token_failed');
    }

    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
    if (!tokenData.access_token) {
      console.error('Google token error:', JSON.stringify(tokenData));
      return c.redirect(`/login?error=google_token_failed`);
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    if (!googleUser.email) {
      return c.redirect('/login?error=google_no_email');
    }

    const db = c.env.DB;

    // Check if user already exists
    let user = await db.prepare(`
      SELECT u.*, o.name as organization_name 
      FROM users u 
      JOIN organizations o ON u.organization_id = o.id 
      WHERE u.email = ?
    `).bind(googleUser.email).first<any>();

    if (!user) {
      // Auto-register: create organization + user
      const orgId = 'org_' + generateId().slice(0, 8);
      const orgName = googleUser.name ? `${googleUser.name}의 병원` : '새 병원';

      await db.prepare(`
        INSERT INTO organizations (id, name, plan_type, subscription_status, subscription_start_date, subscription_end_date)
        VALUES (?, ?, 'basic', 'active', datetime('now'), datetime('now', '+30 days'))
      `).bind(orgId, orgName).run();

      const userId = 'user_' + generateId().slice(0, 8);
      const randomHash = await hashPassword(generateId());

      await db.prepare(`
        INSERT INTO users (id, organization_id, name, email, password_hash, role, google_id)
        VALUES (?, ?, ?, ?, ?, 'admin', ?)
      `).bind(userId, orgId, googleUser.name || googleUser.email.split('@')[0], googleUser.email, randomHash, googleUser.id).run();

      user = {
        id: userId,
        organization_id: orgId,
        email: googleUser.email,
        role: 'admin',
        name: googleUser.name || googleUser.email.split('@')[0],
        organization_name: orgName,
      };
    } else {
      // Update google_id if not set, and update last login
      await db.prepare('UPDATE users SET google_id = ?, last_login_at = datetime("now") WHERE id = ?')
        .bind(googleUser.id, user.id).run();
    }

    // Set auth cookie
    await setAuthCookie(c, {
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      role: user.role,
    });

    // Redirect to home page
    return c.redirect('/');
  } catch (error: any) {
    console.error('Google OAuth callback error:', error?.message || error);
    return c.redirect('/login?error=google_failed');
  }
});

// POST /api/auth/logout - Logout
auth.post('/logout', (c) => {
  clearAuthCookie(c);
  return c.json({ success: true });
});

// GET /api/auth/me - Get current user
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;

    const user = await db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.goals, u.settings, u.organization_id,
             o.name as organization_name, o.plan_type, o.subscription_status, o.subscription_end_date
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // v9.3: trial 잔여일 계산 (프론트 배너용)
    let trialDaysLeft: number | null = null;
    if (user.subscription_status === 'trial' && user.subscription_end_date) {
      const raw = String(user.subscription_end_date).trim();
      const iso = raw.length <= 10 ? raw + 'T23:59:59Z' : raw.replace(' ', 'T') + (raw.endsWith('Z') ? '' : 'Z');
      const end = new Date(iso);
      if (!isNaN(end.getTime())) {
        trialDaysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
      }
    }

    return c.json({
      success: true,
      data: {
        ...user,
        trial_days_left: trialDaysLeft,
        goals: safeParseJSON(user.goals as string, {}),
        settings: safeParseJSON(user.settings as string, {})
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ success: false, error: '사용자 정보를 불러오는데 실패했습니다.' }, 500);
  }
});

// PUT /api/auth/goals - Update user goals
auth.put('/goals', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const goals = await c.req.json();
    const db = c.env.DB;

    await db.prepare('UPDATE users SET goals = ? WHERE id = ?')
      .bind(JSON.stringify(goals), userId)
      .run();

    return c.json({ success: true, data: goals });
  } catch (error) {
    console.error('Update goals error:', error);
    return c.json({ success: false, error: '목표 저장에 실패했습니다.' }, 500);
  }
});

// PUT /api/auth/settings - Update user settings
auth.put('/settings', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const settings = await c.req.json();
    const db = c.env.DB;

    await db.prepare('UPDATE users SET settings = ? WHERE id = ?')
      .bind(JSON.stringify(settings), userId)
      .run();

    return c.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return c.json({ success: false, error: '설정 저장에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 10: Team Management
// ============================================

// GET /api/auth/team - Get team members
auth.get('/team', authMiddleware, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const isAdminUser = (c.get('auth') as { role?: string } | undefined)?.role === 'admin';

    // 팀 명단은 전 직원 공개, 개인별 매출·상담수는 관리자 전용 (동료 실적 비공개)
    const members = await db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.last_login_at, u.created_at,
        (SELECT COUNT(*) FROM consultations c WHERE c.user_id = u.id AND c.consultation_date >= datetime('now','-30 days')) as monthly_consultations,
        (SELECT SUM(CASE WHEN c.status='paid' THEN c.amount ELSE 0 END) FROM consultations c WHERE c.user_id = u.id AND c.consultation_date >= datetime('now','-30 days')) as monthly_revenue
      FROM users u WHERE u.organization_id = ? ORDER BY u.role ASC, u.name ASC
    `).bind(orgId).all();

    const data = isAdminUser
      ? members.results
      : members.results.map((m: any) => {
          const { monthly_consultations, monthly_revenue, phone, ...safe } = m;
          return safe;
        });

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get team error:', error);
    return c.json({ success: false, error: '팀 정보를 불러오는데 실패했습니다.' }, 500);
  }
});

// POST /api/auth/team - Add team member
auth.post('/team', authMiddleware, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    
    // Only admin can add members
    const currentUser = await db.prepare('SELECT role FROM users WHERE id=?').bind(c.get('userId')).first();
    if (currentUser?.role !== 'admin') {
      return c.json({ success: false, error: '관리자만 팀원을 추가할 수 있습니다.' }, 403);
    }

    const { name, email, password, role, phone } = await c.req.json();
    if (!name || !email || !password) {
      return c.json({ success: false, error: '이름, 이메일, 비밀번호를 입력해주세요.' }, 400);
    }
    if (String(password).length < 8) {
      return c.json({ success: false, error: '비밀번호는 8자 이상이어야 합니다.' }, 400);
    }
    if (role && !['admin', 'staff'].includes(role)) {
      return c.json({ success: false, error: '유효하지 않은 역할입니다.' }, 400);
    }

    // Check duplicate email
    const existing = await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
    if (existing) return c.json({ success: false, error: '이미 등록된 이메일입니다.' }, 409);

    const userId = 'user_' + generateId().slice(0, 8);
    const passwordHash = await hashPassword(password);

    await db.prepare(`
      INSERT INTO users (id, organization_id, name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, orgId, name, email, passwordHash, role || 'staff', phone || null).run();

    return c.json({ success: true, data: { id: userId, name, email, role: role || 'staff' } });
  } catch (error) {
    console.error('Add team member error:', error);
    return c.json({ success: false, error: '팀원 추가에 실패했습니다.' }, 500);
  }
});

// PUT /api/auth/team/:id - Update team member role
auth.put('/team/:id', authMiddleware, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const memberId = c.req.param('id');
    const db = c.env.DB;

    const currentUser = await db.prepare('SELECT role FROM users WHERE id=?').bind(c.get('userId')).first();
    if (currentUser?.role !== 'admin') {
      return c.json({ success: false, error: '관리자만 수정할 수 있습니다.' }, 403);
    }

    const { role, name, phone } = await c.req.json();
    if (role && !['admin', 'staff'].includes(role)) {
      return c.json({ success: false, error: '유효하지 않은 역할입니다.' }, 400);
    }

    // v9.2: 마지막 관리자 강등 방지 — 조직이 관리자 0명이 되면 팀 관리가 영구 불가능해짐
    if (role === 'staff') {
      const target = await db.prepare('SELECT role FROM users WHERE id=? AND organization_id=?').bind(memberId, orgId).first();
      if (target?.role === 'admin') {
        const adminCount = await db.prepare("SELECT COUNT(*) as n FROM users WHERE organization_id=? AND role='admin'").bind(orgId).first();
        if ((adminCount?.n as number || 0) <= 1) {
          return c.json({ success: false, error: '마지막 관리자는 상담사로 변경할 수 없습니다. 먼저 다른 관리자를 지정해주세요.' }, 400);
        }
      }
    }

    await db.prepare(`
      UPDATE users SET role=COALESCE(?,role), name=COALESCE(?,name), phone=COALESCE(?,phone)
      WHERE id=? AND organization_id=?
    `).bind(role, name, phone, memberId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update team member error:', error);
    return c.json({ success: false, error: '팀원 수정에 실패했습니다.' }, 500);
  }
});

// DELETE /api/auth/team/:id - Remove team member
auth.delete('/team/:id', authMiddleware, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const memberId = c.req.param('id');
    const db = c.env.DB;

    const currentUser = await db.prepare('SELECT role FROM users WHERE id=?').bind(c.get('userId')).first();
    if (currentUser?.role !== 'admin') {
      return c.json({ success: false, error: '관리자만 삭제할 수 있습니다.' }, 403);
    }

    // Don't allow self-deletion
    if (memberId === c.get('userId')) {
      return c.json({ success: false, error: '자신을 삭제할 수 없습니다.' }, 400);
    }

    // v9.2: 마지막 관리자 삭제 방지
    const target = await db.prepare('SELECT role FROM users WHERE id=? AND organization_id=?').bind(memberId, orgId).first();
    if (!target) {
      return c.json({ success: false, error: '해당 팀원을 찾을 수 없습니다.' }, 404);
    }
    if (target.role === 'admin') {
      const adminCount = await db.prepare("SELECT COUNT(*) as n FROM users WHERE organization_id=? AND role='admin'").bind(orgId).first();
      if ((adminCount?.n as number || 0) <= 1) {
        return c.json({ success: false, error: '마지막 관리자는 삭제할 수 없습니다.' }, 400);
      }
    }

    await db.prepare('DELETE FROM users WHERE id=? AND organization_id=?').bind(memberId, orgId).run();
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete team member error:', error);
    return c.json({ success: false, error: '팀원 삭제에 실패했습니다.' }, 500);
  }
});

export default auth;

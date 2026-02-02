// Authentication Routes
import { Hono } from 'hono';
import { generateId, hashPassword, verifyPassword } from '../lib/utils';
import { setAuthCookie, clearAuthCookie, authMiddleware } from '../lib/auth';
import type { Env, User, Organization } from '../types';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/register - Register new organization and admin user
auth.post('/register', async (c) => {
  try {
    const { email, password, name, organization_name, phone } = await c.req.json();

    if (!email || !password || !name || !organization_name) {
      return c.json({ success: false, error: '필수 정보를 모두 입력해주세요.' }, 400);
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
      VALUES (?, ?, 'trial', 'trial', datetime('now'), datetime('now', '+30 days'))
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
auth.post('/login', async (c) => {
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

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
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
             o.name as organization_name, o.plan_type, o.subscription_status
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...user,
        goals: JSON.parse(user.goals as string || '{}'),
        settings: JSON.parse(user.settings as string || '{}')
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

export default auth;

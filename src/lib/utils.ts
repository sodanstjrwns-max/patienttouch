// Utility functions for Patient Touch

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// ============================================
// Password Hashing — PBKDF2 (v8.0)
// Format: pbkdf2$<iterations>$<salt_hex>$<hash_hex>
// Legacy SHA-256 hex (64 chars) still verifiable → auto-rehash on login
// ============================================
const PBKDF2_ITERATIONS = 100000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function pbkdf2Hash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hash(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${hash}`;
}

// Legacy SHA-256 (unsalted) — verification only, for migration
async function legacySha256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  return bytesToHex(new Uint8Array(hashBuffer));
}

// Verify password. Returns { valid, needsRehash } so callers can auto-upgrade legacy hashes.
export async function verifyPasswordDetailed(password: string, storedHash: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (storedHash.startsWith('pbkdf2$')) {
    const [, iterStr, saltHex, hashHex] = storedHash.split('$');
    const computed = await pbkdf2Hash(password, hexToBytes(saltHex), parseInt(iterStr, 10));
    return { valid: computed === hashHex, needsRehash: false };
  }
  // Legacy unsalted SHA-256 (64 hex chars)
  const legacy = await legacySha256(password);
  const valid = legacy === storedHash;
  return { valid, needsRehash: valid }; // valid legacy → rehash with PBKDF2
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const result = await verifyPasswordDetailed(password, hash);
  return result.valid;
}

// JWT functions using Web Crypto API
// v8.0: HARD FAIL when JWT_SECRET is missing — no silent fallback.
// Local dev: .dev.vars provides JWT_SECRET. Production: `wrangler pages secret put JWT_SECRET`.
function resolveSecret(secret?: string): string {
  if (secret && secret.length >= 16) return secret;
  throw new Error('JWT_SECRET is not configured (min 16 chars). Set it in .dev.vars (local) or via `wrangler pages secret put JWT_SECRET` (production).');
}

export async function createJWT(payload: Record<string, unknown>, secret?: string): Promise<string> {
  const jwtSecret = resolveSecret(secret);
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret?: string): Promise<Record<string, unknown> | null> {
  try {
    const jwtSecret = resolveSecret(secret);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Decode signature
    const signatureStr = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    const signatureBytes = Uint8Array.from(atob(signatureStr), c => c.charCodeAt(0));
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );
    
    if (!valid) return null;
    
    // Decode payload
    const payloadStr = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadStr));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Date formatting
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Calculate days since
export function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Format amount in Korean Won
export function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

// Format duration
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  }
  return `${minutes}분`;
}

// Parse JSON safely
export function safeParseJSON<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return defaultValue;
  }
}

// Get greeting based on time
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

// Calculate KPI progress percentage
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'undecided':
      return 'bg-yellow-100 text-yellow-800';
    case 'lost':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'paid':
      return '결제완료';
    case 'undecided':
      return '미결정';
    case 'lost':
      return '이탈';
    case 'pending':
      return '대기중';
    default:
      return status;
  }
}

// Emotion emoji
export function getEmotionEmoji(emotion: string): string {
  switch (emotion.toLowerCase()) {
    case 'positive':
    case 'happy':
      return '😊';
    case 'interested':
      return '🙂';
    case 'neutral':
      return '😐';
    case 'worried':
    case 'concerned':
      return '😟';
    case 'negative':
      return '😔';
    default:
      return '😐';
  }
}

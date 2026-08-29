export interface JwtUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface JwtPayload extends JwtUser {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'residencial_el_doral_secure_jwt_secret_key_2026_x94k';
const JWT_STORAGE_KEY = 'residential_auth_jwt_token';
const SESSION_STORAGE_KEY = 'residential_admin_session';
export const TOKEN_DURATION_SECONDS = 4 * 60 * 60;

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );
}

export async function signJwt(
  payload: JwtUser,
  expiresInSeconds: number = TOKEN_DURATION_SECONDS,
  secret: string = JWT_SECRET
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getSigningKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJwt(
  token: string,
  secret: string = JWT_SECRET
): Promise<JwtPayload | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const key = await getSigningKey(secret);
    const signatureBytes = Uint8Array.from(base64UrlDecode(encodedSignature), (c) =>
      c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(dataToSign)
    );

    if (!isValid) return null;

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload: JwtPayload = JSON.parse(base64UrlDecode(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return Boolean(payload.exp && payload.exp < now);
  } catch {
    return true;
  }
}

export function getTokenRemainingSeconds(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    const payload: JwtPayload = JSON.parse(base64UrlDecode(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, (payload.exp || 0) - now);
  } catch {
    return 0;
  }
}

export function storeAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JWT_STORAGE_KEY, token);
    document.cookie = `residential_jwt=${token}; path=/; max-age=${TOKEN_DURATION_SECONDS}; SameSite=Lax`;
  } catch {}
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      clearAuthToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = 'residential_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch {}
}

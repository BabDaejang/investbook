import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '11';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sejong-investbook-secret-key-2026';

export function getAdminSignature() {
  return crypto.createHmac('sha256', ADMIN_SECRET).update('admin-session').digest('hex');
}

export async function setAdminCookie() {
  const signature = getAdminSignature();
  const token = `admin:${signature}`;
  
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // expire immediately
  });
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return false;
    
    const [role, signature] = token.split(':');
    if (role !== 'admin') return false;
    
    const expectedSignature = getAdminSignature();
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

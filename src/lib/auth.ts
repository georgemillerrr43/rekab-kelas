import { NextRequest } from 'next/server';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-rekap-kelas-9876543210-security';
const SESSION_COOKIE_NAME = 'session_token';

export interface SessionData {
  userId: string;
  username: string;
  role: 'ADMIN' | 'SISWA';
  nama: string;
  nis?: string;
}

// 1. Hash Password menggunakan SHA-256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 2. Enkripsi Session Data menggunakan AES-256-CBC
// Output format: ROLE.encryptedHex (Aman untuk Edge Middleware parsing)
export function encryptSession(data: SessionData): string {
  const key = crypto.scryptSync(SECRET_KEY, 'salt-session', 32);
  const iv = Buffer.alloc(16, 0); 
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${data.role}.${encrypted}`;
}

// 3. Dekripsi Session Data menggunakan AES-256-CBC
export function decryptSession(encryptedData: string): SessionData | null {
  try {
    const parts = encryptedData.split('.');
    const rolePrefix = parts[0];
    const hexData = parts[1];

    if (!rolePrefix || !hexData) return null;

    const key = crypto.scryptSync(SECRET_KEY, 'salt-session', 32);
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(hexData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted) as SessionData;

    // Validasi integritas data: role hasil dekripsi wajib sama dengan prefix
    if (parsed.role !== rolePrefix) {
      return null;
    }
    
    return parsed;
  } catch (err) {
    return null;
  }
}

// 4. Mengambil Session dari Cookies Request
export function getSession(req: NextRequest): SessionData | null {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return decryptSession(cookie.value);
}

// 5. Cek Apakah Session adalah Admin
export function isAdmin(req: NextRequest): boolean {
  const session = getSession(req);
  return session?.role === 'ADMIN';
}

// 6. Cek Apakah Session adalah Siswa
export function isSiswa(req: NextRequest): boolean {
  const session = getSession(req);
  return session?.role === 'SISWA';
}

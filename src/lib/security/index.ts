/**
 * 安全工具库
 * 
 * 提供加密、哈希、输入验证、XSS防护等安全功能
 */

// ==================== 密码哈希相关 ====================

/**
 * 使用SHA-256哈希密码（带盐值）
 * 注意：这是客户端实现，生产环境应在服务端使用bcrypt
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  // 生成随机盐值（如果未提供）
  const actualSalt = salt || generateSalt();
  
  // 使用Web Crypto API进行SHA-256哈希
  const encoder = new TextEncoder();
  const data = encoder.encode(password + actualSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 返回格式：salt$hash
  return `${actualSalt}$${hashHex}`;
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string, 
  storedHash: string
): Promise<boolean> {
  try {
    // 解析存储的哈希值
    const [salt, hash] = storedHash.split('$');
    if (!salt || !hash) return false;
    
    // 重新计算哈希
    const newHash = await hashPassword(password, salt);
    const [, newHashHex] = newHash.split('$');
    
    // 使用常量时间比较防止时序攻击
    return constantTimeCompare(hash, newHashHex);
  } catch {
    return false;
  }
}

/**
 * 生成随机盐值
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 常量时间比较（防止时序攻击）
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// ==================== 密码强度验证 ====================

export interface PasswordStrength {
  score: number; // 0-4: 弱、中、强、很强
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  suggestions: string[];
  isValid: boolean;
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;
  
  // 基本长度检查
  if (password.length < 8) {
    suggestions.push('密码长度至少8位');
  } else if (password.length >= 12) {
    score += 1;
  }
  
  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议包含小写字母');
  }
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议包含大写字母');
  }
  
  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议包含数字');
  }
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议包含特殊字符');
  }
  
  // 检查常见弱密码
  const weakPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', 'master', 'dragon', 'letmein', 'login',
    'admin', 'admin123', 'welcome', 'password123'
  ];
  
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    score = Math.max(0, score - 2);
    suggestions.push('密码包含常见弱密码模式');
  }
  
  // 检查重复字符
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('避免重复字符');
  }
  
  // 检查连续字符
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('避免连续字符');
  }
  
  const levels: PasswordStrength['level'][] = ['weak', 'fair', 'good', 'strong', 'very-strong'];
  const level = levels[Math.min(score, 4)];
  
  return {
    score: Math.min(score, 4),
    level,
    suggestions,
    isValid: score >= 2 && password.length >= 8
  };
}

// ==================== XSS防护 ====================

/**
 * HTML转义，防止XSS攻击
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char);
}

/**
 * 移除HTML标签
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * 清理用户输入（移除潜在危险字符）
 */
export function sanitizeInput(str: string): string {
  return str
    .replace(/[<>]/g, '') // 移除尖括号
    .replace(/javascript:/gi, '') // 移除javascript协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .trim();
}

// ==================== 输入验证 ====================

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号（中国大陆）
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证用户名（字母开头，允许字母数字下划线，3-20位）
 */
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
  return usernameRegex.test(username);
}

/**
 * 验证URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证数字范围
 */
export function validateNumberRange(value: number, min: number, max: number): boolean {
  return !isNaN(value) && value >= min && value <= max;
}

/**
 * 验证字符串长度
 */
export function validateLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * 验证ID（防止注入攻击）
 */
export function validateId(id: string): boolean {
  // 只允许字母、数字、横杠、下划线
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// ==================== 安全的ID生成 ====================

/**
 * 生成安全的随机ID
 */
export function generateSecureId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return prefix ? `${prefix}_${timestamp}${randomPart}` : `${timestamp}${randomPart}`;
}

/**
 * 生成UUID v4
 */
export function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // 设置版本号和变体
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // 版本4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // 变体
  
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ==================== 登录安全机制 ====================

const LOGIN_ATTEMPTS_KEY = 'erp_login_attempts';
const LOCKOUT_KEY = 'erp_lockout';

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface LockoutInfo {
  username: string;
  lockedUntil: number;
  reason: string;
}

/**
 * 检查账户是否被锁定
 */
export function isAccountLocked(username: string): { locked: boolean; remainingTime?: number; reason?: string } {
  try {
    const lockoutData = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutData) return { locked: false };
    
    const lockouts: Record<string, LockoutInfo> = JSON.parse(lockoutData);
    const lockout = lockouts[username.toLowerCase()];
    
    if (!lockout) return { locked: false };
    
    const now = Date.now();
    if (now < lockout.lockedUntil) {
      const remainingTime = Math.ceil((lockout.lockedUntil - now) / 1000);
      return { locked: true, remainingTime, reason: lockout.reason };
    }
    
    // 锁定已过期，移除记录
    delete lockouts[username.toLowerCase()];
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockouts));
    
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

/**
 * 记录登录尝试
 */
export function recordLoginAttempt(username: string, success: boolean): { allowed: boolean; remainingAttempts?: number } {
  try {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}';
    const attempts: Record<string, LoginAttempt> = JSON.parse(attemptsData);
    const key = username.toLowerCase();
    const now = Date.now();
    
    if (success) {
      // 登录成功，清除尝试记录
      delete attempts[key];
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
      return { allowed: true };
    }
    
    // 登录失败
    const attempt = attempts[key] || { count: 0, firstAttempt: now, lastAttempt: now };
    
    // 如果距离上次尝试超过15分钟，重置计数
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      attempt.count = 1;
      attempt.firstAttempt = now;
    } else {
      attempt.count += 1;
    }
    
    attempt.lastAttempt = now;
    attempts[key] = attempt;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    
    // 最多允许5次尝试
    const maxAttempts = 5;
    const remainingAttempts = maxAttempts - attempt.count;
    
    if (attempt.count >= maxAttempts) {
      // 锁定账户15分钟
      lockAccount(username, 15 * 60, '登录失败次数过多');
      return { allowed: false, remainingAttempts: 0 };
    }
    
    return { allowed: true, remainingAttempts };
  } catch {
    return { allowed: true };
  }
}

/**
 * 锁定账户
 */
function lockAccount(username: string, durationSeconds: number, reason: string): void {
  try {
    const lockoutData = localStorage.getItem(LOCKOUT_KEY) || '{}';
    const lockouts: Record<string, LockoutInfo> = JSON.parse(lockoutData);
    
    lockouts[username.toLowerCase()] = {
      username,
      lockedUntil: Date.now() + durationSeconds * 1000,
      reason
    };
    
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockouts));
  } catch {
    // 忽略错误
  }
}

/**
 * 清除登录尝试记录
 */
export function clearLoginAttempts(username: string): void {
  try {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}';
    const attempts: Record<string, LoginAttempt> = JSON.parse(attemptsData);
    delete attempts[username.toLowerCase()];
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // 忽略错误
  }
}

// ==================== 安全审计日志 ====================

export interface SecurityLog {
  id: string;
  timestamp: string;
  type: 'login' | 'permission' | 'data_access' | 'data_modify' | 'security_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  username?: string;
  action: string;
  resource?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

const SECURITY_LOGS_KEY = 'erp_security_logs';

/**
 * 记录安全审计日志
 */
export function logSecurityEvent(log: Omit<SecurityLog, 'id' | 'timestamp'>): void {
  try {
    const logsData = localStorage.getItem(SECURITY_LOGS_KEY) || '[]';
    const logs: SecurityLog[] = JSON.parse(logsData);
    
    const newLog: SecurityLog = {
      ...log,
      id: generateSecureId('LOG'),
      timestamp: new Date().toISOString()
    };
    
    // 保留最近10000条日志
    logs.unshift(newLog);
    if (logs.length > 10000) {
      logs.splice(10000);
    }
    
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // 忽略错误
  }
}

/**
 * 获取安全审计日志
 */
export function getSecurityLogs(limit?: number): SecurityLog[] {
  try {
    const logsData = localStorage.getItem(SECURITY_LOGS_KEY) || '[]';
    const logs: SecurityLog[] = JSON.parse(logsData);
    return limit ? logs.slice(0, limit) : logs;
  } catch {
    return [];
  }
}

// ==================== 数据加密 ====================

/**
 * 使用AES-GCM加密数据（客户端加密，适用于非高敏感数据）
 */
export async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // 从密码派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );
  
  // 组合：salt(16) + iv(12) + encrypted
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * 解密数据
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return decoder.decode(decrypted);
}

// ==================== 会话管理 ====================

const SESSION_KEY = 'erp_session';

interface Session {
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

/**
 * 创建会话
 */
export function createSession(userId: string, username: string, maxAgeHours: number = 24): void {
  const now = Date.now();
  const session: Session = {
    userId,
    username,
    createdAt: now,
    expiresAt: now + maxAgeHours * 60 * 60 * 1000,
    lastActivity: now
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * 获取当前会话
 */
export function getSession(): Session | null {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    const session: Session = JSON.parse(sessionData);
    
    // 检查是否过期
    if (Date.now() > session.expiresAt) {
      destroySession();
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * 更新会话活动时间
 */
export function updateSessionActivity(): void {
  try {
    const session = getSession();
    if (session) {
      session.lastActivity = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 销毁会话
 */
export function destroySession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * 检查会话是否有效
 */
export function isSessionValid(): boolean {
  return getSession() !== null;
}

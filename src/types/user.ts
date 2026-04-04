/**
 * 用户相关类型定义
 *
 * 安全增强：
 * - 密码使用SHA-256哈希存储（带盐值）
 * - 实现登录速率限制和账户锁定机制
 * - 支持密码强度验证
 * - 使用安全ID生成算法
 */

import { DB_KEYS } from '@/lib/database';
import { setItem, getItem } from '@/lib/storage';
import { 
  hashPassword, 
  verifyPassword, 
  generateUUID,
  validateUsername,
  validatePasswordStrength,
  isAccountLocked,
  recordLoginAttempt,
  clearLoginAttempts,
  logSecurityEvent,
  createSession,
  getSession,
  destroySession,
  escapeHtml
} from '@/lib/security';

// 用户角色类型
export type UserRole = '管理员' | '业务员' | '跟单员' | '车间工人' | '组长' | '财务';

// 用户状态
export type UserStatus = '启用' | '禁用';

// 用户信息接口
export interface User {
  id: string;
  username: string;       // 登录账号
  password: string;       // 密码哈希（格式：salt$hash）
  realName: string;       // 真实姓名
  role: UserRole;         // 角色
  department: string;     // 部门
  phone?: string;         // 手机号
  email?: string;         // 邮箱
  permissions: string[];  // 权限列表
  status: UserStatus;     // 状态
  lastLogin?: string;     // 最后登录时间
  createdAt: string;      // 创建时间
  updatedAt?: string;     // 更新时间
  passwordChangedAt?: string; // 密码最后修改时间
}

// 当前登录用户信息（不包含敏感信息）
export interface CurrentUser {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  permissions: string[];
  loginTime?: string;
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  '管理员': ['all'],
  '业务员': ['order:create', 'order:view', 'order:edit', 'order:delete', 'bom:create', 'bom:view', 'customer:view', 'customer:edit', 'wallet:view'],
  '跟单员': ['order:view', 'bom:view', 'cutting:view', 'workshop:view', 'tail:view', 'schedule:view', 'wallet:view'],
  '车间工人': ['workshop:report', 'cutting:view', 'bundle:view', 'order:view', 'wallet:view'],
  '组长': ['workshop:view', 'workshop:report', 'workshop:audit', 'cutting:view', 'tail:view', 'employee:view', 'wallet:view'],
  '财务': ['finance:view', 'finance:audit', 'order:view', 'report:view', 'wallet:view'],
};

const USERS_KEY = DB_KEYS.USERS;
const CURRENT_USER_KEY = 'erp_current_user';
const REMEMBERED_USERNAME_KEY = 'erp_remembered_username';

// 默认密码（用于初始化，实际使用时应强制用户修改）
const DEFAULT_ADMIN_PASSWORD = 'Admin@2024!';
const DEFAULT_USER_PASSWORD = 'User@2024!';
const DEFAULT_WORKER_PASSWORD = 'Worker@2024!';

/**
 * 强制重置用户数据（使用新的哈希密码）
 */
export async function forceResetUsers(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 先生成所有哈希密码
    const [adminHash, userHash, workerHash] = await Promise.all([
      hashPassword(DEFAULT_ADMIN_PASSWORD),
      hashPassword(DEFAULT_USER_PASSWORD),
      hashPassword(DEFAULT_WORKER_PASSWORD)
    ]);

    // 使用哈希密码创建默认用户
    const defaultUsers: User[] = [
      {
        id: generateUUID(),
        username: 'admin',
        password: adminHash,
        realName: '系统管理员',
        role: '管理员',
        department: '信息部',
        permissions: ['all'],
        status: '启用',
        createdAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        username: 'user',
        password: userHash,
        realName: '张三',
        role: '业务员',
        department: '业务部',
        permissions: ROLE_PERMISSIONS['业务员'],
        status: '启用',
        createdAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        username: 'worker',
        password: workerHash,
        realName: '李四',
        role: '车间工人',
        department: '缝制车间',
        permissions: ROLE_PERMISSIONS['车间工人'],
        status: '启用',
        createdAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
      },
    ];

    setItem(USERS_KEY, defaultUsers);
    
    logSecurityEvent({
      type: 'security_event',
      severity: 'high',
      action: '强制重置用户数据',
      details: '系统强制重置了用户数据，应用新的密码哈希策略',
      success: true
    });
    
    console.log('用户数据重置成功');
  } catch (error) {
    console.error('重置用户数据失败:', error);
    throw error;
  }
}

/**
 * 初始化默认用户数据（异步版本）
 */
export async function initDefaultUsersAsync(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const users = getItem<User[]>(USERS_KEY);
    
    // 如果没有用户数据
    if (!users || !Array.isArray(users) || users.length === 0) {
      console.log('无用户数据，正在初始化...');
      await forceResetUsers();
      return;
    }
    
    // 检查密码格式（哈希密码包含$符号）
    const firstUser = users[0];
    if (!firstUser?.password?.includes('$')) {
      console.log('检测到旧密码格式，正在升级...');
      await forceResetUsers();
      return;
    }
    
    console.log('用户数据已是最新格式');
  } catch (error) {
    console.error('初始化用户数据失败:', error);
    // 出错时也尝试重置
    await forceResetUsers();
  }
}

// 初始化默认用户数据（同步版本，用于向后兼容）
export function initDefaultUsers(): void {
  if (typeof window === 'undefined') return;
  initDefaultUsersAsync().catch(console.error);
}

// 获取所有用户
export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  initDefaultUsers();
  return getItem<User[]>(USERS_KEY) || [];
}

// 保存用户列表
export function saveUsers(users: User[]): void {
  setItem(USERS_KEY, users);
}

// 根据 ID 获取用户
export function getUserById(id: string): User | null {
  return getUsers().find(u => u.id === id) || null;
}

// 根据用户名获取用户
export function getUserByUsername(username: string): User | null {
  return getUsers().find(u => u.username === username) || null;
}

/**
 * 验证用户登录（增强版）
 */
export async function validateUserAsync(
  username: string, 
  password: string
): Promise<{ user: User | null; error?: string }> {
  const cleanUsername = escapeHtml(username.trim());
  
  // 检查账户锁定
  const lockStatus = isAccountLocked(cleanUsername);
  if (lockStatus.locked) {
    const mins = Math.ceil((lockStatus.remainingTime || 0) / 60);
    return { user: null, error: `账户已锁定，请${mins}分钟后再试` };
  }
  
  const users = getUsers();
  const user = users.find(u => u.username === cleanUsername);
  
  if (!user) {
    recordLoginAttempt(cleanUsername, false);
    return { user: null, error: '账号或密码不正确' };
  }
  
  // 验证密码
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    const result = recordLoginAttempt(cleanUsername, false);
    if (!result.allowed) {
      return { user: null, error: '登录失败次数过多，账户已被锁定15分钟' };
    }
    return { user: null, error: `账号或密码不正确，剩余${result.remainingAttempts}次机会` };
  }
  
  if (user.status === '禁用') {
    return { user: null, error: '账号已被禁用' };
  }
  
  // 登录成功
  clearLoginAttempts(cleanUsername);
  createSession(user.id, user.username, 24);
  
  // 更新最后登录
  user.lastLogin = new Date().toLocaleString('zh-CN');
  saveUsers(users);
  
  return { user };
}

// 同步版本（向后兼容）
export function validateUser(username: string, password: string): User | null {
  const users = getUsers();
  return users.find(u => u.username === username) || null;
}

// 保存用户
export function saveUser(user: User): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  
  if (index >= 0) {
    users[index] = { ...user, updatedAt: new Date().toISOString() };
  } else {
    if (!user.id) user.id = generateUUID();
    user.createdAt = new Date().toISOString();
    users.push(user);
  }
  
  saveUsers(users);
}

// 删除用户
export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}

// 生成用户ID
export function generateUserId(): string {
  return generateUUID();
}

// 检查用户名是否存在
export function isUsernameExists(username: string, excludeId?: string): boolean {
  const users = getUsers();
  return users.some(u => u.username === username && u.id !== excludeId);
}

// 保存当前登录用户
export function saveCurrentUser(user: CurrentUser): void {
  user.loginTime = new Date().toISOString();
  setItem(CURRENT_USER_KEY, user);
}

// 获取当前登录用户
export function getCurrentUser(): CurrentUser | null {
  const session = getSession();
  if (!session) return null;
  
  const user = getItem<CurrentUser>(CURRENT_USER_KEY);
  if (!user) return null;
  
  if (!user.id) user.id = user.username;
  return user;
}

// 清除当前登录用户
export function clearCurrentUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
    destroySession();
  }
}

// 更新用户最后登录时间
export function updateLastLogin(username: string): void {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.lastLogin = new Date().toLocaleString('zh-CN');
    saveUsers(users);
  }
}

// 保存记住密码的用户名
export function saveRememberedUsername(username: string): void {
  setItem(REMEMBERED_USERNAME_KEY, escapeHtml(username));
}

// 获取记住密码的用户名
export function getRememberedUsername(): string | null {
  return getItem<string>(REMEMBERED_USERNAME_KEY);
}

// 清除记住密码的用户名
export function clearRememberedUsername(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBERED_USERNAME_KEY);
}

/**
 * 修改密码
 */
export async function changePassword(
  userId: string, 
  oldPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = getUserById(userId);
  if (!user) return { success: false, error: '用户不存在' };
  
  const isValid = await verifyPassword(oldPassword, user.password);
  if (!isValid) return { success: false, error: '原密码错误' };
  
  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.isValid) {
    return { success: false, error: `密码强度不足：${strengthCheck.suggestions.join('、')}` };
  }
  
  user.password = await hashPassword(newPassword);
  user.passwordChangedAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  
  saveUser(user);
  return { success: true };
}

/**
 * 获取默认密码提示
 */
export function getDefaultPasswordHint(): Record<string, string> {
  return {
    admin: 'Admin@2024!',
    user: 'User@2024!',
    worker: 'Worker@2024!'
  };
}

/**
 * 用户相关类型定义
 *
 * 安全注意事项：
 * - 此实现为演示目的，使用 localStorage 存储用户数据
 * - 生产环境应实现真正的认证系统（JWT、OAuth等）
 * - 密码应使用哈希存储，不应明文存储
 */

// 用户角色类型
export type UserRole = '管理员' | '业务员' | '跟单员' | '车间工人' | '组长' | '财务';

// 用户状态
export type UserStatus = '启用' | '禁用';

// 用户信息接口
export interface User {
  id: string;
  username: string;       // 登录账号
  password: string;       // 登录密码
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
}

// 当前登录用户信息（不包含敏感信息）
export interface CurrentUser {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  permissions: string[];
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  '管理员': ['all'],
  '业务员': ['order:create', 'order:view', 'order:edit', 'order:delete', 'bom:create', 'bom:view', 'customer:view', 'customer:edit'],
  '跟单员': ['order:view', 'bom:view', 'cutting:view', 'workshop:view', 'tail:view', 'schedule:view'],
  '车间工人': ['workshop:report', 'cutting:view', 'bundle:view', 'order:view'],
  '组长': ['workshop:view', 'workshop:report', 'workshop:audit', 'cutting:view', 'tail:view', 'employee:view'],
  '财务': ['finance:view', 'finance:audit', 'order:view', 'report:view'],
};

import { DB_KEYS } from '@/lib/database';
import { setItem, getItem } from '@/lib/storage';

const USERS_KEY = DB_KEYS.USERS;
const CURRENT_USER_KEY = 'erp_current_user';
const REMEMBERED_USERNAME_KEY = 'erp_remembered_username';

// 初始化默认用户数据
export function initDefaultUsers(): void {
  if (typeof window === 'undefined') return;
  
  const users = getItem<User[]>(USERS_KEY);
  if (users && Array.isArray(users) && users.length > 0) return;

  const defaultUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      realName: '系统管理员',
      role: '管理员',
      department: '信息部',
      permissions: ['all'],
      status: '启用',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      username: 'user',
      password: '123456',
      realName: '张三',
      role: '业务员',
      department: '业务部',
      permissions: ROLE_PERMISSIONS['业务员'],
      status: '启用',
      createdAt: '2024-01-01',
    },
    {
      id: '3',
      username: 'worker',
      password: '123456',
      realName: '李四',
      role: '车间工人',
      department: '缝制车间',
      permissions: ROLE_PERMISSIONS['车间工人'],
      status: '启用',
      createdAt: '2024-01-01',
    },
  ];

  setItem(USERS_KEY, defaultUsers);
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

// 验证用户登录
export function validateUser(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}

// 保存用户
export function saveUser(user: User): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  
  if (index >= 0) {
    users[index] = { ...user, updatedAt: new Date().toISOString() };
  } else {
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
  const users = getUsers();
  const maxId = users.reduce((max, u) => {
    const num = parseInt(u.id) || 0;
    return num > max ? num : max;
  }, 0);
  return String(maxId + 1);
}

// 检查用户名是否存在
export function isUsernameExists(username: string, excludeId?: string): boolean {
  const users = getUsers();
  return users.some(u => u.username === username && u.id !== excludeId);
}

// ==================== 当前登录用户相关 ====================

// 保存当前登录用户
export function saveCurrentUser(user: CurrentUser): void {
  setItem(CURRENT_USER_KEY, user);
}

// 获取当前登录用户
export function getCurrentUser(): CurrentUser | null {
  const user = getItem<CurrentUser>(CURRENT_USER_KEY);
  if (!user) return null;
  
  // 确保 id 存在
  if (!user.id) {
    user.id = user.username;
  }
  return user;
}

// 清除当前登录用户
export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
  // 触发同步
  import('@/lib/database/sync').then(({ debouncedSave }) => {
    debouncedSave();
  }).catch(() => {});
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

// ==================== 记住密码相关 ====================

// 保存记住密码的用户名
export function saveRememberedUsername(username: string): void {
  setItem(REMEMBERED_USERNAME_KEY, username);
}

// 获取记住密码的用户名
export function getRememberedUsername(): string | null {
  return getItem<string>(REMEMBERED_USERNAME_KEY);
}

// 清除记住密码的用户名
export function clearRememberedUsername(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  // 触发同步
  import('@/lib/database/sync').then(({ debouncedSave }) => {
    debouncedSave();
  }).catch(() => {});
}

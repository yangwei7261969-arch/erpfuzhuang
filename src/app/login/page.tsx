'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, User, Lock, Zap, Moon, Sun } from 'lucide-react';
import { 
  initDefaultUsers, 
  validateUser, 
  saveCurrentUser, 
  saveRememberedUsername, 
  getRememberedUsername,
  clearRememberedUsername,
  updateLastLogin 
} from '@/types/user';
import { useTheme } from '@/components/providers/ThemeProvider';

// 登录日志类型
interface LoginLog {
  id: string;
  username: string;
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  status: '成功' | '失败';
  failReason?: string;
}

// 保存登录日志
const saveLoginLog = (log: LoginLog) => {
  const logs: LoginLog[] = JSON.parse(localStorage.getItem('erp_login_logs') || '[]');
  logs.unshift(log);
  // 保留最近1000条日志
  if (logs.length > 1000) {
    logs.splice(1000);
  }
  localStorage.setItem('erp_login_logs', JSON.stringify(logs));
};

// 生成日志ID
const generateLogId = () => {
  return `LOG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

// 获取设备信息
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = '未知设备';
  if (ua.includes('Windows')) device = 'Windows电脑';
  else if (ua.includes('Mac')) device = 'Mac电脑';
  else if (ua.includes('Linux')) device = 'Linux电脑';
  else if (ua.includes('Android')) device = 'Android手机';
  else if (ua.includes('iPhone') || ua.includes('iPad')) device = 'iOS设备';
  return device;
};

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleMode } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 初始化用户数据和检查记住密码
  useEffect(() => {
    initDefaultUsers();
    const rememberedUsername = getRememberedUsername();
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberPassword(true);
    }
  }, []);

  // 处理登录
  const handleLogin = async () => {
    setError('');
    
    // 验证输入
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    
    if (!password.trim()) {
      setError('密码不能为空');
      return;
    }

    setIsLoading(true);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 验证用户
    const user = validateUser(username.trim(), password);

    if (!user) {
      // 记录登录失败日志
      saveLoginLog({
        id: generateLogId(),
        username: username.trim(),
        loginTime: new Date().toLocaleString('zh-CN'),
        ipAddress: '内网IP',
        deviceInfo: getDeviceInfo(),
        status: '失败',
        failReason: '账号或密码不正确',
      });
      setError('账号或密码不正确');
      setIsLoading(false);
      return;
    }

    if (user.status === '禁用') {
      // 记录登录失败日志
      saveLoginLog({
        id: generateLogId(),
        username: username.trim(),
        loginTime: new Date().toLocaleString('zh-CN'),
        ipAddress: '内网IP',
        deviceInfo: getDeviceInfo(),
        status: '失败',
        failReason: '账号已禁用',
      });
      setError('账号已禁用');
      setIsLoading(false);
      return;
    }

    // 处理记住密码
    if (rememberPassword) {
      saveRememberedUsername(username.trim());
    } else {
      clearRememberedUsername();
    }

    // 保存当前用户信息
    saveCurrentUser({
      id: user.username,
      username: user.username,
      realName: user.realName,
      role: user.role,
      permissions: user.permissions,
    });

    // 更新最后登录时间
    updateLastLogin(user.username);

    // 记录登录成功日志
    saveLoginLog({
      id: generateLogId(),
      username: username.trim(),
      loginTime: new Date().toLocaleString('zh-CN'),
      ipAddress: '内网IP',
      deviceInfo: getDeviceInfo(),
      status: '成功',
    });

    setIsLoading(false);
    
    // 跳转到主页
    router.push('/dashboard');
  };

  // 处理重置
  const handleReset = () => {
    setUsername('');
    setPassword('');
    setError('');
    setRememberPassword(false);
  };

  // 处理回车键登录
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* 主题切换按钮 */}
      <button
        onClick={toggleMode}
        className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
      >
        {theme.mode === 'dark' ? (
          <Sun className="w-5 h-5 text-foreground" />
        ) : (
          <Moon className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* 登录框 */}
      <div className="w-full max-w-md">
        {/* LOGO 和系统名称 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">服装生产 ERP 管理系统</h1>
          <p className="text-muted-foreground mt-2">专业的服装生产管理解决方案</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 用户名输入框 */}
          <div className="mb-5">
            <Label htmlFor="username" className="text-sm font-medium text-foreground mb-2 block">
              用户名
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名 / 工号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 h-12 bg-background border-input"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 密码输入框 */}
          <div className="mb-5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
              密码
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10 h-12 bg-background border-input"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 记住密码 */}
          <div className="mb-6 flex items-center">
            <Checkbox
              id="remember"
              checked={rememberPassword}
              onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
              disabled={isLoading}
            />
            <label
              htmlFor="remember"
              className="ml-2 text-sm text-muted-foreground cursor-pointer select-none"
            >
              记住密码
            </label>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
            <Button
              onClick={handleReset}
              disabled={isLoading}
              variant="outline"
              className="flex-1 h-12 font-medium text-base"
            >
              重置
            </Button>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2026 服装 ERP 系统 技术支持</p>
        </div>
      </div>
    </div>
  );
}

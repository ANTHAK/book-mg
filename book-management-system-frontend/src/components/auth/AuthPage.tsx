import {
  BarChart3,
  BookOpen,
  Library,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import type { FormEvent } from 'react';
import type { AuthMode } from '../../types/auth';

type AuthPageProps = {
  authMode: AuthMode;
  email: string;
  password: string;
  authLoading: boolean;
  authMessage: string;
  onAuthModeChange: (authMode: AuthMode) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/**
 * 登录/注册页面。
 *
 * 左侧展示产品信息，右侧根据 authMode 渲染登录或注册表单。
 */
export function AuthPage({
  authMode,
  email,
  password,
  authLoading,
  authMessage,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthPageProps) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="图书管理系统概览">
        <div className="brand-mark">
          <Library size={30} aria-hidden="true" />
        </div>
        <h1>图书管理系统</h1>
        <p>管理馆藏、借阅状态和图书位置。登录后即可进入工作台处理日常图书流转。</p>
        <div className="auth-highlights">
          <span>
            <BookOpen size={18} aria-hidden="true" />
            馆藏维护
          </span>
          <span>
            <ShieldCheck size={18} aria-hidden="true" />
            Supabase Auth
          </span>
          <span>
            <BarChart3 size={18} aria-hidden="true" />
            状态统计
          </span>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-tabs" role="tablist" aria-label="认证方式">
          <button
            className={authMode === 'login' ? 'active' : ''}
            type="button"
            onClick={() => onAuthModeChange('login')}
          >
            登录
          </button>
          <button
            className={authMode === 'register' ? 'active' : ''}
            type="button"
            onClick={() => onAuthModeChange('register')}
          >
            注册
          </button>
        </div>

        <h2 id="auth-title">{authMode === 'login' ? '登录账户' : '创建账户'}</h2>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            邮箱
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="reader@example.com"
              required
            />
          </label>
          <label>
            密码
            <input
              type="password"
              autoComplete={
                authMode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="至少 8 位"
              minLength={8}
              required
            />
          </label>
          {authMessage && <p className="form-message">{authMessage}</p>}
          <button className="primary-button" type="submit" disabled={authLoading}>
            {authMode === 'login' ? (
              <ShieldCheck size={18} aria-hidden="true" />
            ) : (
              <UserPlus size={18} aria-hidden="true" />
            )}
            {authLoading
              ? '处理中...'
              : authMode === 'login'
                ? '登录'
                : '注册'}
          </button>
        </form>
      </section>
    </main>
  );
}

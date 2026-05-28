/**
 * 认证页面当前模式。
 */
export type AuthMode = 'login' | 'register';

/**
 * 前端需要展示和持久化的最小用户信息。
 */
export type SessionUser = {
  id: string;
  email?: string;
};

/**
 * 后端认证接口返回结构。
 *
 * message 字段兼容 Nest ValidationPipe 的字符串数组错误。
 */
export type AuthResponse = {
  user?: SessionUser | null;
  session?: {
    access_token?: string;
  } | null;
  message?: string | string[];
};

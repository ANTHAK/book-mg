export type AuthMode = 'login' | 'register';

export type SessionUser = {
  id: string;
  email?: string;
};

export type AuthResponse = {
  user?: SessionUser | null;
  session?: {
    access_token?: string;
  } | null;
  message?: string | string[];
};

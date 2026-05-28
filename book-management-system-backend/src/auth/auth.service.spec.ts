import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthResponse } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from './auth.service';

// SupabaseService mock：只暴露 AuthService 依赖的两个认证方法。
const supabaseServiceMock = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
};

// 构造最小 AuthResponse，避免单测依赖真实 Supabase 网络请求。
const authResponse = (error: AuthResponse['error'] = null): AuthResponse =>
  ({
    data: {
      user: { id: 'user-id', email: 'reader@example.com' },
      session: { access_token: 'access-token' },
    },
    error,
  }) as AuthResponse;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // 通过 Nest 测试模块注入 mock，保持和真实依赖注入方式一致。
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: supabaseServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('registers a user with Supabase', async () => {
    // 注册成功时应返回 Supabase user 和 session。
    supabaseServiceMock.signUp.mockResolvedValue(authResponse());

    const result = await service.register({
      email: 'reader@example.com',
      password: 'StrongPassword123',
    });

    expect(supabaseServiceMock.signUp).toHaveBeenCalledWith(
      'reader@example.com',
      'StrongPassword123',
    );
    expect(result.user?.id).toBe('user-id');
    expect(result.session?.access_token).toBe('access-token');
  });

  it('throws BadRequestException when registration fails', async () => {
    // 注册失败统一映射成 400，适合前端展示表单错误。
    supabaseServiceMock.signUp.mockResolvedValue(
      authResponse({
        message: 'User already registered',
      } as AuthResponse['error']),
    );

    await expect(
      service.register({
        email: 'reader@example.com',
        password: 'StrongPassword123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('logs in a user with Supabase', async () => {
    // 登录成功时应调用 Supabase 密码登录接口。
    supabaseServiceMock.signInWithPassword.mockResolvedValue(authResponse());

    const result = await service.login({
      email: 'reader@example.com',
      password: 'StrongPassword123',
    });

    expect(supabaseServiceMock.signInWithPassword).toHaveBeenCalledWith(
      'reader@example.com',
      'StrongPassword123',
    );
    expect(result.user?.id).toBe('user-id');
    expect(result.session?.access_token).toBe('access-token');
  });

  it('throws UnauthorizedException when login fails', async () => {
    // 登录失败统一映射成 401。
    supabaseServiceMock.signInWithPassword.mockResolvedValue(
      authResponse({
        message: 'Invalid login credentials',
      } as AuthResponse['error']),
    );

    await expect(
      service.login({
        email: 'reader@example.com',
        password: 'StrongPassword123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

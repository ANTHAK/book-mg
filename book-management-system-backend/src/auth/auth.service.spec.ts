import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthResponse } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from './auth.service';

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

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthError, AuthResponse } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * 用户认证业务服务。
 *
 * 这里统一处理 Supabase Auth 返回值，并把第三方错误转换成 NestJS HTTP 异常。
 */
@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 注册用户。
   *
   * Supabase 负责创建用户、密码加密和邮箱确认流程。
   */
  async register(registerDto: RegisterDto) {
    const response = await this.supabaseService.signUp(
      registerDto.email,
      registerDto.password,
    );

    this.throwIfSupabaseError(response, 'register');

    return {
      user: response.data.user,
      session: response.data.session,
    };
  }

  /**
   * 登录用户。
   *
   * 成功后返回 Supabase session，里面包含 access_token、refresh_token 等信息。
   */
  async login(loginDto: LoginDto) {
    const response = await this.supabaseService.signInWithPassword(
      loginDto.email,
      loginDto.password,
    );

    this.throwIfSupabaseError(response, 'login');

    return {
      user: response.data.user,
      session: response.data.session,
    };
  }

  /**
   * 将 Supabase Auth 错误映射成稳定的 HTTP 异常：
   * - 登录失败返回 401
   * - 注册失败返回 400
   */
  private throwIfSupabaseError(
    response: AuthResponse,
    action: 'login' | 'register',
  ): void {
    if (!response.error) {
      return;
    }

    const message = this.getSafeAuthMessage(response.error);

    if (action === 'login') {
      throw new UnauthorizedException(message);
    }

    throw new BadRequestException(message);
  }

  /**
   * 只返回可展示的认证错误信息，避免向客户端暴露内部细节。
   */
  private getSafeAuthMessage(error: AuthError): string {
    return error.message || 'Authentication request failed';
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthResponse, createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端封装。
 *
 * 当前只开放 Auth 相关能力，后续如果需要访问数据库或 Storage，
 * 可以继续在这里增加方法，业务层仍然通过依赖注入使用。
 */
@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ??
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey =
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

    // 启动阶段尽早暴露配置错误，避免请求进入业务层后才失败。
    if (!supabaseUrl || !supabaseKey) {
      throw new InternalServerErrorException(
        'Supabase configuration is missing',
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * 使用 Supabase Auth 注册邮箱密码用户。
   */
  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password });
  }

  /**
   * 使用 Supabase Auth 校验邮箱密码并返回会话信息。
   */
  signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  /**
   * 暴露 Supabase 客户端给业务模块访问数据库。
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}

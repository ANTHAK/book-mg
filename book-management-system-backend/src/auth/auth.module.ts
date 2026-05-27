import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 用户认证模块。
 *
 * 对外提供 /auth/register 和 /auth/login 两个接口，
 * 内部通过 SupabaseModule 完成实际认证请求。
 */
@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

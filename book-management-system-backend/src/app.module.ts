import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    // 全局配置模块：自动读取 .env，并让业务模块通过 ConfigService 获取配置。
    ConfigModule.forRoot({ isGlobal: true }),
    // SupabaseModule 负责创建 Supabase 客户端，供认证等业务模块复用。
    SupabaseModule,
    // AuthModule 提供用户注册和登录接口。
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

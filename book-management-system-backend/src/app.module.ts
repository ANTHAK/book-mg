import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { SupabaseModule } from './supabase/supabase.module';

/**
 * 根模块。
 *
 * 汇总全局配置、基础设施模块和业务模块。
 */
@Module({
  imports: [
    // 全局配置模块：自动读取 .env，并让业务模块通过 ConfigService 获取配置。
    ConfigModule.forRoot({ isGlobal: true }),
    // SupabaseModule 负责创建 Supabase 客户端，供认证等业务模块复用。
    SupabaseModule,
    // AuthModule 提供用户注册和登录接口。
    AuthModule,
    // BooksModule 提供图书列表、新增、修改、删除和详情接口。
    BooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

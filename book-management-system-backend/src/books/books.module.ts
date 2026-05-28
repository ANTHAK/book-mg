import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

/**
 * 图书管理模块。
 *
 * 通过 SupabaseModule 获取数据库客户端，提供图书 CRUD 能力。
 */
@Module({
  imports: [SupabaseModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}

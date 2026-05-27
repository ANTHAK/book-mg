import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Supabase 基础设施模块。
 *
 * 该模块只负责对外提供 SupabaseService，避免业务模块直接创建客户端。
 */
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookStatus } from './create-book.dto';

/**
 * 图书列表查询参数 DTO。
 */
export class ListBooksQueryDto {
  /** 模糊搜索关键字。 */
  @ApiPropertyOptional({ example: 'Martin' })
  @IsOptional()
  @IsString()
  query?: string;

  /** 按图书状态筛选。 */
  @ApiPropertyOptional({ enum: BookStatus, example: BookStatus.Available })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}

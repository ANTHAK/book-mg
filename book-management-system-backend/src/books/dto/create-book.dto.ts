import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 图书状态枚举。
 *
 * 取值与数据库 check 约束、前端 BookStatus 类型保持一致。
 */
export enum BookStatus {
  Available = 'available',
  Borrowed = 'borrowed',
  Archived = 'archived',
}

/**
 * 新增图书 DTO。
 *
 * ValidationPipe 会根据这里的装饰器校验请求体，并过滤未知字段。
 */
export class CreateBookDto {
  /** 书名。 */
  @ApiProperty({ example: 'The Pragmatic Programmer' })
  @IsString()
  @MinLength(1)
  title: string;

  /** 作者。 */
  @ApiProperty({ example: 'Andrew Hunt, David Thomas' })
  @IsString()
  @MinLength(1)
  author: string;

  /** 分类。 */
  @ApiProperty({ example: '软件工程' })
  @IsString()
  @MinLength(1)
  category: string;

  /** ISBN，数据库层设置唯一约束。 */
  @ApiProperty({ example: '978-0201616224' })
  @IsString()
  @MinLength(1)
  isbn: string;

  /** 馆藏位置。 */
  @ApiProperty({ example: 'A区-02-15' })
  @IsString()
  @MinLength(1)
  location: string;

  /** 当前图书状态。 */
  @ApiProperty({ enum: BookStatus, example: BookStatus.Available })
  @IsEnum(BookStatus)
  status: BookStatus;

  /** 借阅人，仅已借出状态需要。 */
  @ApiPropertyOptional({ example: '李明' })
  @IsOptional()
  @IsString()
  borrower?: string;

  /** 到期日，仅已借出状态需要。 */
  @ApiPropertyOptional({ example: '2026-06-12' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}

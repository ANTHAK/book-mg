import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 注册请求 DTO。
 *
 * ValidationPipe 会根据这里的装饰器校验请求体。
 */
export class RegisterDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123', minLength: 4 })
  @IsString()
  @MinLength(4)
  password: string;
}

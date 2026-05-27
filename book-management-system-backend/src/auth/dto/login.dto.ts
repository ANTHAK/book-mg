import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 登录请求 DTO。
 *
 * 和注册保持同样的邮箱、密码规则，保证接口入参一致。
 */
export class LoginDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

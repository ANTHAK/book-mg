import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * AuthController 负责 HTTP 层：
 * - 接收并校验请求体
 * - 暴露 Swagger 文档
 * - 将业务处理委托给 AuthService
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 注册接口。
   *
   * 请求体：email、password
   * 成功返回：Supabase user 和 session；如果项目开启邮箱确认，session 可能为 null。
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a user with Supabase Auth' })
  @ApiCreatedResponse({ description: 'User registered successfully.' })
  @ApiBadRequestResponse({ description: 'Registration failed.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * 登录接口。
   *
   * 请求体：email、password
   * 成功返回：Supabase user 和 session，前端可使用 session.access_token 调用受保护接口。
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user with Supabase Auth' })
  @ApiOkResponse({ description: 'User logged in successfully.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

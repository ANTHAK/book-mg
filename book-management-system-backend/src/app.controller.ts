import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * 应用基础控制器。
 *
 * 当前只提供健康检查式的根路径响应。
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 根路径接口，用于快速确认服务是否启动。
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

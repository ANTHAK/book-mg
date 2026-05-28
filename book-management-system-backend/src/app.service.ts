import { Injectable } from '@nestjs/common';

/**
 * 应用基础服务。
 */
@Injectable()
export class AppService {
  /**
   * 返回简单文本，供根路径接口使用。
   */
  getHello(): string {
    return 'Hello World!';
  }
}

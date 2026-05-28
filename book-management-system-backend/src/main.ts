import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * 应用启动入口。
 *
 * 负责创建 Nest 应用、配置跨域、全局校验、Swagger 文档以及监听地址。
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许本地 React 前端访问后端 API。
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  });

  // 全局 DTO 校验：过滤未知字段，拒绝额外字段，并支持类型转换。
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger 文档入口：http://localhost:3000/docs
  const config = new DocumentBuilder()
    .setTitle('Book Management API')
    .setDescription('Book management system backend API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 默认监听本机地址，避免部分本地环境限制 0.0.0.0 绑定。
  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? '127.0.0.1';
  await app.listen(port, host);
}
void bootstrap();

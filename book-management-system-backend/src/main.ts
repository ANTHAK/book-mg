import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

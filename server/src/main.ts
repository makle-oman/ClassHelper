import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局接口前缀
  app.setGlobalPrefix('api');

  // 全局异常过滤器（统一响应格式）
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局 DTO 校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // 自动剔除 DTO 中未定义的字段
      transform: true,       // 自动类型转换
      forbidNonWhitelisted: true, // 传了未定义字段直接报错
    }),
  );

  // 跨域（开发阶段允许所有来源）
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 服务已启动: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();

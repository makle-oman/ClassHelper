import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message: string;

    if (exception instanceof HttpException) {
      const exResponse = exception.getResponse();
      // class-validator 校验失败时返回的 message 可能是数组
      if (typeof exResponse === 'object' && 'message' in exResponse) {
        const msg = (exResponse as any).message;
        message = Array.isArray(msg) ? msg[0] : msg;
      } else {
        message = exception.message;
      }

      // 401 认证失败：保留 HTTP 401 状态码，让前端能正确识别并跳转登录页
      if (exception instanceof UnauthorizedException) {
        response.status(401).json({ code: 401, message, data: null });
        return;
      }
    } else {
      message = '服务器内部错误';
      console.error('未处理异常:', exception);
    }

    response.status(200).json({ code: 0, message, data: null });
  }
}

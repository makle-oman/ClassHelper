import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
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
    } else {
      message = '服务器内部错误';
      console.error('未处理异常:', exception);
    }

    response.status(200).json({ code: 0, message, data: null });
  }
}

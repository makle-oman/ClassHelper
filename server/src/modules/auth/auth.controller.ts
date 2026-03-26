import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { success } from '../../common/response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 教师注册 */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return success(data, '注册成功');
  }

  /** 教师登录 */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return success(data, '登录成功');
  }
}

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success } from '../../common/response';

@Controller('teacher')
@UseGuards(JwtAuthGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  /** 获取个人信息 */
  @Post('profile')
  async getProfile(@Request() req: any) {
    const data = await this.teacherService.getProfile(req.user.id);
    return success(data);
  }

  /** 更新个人信息 */
  @Post('update')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const data = await this.teacherService.updateProfile(req.user.id, dto);
    return success(data, '更新成功');
  }

  /** 修改密码 */
  @Post('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    await this.teacherService.changePassword(req.user.id, dto);
    return success(null, '密码修改成功');
  }
}

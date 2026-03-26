import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Teacher } from '../../entities/teacher.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
  ) {}

  /** 获取个人信息 */
  async getProfile(teacherId: number) {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new UnauthorizedException('用户不存在');
    }
    const { password, current_token, ...result } = teacher;
    return result;
  }

  /** 更新个人信息 */
  async updateProfile(teacherId: number, dto: UpdateProfileDto) {
    await this.teacherRepo.update(teacherId, dto);
    return this.getProfile(teacherId);
  }

  /** 修改密码 */
  async changePassword(teacherId: number, dto: ChangePasswordDto) {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new UnauthorizedException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, teacher.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('旧密码不正确');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.teacherRepo.update(teacherId, { password: hashedPassword });
  }
}

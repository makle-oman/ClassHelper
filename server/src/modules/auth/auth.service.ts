import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Teacher } from '../../entities/teacher.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    private jwtService: JwtService,
  ) {}

  /** 注册 */
  async register(dto: RegisterDto) {
    // 检查手机号是否已注册
    const exists = await this.teacherRepo.findOne({ where: { phone: dto.phone } });
    if (exists) {
      throw new ConflictException('该手机号已注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 创建教师记录
    const teacher = this.teacherRepo.create({
      phone: dto.phone,
      password: hashedPassword,
      name: dto.name,
    });
    await this.teacherRepo.save(teacher);

    // 生成 token 并存入数据库（单设备登录）
    const token = this.jwtService.sign({ id: teacher.id, phone: teacher.phone });
    await this.teacherRepo.update(teacher.id, { current_token: token });

    return {
      token,
      teacher: {
        id: teacher.id,
        phone: teacher.phone,
        name: teacher.name,
      },
    };
  }

  /** 登录 */
  async login(dto: LoginDto) {
    const teacher = await this.teacherRepo.findOne({ where: { phone: dto.phone } });
    if (!teacher) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, teacher.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    // 生成 token 并存入数据库（单设备登录，旧 token 自动失效）
    const token = this.jwtService.sign({ id: teacher.id, phone: teacher.phone });
    await this.teacherRepo.update(teacher.id, { current_token: token });

    return {
      token,
      teacher: {
        id: teacher.id,
        phone: teacher.phone,
        name: teacher.name,
        avatar: teacher.avatar,
        school: teacher.school,
        subject: teacher.subject,
      },
    };
  }

  /** 校验 token 是否是当前有效的（用于 JwtStrategy） */
  async validateToken(id: number, token: string): Promise<boolean> {
    const teacher = await this.teacherRepo.findOne({ where: { id } });
    return teacher?.current_token === token;
  }
}

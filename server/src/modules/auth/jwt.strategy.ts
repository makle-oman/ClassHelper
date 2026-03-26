import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../../entities/teacher.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
      passReqToCallback: true, // 把 request 传进来，用于读取原始 token
    });
  }

  /** 验证 token 是否是当前有效的（单设备登录） */
  async validate(req: any, payload: { id: number; phone: string }) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const teacher = await this.teacherRepo.findOne({ where: { id: payload.id } });

    if (!teacher || teacher.current_token !== token) {
      throw new UnauthorizedException('账号已在其他设备登录，请重新登录');
    }

    return { id: payload.id, phone: payload.phone };
  }
}

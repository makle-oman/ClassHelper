import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import { Teacher } from '../../entities/teacher.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const RETRYABLE_DB_ERROR_CODES = new Set([
  'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST',
  'ETIMEDOUT',
  'EPIPE',
]);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    private jwtService: JwtService,
  ) {}

  private isRetryableDatabaseError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = (error as QueryFailedError & {
      driverError?: { code?: string };
    }).driverError;

    return typeof driverError?.code === 'string'
      && RETRYABLE_DB_ERROR_CODES.has(driverError.code);
  }

  // The remote MySQL instance occasionally resets pooled connections.
  // A short retry lets TypeORM grab a fresh connection without surfacing
  // a false-negative login failure to the user.
  private async withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryableDatabaseError(error) || attempt === 3) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('database operation failed');
  }

  async register(dto: RegisterDto) {
    const exists = await this.withDatabaseRetry(() =>
      this.teacherRepo.findOne({ where: { phone: dto.phone } }),
    );

    if (exists) {
      throw new ConflictException('该手机号已注册');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const teacher = this.teacherRepo.create({
      phone: dto.phone,
      password: hashedPassword,
      name: dto.name,
      subject: dto.subject || null,
    });

    await this.withDatabaseRetry(() => this.teacherRepo.save(teacher));

    const token = this.jwtService.sign({ id: teacher.id, phone: teacher.phone });
    await this.withDatabaseRetry(() =>
      this.teacherRepo.update(teacher.id, { current_token: token }),
    );

    return {
      token,
      teacher: {
        id: teacher.id,
        phone: teacher.phone,
        name: teacher.name,
        subject: teacher.subject,
      },
    };
  }

  async login(dto: LoginDto) {
    const teacher = await this.withDatabaseRetry(() =>
      this.teacherRepo.findOne({ where: { phone: dto.phone } }),
    );

    if (!teacher) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, teacher.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const token = this.jwtService.sign({ id: teacher.id, phone: teacher.phone });
    await this.withDatabaseRetry(() =>
      this.teacherRepo.update(teacher.id, { current_token: token }),
    );

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

  async validateToken(id: number, token: string): Promise<boolean> {
    const teacher = await this.withDatabaseRetry(() =>
      this.teacherRepo.findOne({ where: { id } }),
    );

    return teacher?.current_token === token;
  }
}

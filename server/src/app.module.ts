import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ClassModule } from './modules/class/class.module';
import { SemesterModule } from './modules/semester/semester.module';
import { StudentModule } from './modules/student/student.module';
import { Teacher } from './entities/teacher.entity';
import { Class } from './entities/class.entity';
import { Semester } from './entities/semester.entity';
import { Student } from './entities/student.entity';
import { Parent } from './entities/parent.entity';

@Module({
  imports: [
    // 环境变量
    ConfigModule.forRoot({ isGlobal: true }),

    // 数据库
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', '123456'),
        database: config.get('DB_DATABASE', 'classhelper'),
        entities: [Teacher, Class, Semester, Student, Parent],
        synchronize: true, // 开发环境自动同步表结构，生产环境应关闭
        charset: 'utf8mb4',
      }),
    }),

    // 业务模块
    AuthModule,
    TeacherModule,
    ClassModule,
    SemesterModule,
    StudentModule,
  ],
})
export class AppModule {}

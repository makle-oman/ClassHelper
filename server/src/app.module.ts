import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Parent } from './entities/parent.entity';
import { Semester } from './entities/semester.entity';
import { Student } from './entities/student.entity';
import { Teacher } from './entities/teacher.entity';
import { AuthModule } from './modules/auth/auth.module';
import { ClassModule } from './modules/class/class.module';
import { SemesterModule } from './modules/semester/semester.module';
import { StudentModule } from './modules/student/student.module';
import { TeacherModule } from './modules/teacher/teacher.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        synchronize: true,
        charset: 'utf8mb4',
        extra: {
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
        },
      }),
    }),
    AuthModule,
    TeacherModule,
    ClassModule,
    SemesterModule,
    StudentModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Class } from './entities/class.entity';
import { Course } from './entities/course.entity';
import { Exam } from './entities/exam.entity';
import { Homework } from './entities/homework.entity';
import { HomeworkRecord } from './entities/homework-record.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Notice } from './entities/notice.entity';
import { NoticeRead } from './entities/notice-read.entity';
import { Parent } from './entities/parent.entity';
import { Score } from './entities/score.entity';
import { Semester } from './entities/semester.entity';
import { Student } from './entities/student.entity';
import { Teacher } from './entities/teacher.entity';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassModule } from './modules/class/class.module';
import { CourseModule } from './modules/course/course.module';
import { ExamModule } from './modules/exam/exam.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { LeaveModule } from './modules/leave/leave.module';
import { NoticeModule } from './modules/notice/notice.module';
import { ScoreModule } from './modules/score/score.module';
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
        entities: [
          Teacher, Class, Semester, Student, Parent,
          Course, Attendance, Exam, Score,
          Homework, HomeworkRecord,
          Notice, NoticeRead,
          LeaveRequest,
        ],
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
    CourseModule,
    AttendanceModule,
    ExamModule,
    ScoreModule,
    HomeworkModule,
    NoticeModule,
    LeaveModule,
  ],
})
export class AppModule {}

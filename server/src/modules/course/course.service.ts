import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BatchCreateCourseDto } from './dto/batch-create-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  /** 获取课程列表（按学期+班级筛选） */
  async list(teacherId: number, semesterId: number, classId: number) {
    return this.courseRepo.find({
      where: {
        teacher_id: teacherId,
        semester_id: semesterId,
        class_id: classId,
      },
      order: { weekday: 'ASC', period: 'ASC' },
    });
  }

  /** 创建课程 */
  async create(teacherId: number, dto: CreateCourseDto) {
    // 检查同一班级、同一学期、同一时间段是否已有课程
    const existing = await this.courseRepo.findOne({
      where: {
        class_id: dto.class_id,
        semester_id: dto.semester_id,
        weekday: dto.weekday,
        period: dto.period,
      },
    });
    if (existing) {
      return null;
    }

    const course = this.courseRepo.create({
      ...dto,
      teacher_id: teacherId,
    });

    return this.courseRepo.save(course);
  }

  /** 更新课程 */
  async update(teacherId: number, dto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({
      where: { id: dto.id, teacher_id: teacherId },
    });
    if (!course) {
      return null;
    }

    // 如果修改了时间段，检查冲突
    const weekday = dto.weekday ?? course.weekday;
    const period = dto.period ?? course.period;
    if (dto.weekday !== undefined || dto.period !== undefined) {
      const conflict = await this.courseRepo.findOne({
        where: {
          class_id: course.class_id,
          semester_id: course.semester_id,
          weekday,
          period,
        },
      });
      if (conflict && conflict.id !== dto.id) {
        return 'conflict';
      }
    }

    const { id, ...updateData } = dto;
    await this.courseRepo.update(id, updateData);
    return this.courseRepo.findOne({ where: { id } });
  }

  /** 删除课程 */
  async remove(teacherId: number, id: number) {
    const course = await this.courseRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!course) {
      return false;
    }

    await this.courseRepo.delete(id);
    return true;
  }

  /** 获取今日我的课程 */
  async myToday(teacherId: number, semesterId?: number) {
    // 获取今天是星期几（JS: 0=周日, 1-6=周一到周六 → 转为 1-7）
    const jsDay = new Date().getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;

    const where: any = {
      teacher_id: teacherId,
      weekday,
    };
    if (semesterId) {
      where.semester_id = semesterId;
    }

    return this.courseRepo.find({
      where,
      relations: ['classEntity'],
      order: { period: 'ASC' },
    });
  }

  /** 批量创建课程（一次性设置整个课程表） */
  async batchCreate(teacherId: number, dto: BatchCreateCourseDto) {
    // 先删除该班级该学期该教师的所有旧课程
    await this.courseRepo.delete({
      class_id: dto.class_id,
      semester_id: dto.semester_id,
      teacher_id: teacherId,
    });

    // 批量插入新课程
    const courses = dto.items.map((item) =>
      this.courseRepo.create({
        class_id: dto.class_id,
        semester_id: dto.semester_id,
        teacher_id: teacherId,
        weekday: item.weekday,
        period: item.period,
        subject: item.subject,
        room: item.room,
      }),
    );

    return this.courseRepo.save(courses);
  }
}

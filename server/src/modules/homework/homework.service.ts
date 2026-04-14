import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from '../../entities/homework.entity';
import { HomeworkRecord } from '../../entities/homework-record.entity';
import { Student } from '../../entities/student.entity';
import { Class } from '../../entities/class.entity';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { RecordItemDto } from './dto/record-save.dto';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepo: Repository<Homework>,
    @InjectRepository(HomeworkRecord)
    private recordRepo: Repository<HomeworkRecord>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  /** 验证班级归属 */
  private async verifyClassOwnership(teacherId: number, classId: number) {
    return this.classRepo.findOne({
      where: { id: classId, teacher_id: teacherId, is_archived: false },
    });
  }

  /** 获取作业列表（按班级筛选，支持分页） */
  async list(
    teacherId: number,
    classId: number,
    page = 1,
    pageSize = 20,
  ) {
    const qb = this.homeworkRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.classEntity', 'c')
      .where('h.teacher_id = :teacherId', { teacherId });

    if (classId) {
      qb.andWhere('h.class_id = :classId', { classId });
    }

    qb.orderBy('h.created_at', 'DESC');

    const total = await qb.getCount();
    const list = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      list: list.map((h) => ({
        id: h.id,
        class_id: h.class_id,
        class_name: h.classEntity?.name || null,
        subject: h.subject,
        content: h.content,
        deadline: h.deadline,
        created_at: h.created_at,
        updated_at: h.updated_at,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** 发布作业 */
  async create(teacherId: number, dto: CreateHomeworkDto) {
    const classEntity = await this.verifyClassOwnership(
      teacherId,
      dto.class_id,
    );
    if (!classEntity) {
      return null;
    }

    const homework = this.homeworkRepo.create({
      class_id: dto.class_id,
      subject: dto.subject,
      content: dto.content,
      deadline: dto.deadline,
      teacher_id: teacherId,
    });
    const saved = await this.homeworkRepo.save(homework);

    // 为该班级所有学生创建默认的提交记录（状态：未交）
    const students = await this.studentRepo.find({
      where: { class_id: dto.class_id },
    });
    if (students.length > 0) {
      const records = students.map((s) =>
        this.recordRepo.create({
          homework_id: saved.id,
          student_id: s.id,
          status: '未交',
        }),
      );
      await this.recordRepo.save(records);
    }

    return saved;
  }

  /** 更新作业 */
  async update(teacherId: number, dto: UpdateHomeworkDto) {
    const homework = await this.homeworkRepo.findOne({
      where: { id: dto.id, teacher_id: teacherId },
    });
    if (!homework) {
      return null;
    }

    const updateData: Partial<Homework> = {};
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.deadline !== undefined) updateData.deadline = dto.deadline;

    if (Object.keys(updateData).length > 0) {
      await this.homeworkRepo.update(dto.id, updateData);
    }

    return this.homeworkRepo.findOne({ where: { id: dto.id } });
  }

  /** 删除作业 */
  async remove(teacherId: number, id: number) {
    const homework = await this.homeworkRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!homework) {
      return false;
    }

    // 删除关联的提交记录
    await this.recordRepo.delete({ homework_id: id });
    // 删除作业
    await this.homeworkRepo.delete(id);

    return true;
  }

  /** 获取作业详情（含提交情况列表） */
  async detail(teacherId: number, homeworkId: number) {
    const homework = await this.homeworkRepo.findOne({
      where: { id: homeworkId, teacher_id: teacherId },
      relations: ['classEntity'],
    });
    if (!homework) {
      return null;
    }

    const records = await this.recordRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.student', 's')
      .where('r.homework_id = :homeworkId', { homeworkId })
      .orderBy('s.student_no', 'ASC')
      .getMany();

    return {
      id: homework.id,
      class_id: homework.class_id,
      class_name: homework.classEntity?.name || null,
      subject: homework.subject,
      content: homework.content,
      deadline: homework.deadline,
      created_at: homework.created_at,
      updated_at: homework.updated_at,
      records: records.map((r) => ({
        id: r.id,
        student_id: r.student_id,
        student_name: r.student?.name || null,
        student_no: r.student?.student_no || null,
        status: r.status,
        grade: r.grade || null,
      })),
    };
  }

  /** 批量更新作业提交状态 */
  async recordSave(teacherId: number, homeworkId: number, items: RecordItemDto[]) {
    const homework = await this.homeworkRepo.findOne({
      where: { id: homeworkId, teacher_id: teacherId },
    });
    if (!homework) {
      return null;
    }

    for (const item of items) {
      const existing = await this.recordRepo.findOne({
        where: { homework_id: homeworkId, student_id: item.student_id },
      });
      const updateData: Partial<HomeworkRecord> = { status: item.status };
      if (item.grade !== undefined) updateData.grade = item.grade;

      if (existing) {
        await this.recordRepo.update(existing.id, updateData);
      } else {
        const record = this.recordRepo.create({
          homework_id: homeworkId,
          student_id: item.student_id,
          ...updateData,
        });
        await this.recordRepo.save(record);
      }
    }

    return true;
  }

  /** 作业完成率统计 */
  async stats(teacherId: number, homeworkId: number) {
    const homework = await this.homeworkRepo.findOne({
      where: { id: homeworkId, teacher_id: teacherId },
    });
    if (!homework) {
      return null;
    }

    const records = await this.recordRepo.find({
      where: { homework_id: homeworkId },
    });

    const total = records.length;
    const submitted = records.filter((r) => r.status === '已交').length;
    const late = records.filter((r) => r.status === '迟交').length;
    const notSubmitted = records.filter((r) => r.status === '未交').length;
    const completionRate =
      total > 0 ? Math.round(((submitted + late) / total) * 100) : 0;

    return {
      homework_id: homeworkId,
      total,
      submitted,
      late,
      not_submitted: notSubmitted,
      completion_rate: completionRate,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../../entities/exam.entity';
import { Class } from '../../entities/class.entity';
import { Score } from '../../entities/score.entity';
import { Student } from '../../entities/student.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private examRepo: Repository<Exam>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
    @InjectRepository(Score)
    private scoreRepo: Repository<Score>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  /** 验证班级归属 */
  private async verifyClassOwnership(teacherId: number, classId: number) {
    return this.classRepo.findOne({
      where: { id: classId, teacher_id: teacherId, is_archived: false },
    });
  }

  /** 获取考试列表（按班级筛选） */
  async list(teacherId: number, classId: number) {
    const classEntity = await this.verifyClassOwnership(teacherId, classId);
    if (!classEntity) {
      return null;
    }

    const exams = await this.examRepo.find({
      where: { class_id: classId, teacher_id: teacherId },
      order: { date: 'DESC', created_at: 'DESC' },
    });

    // 查询每场考试的已录入成绩数
    const result = [];
    for (const exam of exams) {
      const scoreCount = await this.scoreRepo.count({
        where: { exam_id: exam.id },
      });
      result.push({
        id: exam.id,
        name: exam.name,
        subject: exam.subject,
        date: exam.date,
        full_score: exam.full_score,
        class_id: exam.class_id,
        score_count: scoreCount,
        student_count: classEntity.student_count,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
      });
    }

    return result;
  }

  /** 创建考试 */
  async create(teacherId: number, dto: CreateExamDto) {
    const classEntity = await this.verifyClassOwnership(teacherId, dto.class_id);
    if (!classEntity) {
      return null;
    }

    const exam = this.examRepo.create({
      name: dto.name,
      subject: dto.subject,
      date: dto.date,
      full_score: dto.full_score ?? 100,
      class_id: dto.class_id,
      teacher_id: teacherId,
    });

    return this.examRepo.save(exam);
  }

  /** 更新考试 */
  async update(teacherId: number, dto: UpdateExamDto) {
    const exam = await this.examRepo.findOne({
      where: { id: dto.id, teacher_id: teacherId },
    });
    if (!exam) {
      return null;
    }

    const updateData: Partial<Exam> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.date !== undefined) updateData.date = dto.date;
    if (dto.full_score !== undefined) updateData.full_score = dto.full_score;

    if (Object.keys(updateData).length > 0) {
      await this.examRepo.update(dto.id, updateData);
    }

    return this.examRepo.findOne({ where: { id: dto.id } });
  }

  /** 删除考试（同时删除关联成绩） */
  async remove(teacherId: number, id: number) {
    const exam = await this.examRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!exam) {
      return false;
    }

    // 先删除关联成绩
    await this.scoreRepo.delete({ exam_id: id });
    // 再删除考试
    await this.examRepo.delete(id);

    return true;
  }

  /** 获取考试详情（含所有学生成绩） */
  async detail(teacherId: number, examId: number) {
    const exam = await this.examRepo.findOne({
      where: { id: examId, teacher_id: teacherId },
    });
    if (!exam) {
      return null;
    }

    // 获取班级所有学生
    const students = await this.studentRepo.find({
      where: { class_id: exam.class_id },
      order: { student_no: 'ASC' },
    });

    // 获取已录入的成绩
    const scores = await this.scoreRepo.find({
      where: { exam_id: examId },
    });
    const scoreMap: Record<number, number> = {};
    for (const s of scores) {
      scoreMap[s.student_id] = Number(s.score);
    }

    // 组装学生成绩列表
    const studentScores = students.map((stu) => ({
      student_id: stu.id,
      student_no: stu.student_no,
      name: stu.name,
      score: scoreMap[stu.id] ?? null,
    }));

    return {
      id: exam.id,
      name: exam.name,
      subject: exam.subject,
      date: exam.date,
      full_score: exam.full_score,
      class_id: exam.class_id,
      students: studentScores,
    };
  }
}

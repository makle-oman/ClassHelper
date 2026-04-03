import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Score } from '../../entities/score.entity';
import { Exam } from '../../entities/exam.entity';
import { Student } from '../../entities/student.entity';
import { Class } from '../../entities/class.entity';
import { BatchSaveScoreDto } from './dto/batch-save-score.dto';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(Score)
    private scoreRepo: Repository<Score>,
    @InjectRepository(Exam)
    private examRepo: Repository<Exam>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  /** 批量录入/更新成绩 */
  async batchSave(teacherId: number, dto: BatchSaveScoreDto) {
    // 验证考试归属
    const exam = await this.examRepo.findOne({
      where: { id: dto.exam_id, teacher_id: teacherId },
    });
    if (!exam) {
      return null;
    }

    // 查询该考试已有的成绩记录
    const existingScores = await this.scoreRepo.find({
      where: { exam_id: dto.exam_id },
    });
    const existingMap: Record<number, Score> = {};
    for (const s of existingScores) {
      existingMap[s.student_id] = s;
    }

    const toInsert: Partial<Score>[] = [];
    const toUpdate: { id: number; score: number }[] = [];

    for (const item of dto.items) {
      const existing = existingMap[item.student_id];
      if (existing) {
        // 更新已有记录
        toUpdate.push({ id: existing.id, score: item.score });
      } else {
        // 新增记录
        toInsert.push({
          exam_id: dto.exam_id,
          student_id: item.student_id,
          score: item.score,
        });
      }
    }

    // 批量插入
    if (toInsert.length > 0) {
      await this.scoreRepo
        .createQueryBuilder()
        .insert()
        .into(Score)
        .values(toInsert)
        .execute();
    }

    // 逐条更新
    for (const item of toUpdate) {
      await this.scoreRepo.update(item.id, { score: item.score });
    }

    return { inserted: toInsert.length, updated: toUpdate.length };
  }

  /** 考试统计 */
  async stats(teacherId: number, examId: number) {
    const exam = await this.examRepo.findOne({
      where: { id: examId, teacher_id: teacherId },
    });
    if (!exam) {
      return null;
    }

    const scores = await this.scoreRepo.find({
      where: { exam_id: examId },
    });

    if (scores.length === 0) {
      return {
        exam_id: examId,
        exam_name: exam.name,
        subject: exam.subject,
        full_score: exam.full_score,
        total_count: 0,
        score_count: 0,
        avg: 0,
        max: 0,
        min: 0,
        pass_rate: 0,
        excellent_rate: 0,
        segments: {
          '90-100': 0,
          '80-89': 0,
          '70-79': 0,
          '60-69': 0,
          '<60': 0,
        },
      };
    }

    const values = scores.map((s) => Number(s.score));
    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = Math.round((total / values.length) * 10) / 10;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // 分数段统计
    const segments = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '<60': 0,
    };
    let passCount = 0;
    let excellentCount = 0;

    for (const v of values) {
      if (v >= 90) {
        segments['90-100']++;
        excellentCount++;
        passCount++;
      } else if (v >= 80) {
        segments['80-89']++;
        passCount++;
      } else if (v >= 70) {
        segments['70-79']++;
        passCount++;
      } else if (v >= 60) {
        segments['60-69']++;
        passCount++;
      } else {
        segments['<60']++;
      }
    }

    const passRate =
      Math.round((passCount / values.length) * 1000) / 10;
    const excellentRate =
      Math.round((excellentCount / values.length) * 1000) / 10;

    // 获取班级总人数
    const classEntity = await this.classRepo.findOne({
      where: { id: exam.class_id },
    });

    return {
      exam_id: examId,
      exam_name: exam.name,
      subject: exam.subject,
      full_score: exam.full_score,
      total_count: classEntity?.student_count ?? 0,
      score_count: values.length,
      avg,
      max,
      min,
      pass_rate: passRate,
      excellent_rate: excellentRate,
      segments,
    };
  }

  /** 获取某学生所有考试成绩 */
  async studentScores(teacherId: number, studentId: number, classId: number) {
    // 验证班级归属
    const classEntity = await this.classRepo.findOne({
      where: { id: classId, teacher_id: teacherId, is_archived: false },
    });
    if (!classEntity) {
      return null;
    }

    // 验证学生属于该班级
    const student = await this.studentRepo.findOne({
      where: { id: studentId, class_id: classId },
    });
    if (!student) {
      return 'student_not_found';
    }

    // 获取该班级的所有考试
    const exams = await this.examRepo.find({
      where: { class_id: classId },
      order: { date: 'DESC', created_at: 'DESC' },
    });

    if (exams.length === 0) {
      return [];
    }

    const examIds = exams.map((e) => e.id);

    // 获取该学生在这些考试中的成绩
    const scores = await this.scoreRepo.find({
      where: { student_id: studentId, exam_id: In(examIds) },
    });
    const scoreMap: Record<number, number> = {};
    for (const s of scores) {
      scoreMap[s.exam_id] = Number(s.score);
    }

    return exams.map((exam) => ({
      exam_id: exam.id,
      exam_name: exam.name,
      subject: exam.subject,
      date: exam.date,
      full_score: exam.full_score,
      score: scoreMap[exam.id] ?? null,
    }));
  }
}

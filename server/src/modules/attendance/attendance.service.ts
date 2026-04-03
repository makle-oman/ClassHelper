import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from '../../entities/attendance.entity';
import { Class } from '../../entities/class.entity';
import { BatchSaveAttendanceDto } from './dto/batch-save-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  /** 验证班级归属 */
  private async verifyClassOwnership(teacherId: number, classId: number) {
    return this.classRepo.findOne({
      where: { id: classId, teacher_id: teacherId, is_archived: false },
    });
  }

  /** 获取考勤记录（按班级+日期） */
  async list(teacherId: number, classId: number, date: string) {
    const classEntity = await this.verifyClassOwnership(teacherId, classId);
    if (!classEntity) {
      return null;
    }

    const records = await this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.student', 's')
      .where('a.class_id = :classId', { classId })
      .andWhere('a.date = :date', { date })
      .orderBy('s.student_no', 'ASC')
      .getMany();

    return records.map((r) => ({
      id: r.id,
      student_id: r.student_id,
      student_name: r.student?.name || null,
      student_no: r.student?.student_no || null,
      class_id: r.class_id,
      date: r.date,
      status: r.status,
      remark: r.remark,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  /** 批量保存考勤（存在则更新，不存在则插入） */
  async batchSave(teacherId: number, dto: BatchSaveAttendanceDto) {
    const classEntity = await this.verifyClassOwnership(teacherId, dto.class_id);
    if (!classEntity) {
      return null;
    }

    const results: Attendance[] = [];

    for (const item of dto.items) {
      // 查找是否已有该学生当天的考勤记录
      let record = await this.attendanceRepo.findOne({
        where: {
          student_id: item.student_id,
          class_id: dto.class_id,
          date: dto.date,
        },
      });

      if (record) {
        // 更新已有记录
        record.status = item.status;
        record.remark = item.remark || null;
        record.teacher_id = teacherId;
        record = await this.attendanceRepo.save(record);
      } else {
        // 插入新记录
        record = this.attendanceRepo.create({
          student_id: item.student_id,
          class_id: dto.class_id,
          date: dto.date,
          status: item.status,
          remark: item.remark || null,
          teacher_id: teacherId,
        });
        record = await this.attendanceRepo.save(record);
      }

      results.push(record);
    }

    return results;
  }

  /** 获取单个学生考勤统计（按状态分组计数） */
  async studentStats(teacherId: number, studentId: number, startDate: string, endDate: string) {
    const stats = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.student_id = :studentId', { studentId })
      .andWhere('a.date >= :startDate', { startDate })
      .andWhere('a.date <= :endDate', { endDate })
      .groupBy('a.status')
      .getRawMany();

    // 构建完整的统计结果
    const statusMap: Record<string, number> = {
      '出勤': 0,
      '迟到': 0,
      '早退': 0,
      '请假': 0,
      '缺席': 0,
    };

    let total = 0;
    for (const row of stats) {
      statusMap[row.status] = parseInt(row.count, 10);
      total += parseInt(row.count, 10);
    }

    return {
      student_id: studentId,
      start_date: startDate,
      end_date: endDate,
      total,
      ...statusMap,
      attendance_rate: total > 0 ? Math.round((statusMap['出勤'] / total) * 10000) / 100 : 0,
    };
  }

  /** 获取班级考勤统计（某天出勤率） */
  async classStats(teacherId: number, classId: number, date: string) {
    const classEntity = await this.verifyClassOwnership(teacherId, classId);
    if (!classEntity) {
      return null;
    }

    const records = await this.attendanceRepo.find({
      where: { class_id: classId, date },
    });

    const total = records.length;
    const statusCount: Record<string, number> = {
      '出勤': 0,
      '迟到': 0,
      '早退': 0,
      '请假': 0,
      '缺席': 0,
    };

    for (const r of records) {
      if (statusCount[r.status] !== undefined) {
        statusCount[r.status]++;
      }
    }

    return {
      class_id: classId,
      date,
      total,
      ...statusCount,
      attendance_rate: total > 0 ? Math.round((statusCount['出勤'] / total) * 10000) / 100 : 0,
      student_count: classEntity.student_count,
    };
  }
}

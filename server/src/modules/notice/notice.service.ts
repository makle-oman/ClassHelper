import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from '../../entities/notice.entity';
import { NoticeRead } from '../../entities/notice-read.entity';
import { Parent } from '../../entities/parent.entity';
import { Student } from '../../entities/student.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepo: Repository<Notice>,
    @InjectRepository(NoticeRead)
    private noticeReadRepo: Repository<NoticeRead>,
    @InjectRepository(Parent)
    private parentRepo: Repository<Parent>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  /** 获取通知列表 */
  async list(teacherId: number, classId?: number) {
    const where: any = { teacher_id: teacherId };
    if (classId) {
      where.class_id = classId;
    }
    return this.noticeRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /** 创建通知 */
  async create(teacherId: number, dto: CreateNoticeDto) {
    const notice = this.noticeRepo.create({
      ...dto,
      teacher_id: teacherId,
    });
    return this.noticeRepo.save(notice);
  }

  /** 更新通知 */
  async update(teacherId: number, dto: UpdateNoticeDto) {
    const notice = await this.noticeRepo.findOne({
      where: { id: dto.id, teacher_id: teacherId },
    });
    if (!notice) return null;

    const { id, ...updateData } = dto;
    await this.noticeRepo.update(id, updateData);
    return this.noticeRepo.findOne({ where: { id } });
  }

  /** 删除通知 */
  async remove(teacherId: number, id: number) {
    const notice = await this.noticeRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!notice) return false;

    await this.noticeRepo.delete(id);
    return true;
  }

  /** 获取通知详情（含已读统计） */
  async detail(noticeId: number) {
    const notice = await this.noticeRepo.findOne({
      where: { id: noticeId },
    });
    if (!notice) return null;

    // 统计班级内家长总数
    const students = await this.studentRepo.find({
      where: { class_id: notice.class_id },
    });
    const studentIds = students.map((s) => s.id);

    let totalParents = 0;
    if (studentIds.length > 0) {
      totalParents = await this.parentRepo
        .createQueryBuilder('p')
        .where('p.student_id IN (:...studentIds)', { studentIds })
        .getCount();
    }

    // 统计已读数
    const readCount = await this.noticeReadRepo.count({
      where: { notice_id: noticeId },
    });

    return {
      ...notice,
      read_count: readCount,
      total_parents: totalParents,
      unread_count: totalParents - readCount,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semester } from '../../entities/semester.entity';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemesterService {
  constructor(
    @InjectRepository(Semester)
    private semesterRepo: Repository<Semester>,
  ) {}

  /** 获取学期列表 */
  async list(teacherId: number) {
    return this.semesterRepo.find({
      where: { teacher_id: teacherId },
      order: { is_active: 'DESC', created_at: 'DESC' },
    });
  }

  /** 创建学期 */
  async create(teacherId: number, dto: CreateSemesterDto) {
    // 如果设为当前学期，先将其他学期取消激活
    if (dto.set_as_current) {
      await this.semesterRepo.update(
        { teacher_id: teacherId },
        { is_active: false },
      );
    }

    const semester = this.semesterRepo.create({
      name: dto.name,
      start_date: dto.start_date,
      end_date: dto.end_date,
      weeks_count: dto.weeks_count,
      is_active: dto.set_as_current ?? false,
      current_week: dto.set_as_current ? 1 : null,
      teacher_id: teacherId,
    });

    return this.semesterRepo.save(semester);
  }

  /** 更新学期 */
  async update(teacherId: number, dto: UpdateSemesterDto) {
    const { id, ...updateData } = dto;

    const semester = await this.semesterRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!semester) {
      return null;
    }

    await this.semesterRepo.update(id, updateData);
    return this.semesterRepo.findOne({ where: { id } });
  }

  /** 设为当前活跃学期 */
  async setActive(teacherId: number, id: number) {
    const semester = await this.semesterRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!semester) {
      return null;
    }

    // 取消其他学期的激活状态
    await this.semesterRepo.update(
      { teacher_id: teacherId },
      { is_active: false },
    );

    // 激活选中的学期
    await this.semesterRepo.update(id, { is_active: true, current_week: 1 });
    return this.semesterRepo.findOne({ where: { id } });
  }

  /** 归档学期 */
  async archive(teacherId: number, id: number) {
    const semester = await this.semesterRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!semester) {
      return null;
    }

    await this.semesterRepo.update(id, { is_archived: true, is_active: false });
    return this.semesterRepo.findOne({ where: { id } });
  }

  /** 删除学期 */
  async remove(teacherId: number, id: number) {
    const semester = await this.semesterRepo.findOne({
      where: { id, teacher_id: teacherId },
    });
    if (!semester) {
      return null;
    }

    await this.semesterRepo.delete(id);
    return true;
  }
}

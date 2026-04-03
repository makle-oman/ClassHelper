import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRepo: Repository<LeaveRequest>,
  ) {}

  /** 获取请假列表 */
  async list(classId: number, status?: string) {
    const where: any = { class_id: classId };
    if (status) {
      where.status = status;
    }
    return this.leaveRepo.find({
      where,
      relations: ['student'],
      order: { created_at: 'DESC' },
    });
  }

  /** 创建请假申请 */
  async create(dto: CreateLeaveDto) {
    const leave = this.leaveRepo.create(dto);
    return this.leaveRepo.save(leave);
  }

  /** 获取请假详情 */
  async detail(id: number) {
    return this.leaveRepo.findOne({
      where: { id },
      relations: ['student', 'parent'],
    });
  }

  /** 批准请假 */
  async approve(teacherId: number, id: number) {
    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) return null;
    if (leave.status !== '待审批') return 'already_reviewed';

    await this.leaveRepo.update(id, {
      status: '已批准',
      teacher_id: teacherId,
      reviewed_at: new Date(),
    });
    return this.leaveRepo.findOne({ where: { id }, relations: ['student'] });
  }

  /** 拒绝请假 */
  async reject(teacherId: number, id: number) {
    const leave = await this.leaveRepo.findOne({ where: { id } });
    if (!leave) return null;
    if (leave.status !== '待审批') return 'already_reviewed';

    await this.leaveRepo.update(id, {
      status: '已拒绝',
      teacher_id: teacherId,
      reviewed_at: new Date(),
    });
    return this.leaveRepo.findOne({ where: { id }, relations: ['student'] });
  }
}

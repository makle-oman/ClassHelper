import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  /** 获取请假列表 */
  @Post('list')
  async list(@Body() dto: QueryLeaveDto) {
    const data = await this.leaveService.list(dto.class_id, dto.status);
    return success(data);
  }

  /** 创建请假申请 */
  @Post('create')
  async create(@Body() dto: CreateLeaveDto) {
    const data = await this.leaveService.create(dto);
    return success(data, '提交成功');
  }

  /** 获取请假详情 */
  @Post('detail')
  async detail(@Body('id') id: number) {
    const data = await this.leaveService.detail(id);
    if (!data) return fail('请假记录不存在');
    return success(data);
  }

  /** 批准请假 */
  @Post('approve')
  async approve(@Request() req: any, @Body('id') id: number) {
    const data = await this.leaveService.approve(req.user.id, id);
    if (data === null) return fail('请假记录不存在');
    if (data === 'already_reviewed') return fail('该请假已审批');
    return success(data, '已批准');
  }

  /** 拒绝请假 */
  @Post('reject')
  async reject(@Request() req: any, @Body('id') id: number) {
    const data = await this.leaveService.reject(req.user.id, id);
    if (data === null) return fail('请假记录不存在');
    if (data === 'already_reviewed') return fail('该请假已审批');
    return success(data, '已拒绝');
  }
}

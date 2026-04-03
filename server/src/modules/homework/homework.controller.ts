import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { RecordSaveDto } from './dto/record-save.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  /** 获取作业列表 */
  @Post('list')
  async list(
    @Request() req: any,
    @Body('class_id') classId: number,
    @Body('page') page: number,
    @Body('pageSize') pageSize: number,
  ) {
    const data = await this.homeworkService.list(
      req.user.id,
      classId,
      page,
      pageSize,
    );
    return success(data);
  }

  /** 发布作业 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateHomeworkDto) {
    const data = await this.homeworkService.create(req.user.id, dto);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data, '发布成功');
  }

  /** 更新作业 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateHomeworkDto) {
    const data = await this.homeworkService.update(req.user.id, dto);
    if (data === null) {
      return fail('作业不存在');
    }
    return success(data, '更新成功');
  }

  /** 删除作业 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.homeworkService.remove(req.user.id, id);
    if (!result) {
      return fail('作业不存在');
    }
    return success(null, '删除成功');
  }

  /** 获取作业详情（含提交情况列表） */
  @Post('detail')
  async detail(@Request() req: any, @Body('id') id: number) {
    const data = await this.homeworkService.detail(req.user.id, id);
    if (data === null) {
      return fail('作业不存在');
    }
    return success(data);
  }

  /** 批量更新作业提交状态 */
  @Post('record-save')
  async recordSave(@Request() req: any, @Body() dto: RecordSaveDto) {
    const result = await this.homeworkService.recordSave(
      req.user.id,
      dto.homework_id,
      dto.items,
    );
    if (result === null) {
      return fail('作业不存在');
    }
    return success(null, '保存成功');
  }

  /** 作业完成率统计 */
  @Post('stats')
  async stats(@Request() req: any, @Body('homework_id') homeworkId: number) {
    const data = await this.homeworkService.stats(req.user.id, homeworkId);
    if (data === null) {
      return fail('作业不存在');
    }
    return success(data);
  }
}

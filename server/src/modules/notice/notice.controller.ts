import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('notice')
@UseGuards(JwtAuthGuard)
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  /** 获取通知列表 */
  @Post('list')
  async list(@Request() req: any, @Body('class_id') classId?: number) {
    const data = await this.noticeService.list(req.user.id, classId);
    return success(data);
  }

  /** 创建通知 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateNoticeDto) {
    const data = await this.noticeService.create(req.user.id, dto);
    return success(data, '发布成功');
  }

  /** 更新通知 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateNoticeDto) {
    const data = await this.noticeService.update(req.user.id, dto);
    if (!data) return fail('通知不存在');
    return success(data, '更新成功');
  }

  /** 删除通知 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.noticeService.remove(req.user.id, id);
    if (!result) return fail('通知不存在');
    return success(null, '删除成功');
  }

  /** 获取通知详情 */
  @Post('detail')
  async detail(@Body('id') id: number) {
    const data = await this.noticeService.detail(id);
    if (!data) return fail('通知不存在');
    return success(data);
  }
}

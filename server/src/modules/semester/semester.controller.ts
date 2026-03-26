import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SemesterService } from './semester.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('semester')
@UseGuards(JwtAuthGuard)
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  /** 学期列表 */
  @Post('list')
  async list(@Request() req: any) {
    const data = await this.semesterService.list(req.user.id);
    return success(data);
  }

  /** 创建学期 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateSemesterDto) {
    const data = await this.semesterService.create(req.user.id, dto);
    return success(data, '创建成功');
  }

  /** 更新学期 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateSemesterDto) {
    const data = await this.semesterService.update(req.user.id, dto);
    if (!data) {
      return fail('学期不存在');
    }
    return success(data, '更新成功');
  }

  /** 设为当前学期 */
  @Post('set-active')
  async setActive(@Request() req: any, @Body('id') id: number) {
    const data = await this.semesterService.setActive(req.user.id, id);
    if (!data) {
      return fail('学期不存在');
    }
    return success(data, '设置成功');
  }

  /** 归档学期 */
  @Post('archive')
  async archive(@Request() req: any, @Body('id') id: number) {
    const data = await this.semesterService.archive(req.user.id, id);
    if (!data) {
      return fail('学期不存在');
    }
    return success(data, '归档成功');
  }

  /** 删除学期 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.semesterService.remove(req.user.id, id);
    if (!result) {
      return fail('学期不存在');
    }
    return success(null, '删除成功');
  }
}

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('class')
@UseGuards(JwtAuthGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  /** 获取班级列表 */
  @Post('list')
  async list(@Request() req: any) {
    const data = await this.classService.list(req.user.id);
    return success(data);
  }

  /** 创建班级 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateClassDto) {
    const data = await this.classService.create(req.user.id, dto);
    if (!data) {
      return fail('该班级已存在');
    }
    return success(data, '创建成功');
  }

  /** 更新班级 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateClassDto) {
    const data = await this.classService.update(req.user.id, dto);
    if (data === null) {
      return fail('班级不存在');
    }
    if (data === 'duplicate') {
      return fail('该班级已存在');
    }
    return success(data, '更新成功');
  }

  /** 删除班级 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.classService.remove(req.user.id, id);
    if (!result) {
      return fail('班级不存在');
    }
    return success(null, '删除成功');
  }
}

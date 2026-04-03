import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  /** 获取考试列表 */
  @Post('list')
  async list(@Request() req: any, @Body('class_id') classId: number) {
    const data = await this.examService.list(req.user.id, classId);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data);
  }

  /** 创建考试 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateExamDto) {
    const data = await this.examService.create(req.user.id, dto);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data, '创建成功');
  }

  /** 更新考试 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateExamDto) {
    const data = await this.examService.update(req.user.id, dto);
    if (data === null) {
      return fail('考试不存在');
    }
    return success(data, '更新成功');
  }

  /** 删除考试 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.examService.remove(req.user.id, id);
    if (!result) {
      return fail('考试不存在');
    }
    return success(null, '删除成功');
  }

  /** 获取考试详情（含学生成绩） */
  @Post('detail')
  async detail(@Request() req: any, @Body('id') id: number) {
    const data = await this.examService.detail(req.user.id, id);
    if (data === null) {
      return fail('考试不存在');
    }
    return success(data);
  }
}

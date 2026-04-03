import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BatchCreateCourseDto } from './dto/batch-create-course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('course')
@UseGuards(JwtAuthGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  /** 获取课程列表（按 semester_id + class_id 筛选） */
  @Post('list')
  async list(
    @Request() req: any,
    @Body('semester_id') semesterId: number,
    @Body('class_id') classId: number,
  ) {
    if (!semesterId || !classId) {
      return fail('请提供学期ID和班级ID');
    }
    const data = await this.courseService.list(req.user.id, semesterId, classId);
    return success(data);
  }

  /** 创建课程 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateCourseDto) {
    const data = await this.courseService.create(req.user.id, dto);
    if (!data) {
      return fail('该时间段已有课程');
    }
    return success(data, '创建成功');
  }

  /** 更新课程 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateCourseDto) {
    const data = await this.courseService.update(req.user.id, dto);
    if (data === null) {
      return fail('课程不存在');
    }
    if (data === 'conflict') {
      return fail('该时间段已有其他课程');
    }
    return success(data, '更新成功');
  }

  /** 删除课程 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.courseService.remove(req.user.id, id);
    if (!result) {
      return fail('课程不存在');
    }
    return success(null, '删除成功');
  }

  /** 获取今日我的课程 */
  @Post('my-today')
  async myToday(
    @Request() req: any,
    @Body('semester_id') semesterId?: number,
  ) {
    const data = await this.courseService.myToday(req.user.id, semesterId);
    return success(data);
  }

  /** 批量创建课程（一次性设置整个课程表） */
  @Post('batch-create')
  async batchCreate(@Request() req: any, @Body() dto: BatchCreateCourseDto) {
    const data = await this.courseService.batchCreate(req.user.id, dto);
    return success(data, '课程表保存成功');
  }
}

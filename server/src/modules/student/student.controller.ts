import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('api/student')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /** 获取班级学生列表 */
  @Post('list')
  async list(@Request() req: any, @Body('class_id') classId: number) {
    const data = await this.studentService.listByClass(req.user.id, classId);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data);
  }

  /** 创建学生 */
  @Post('create')
  async create(@Request() req: any, @Body() dto: CreateStudentDto) {
    const data = await this.studentService.create(req.user.id, dto);
    if (data === null) {
      return fail('班级不存在');
    }
    if (data === 'duplicate') {
      return fail('该学号已存在');
    }
    return success(data, '创建成功');
  }

  /** 更新学生信息 */
  @Post('update')
  async update(@Request() req: any, @Body() dto: UpdateStudentDto) {
    const data = await this.studentService.update(req.user.id, dto);
    if (data === null) {
      return fail('学生不存在');
    }
    if (data === 'duplicate') {
      return fail('该学号已存在');
    }
    return success(data, '更新成功');
  }

  /** 删除学生 */
  @Post('delete')
  async remove(@Request() req: any, @Body('id') id: number) {
    const result = await this.studentService.remove(req.user.id, id);
    if (!result) {
      return fail('学生不存在');
    }
    return success(null, '删除成功');
  }
}

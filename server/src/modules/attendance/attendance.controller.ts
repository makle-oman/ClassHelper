import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { BatchSaveAttendanceDto } from './dto/batch-save-attendance.dto';
import { QueryAttendanceListDto, QueryStudentStatsDto, QueryClassStatsDto } from './dto/query-attendance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /** 获取考勤记录（按班级+日期） */
  @Post('list')
  async list(@Request() req: any, @Body() dto: QueryAttendanceListDto) {
    const data = await this.attendanceService.list(req.user.id, dto.class_id, dto.date);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data);
  }

  /** 批量保存考勤 */
  @Post('batch-save')
  async batchSave(@Request() req: any, @Body() dto: BatchSaveAttendanceDto) {
    const data = await this.attendanceService.batchSave(req.user.id, dto);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data, '保存成功');
  }

  /** 获取单个学生考勤统计 */
  @Post('student-stats')
  async studentStats(@Request() req: any, @Body() dto: QueryStudentStatsDto) {
    const data = await this.attendanceService.studentStats(
      req.user.id,
      dto.student_id,
      dto.start_date,
      dto.end_date,
    );
    return success(data);
  }

  /** 获取班级考勤统计 */
  @Post('class-stats')
  async classStats(@Request() req: any, @Body() dto: QueryClassStatsDto) {
    const data = await this.attendanceService.classStats(req.user.id, dto.class_id, dto.date);
    if (data === null) {
      return fail('班级不存在');
    }
    return success(data);
  }
}

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ScoreService } from './score.service';
import { BatchSaveScoreDto } from './dto/batch-save-score.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { success, fail } from '../../common/response';

@Controller('score')
@UseGuards(JwtAuthGuard)
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  /** 批量录入成绩 */
  @Post('batch-save')
  async batchSave(@Request() req: any, @Body() dto: BatchSaveScoreDto) {
    const data = await this.scoreService.batchSave(req.user.id, dto);
    if (data === null) {
      return fail('考试不存在');
    }
    return success(data, '保存成功');
  }

  /** 考试统计 */
  @Post('stats')
  async stats(@Request() req: any, @Body('exam_id') examId: number) {
    const data = await this.scoreService.stats(req.user.id, examId);
    if (data === null) {
      return fail('考试不存在');
    }
    return success(data);
  }

  /** 获取某学生所有考试成绩 */
  @Post('student-scores')
  async studentScores(
    @Request() req: any,
    @Body('student_id') studentId: number,
    @Body('class_id') classId: number,
  ) {
    const data = await this.scoreService.studentScores(
      req.user.id,
      studentId,
      classId,
    );
    if (data === null) {
      return fail('班级不存在');
    }
    if (data === 'student_not_found') {
      return fail('学生不存在');
    }
    return success(data);
  }
}

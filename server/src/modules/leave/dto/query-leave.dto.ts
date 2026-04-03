import { IsInt, IsOptional, IsIn } from 'class-validator';

export class QueryLeaveDto {
  @IsInt()
  class_id: number;

  @IsOptional()
  @IsIn(['待审批', '已批准', '已拒绝'])
  status?: string;
}

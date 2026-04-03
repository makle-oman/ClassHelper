import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class UpdateNoticeDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['普通通知', '放假通知', '活动通知', '紧急通知'])
  type?: string;
}

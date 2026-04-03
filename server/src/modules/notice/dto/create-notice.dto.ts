import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsIn(['普通通知', '放假通知', '活动通知', '紧急通知'])
  type?: string;

  @IsInt()
  class_id: number;
}

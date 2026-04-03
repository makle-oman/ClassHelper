import { IsInt, IsString, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceItemDto {
  @IsInt()
  student_id: number;

  @IsString()
  status: string; // 出勤/迟到/早退/请假/缺席

  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchSaveAttendanceDto {
  @IsInt()
  class_id: number;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  items: AttendanceItemDto[];
}

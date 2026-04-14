import {
  IsInt,
  IsString,
  IsIn,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordItemDto {
  @IsInt()
  student_id: number;

  @IsString()
  @IsIn(['已交', '未交', '迟交'])
  status: string;

  @IsOptional()
  @IsString()
  @IsIn(['优', '良', '中', '差'])
  grade?: string;
}

export class RecordSaveDto {
  @IsInt()
  homework_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordItemDto)
  items: RecordItemDto[];
}

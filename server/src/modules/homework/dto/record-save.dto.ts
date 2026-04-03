import {
  IsInt,
  IsString,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordItemDto {
  @IsInt()
  student_id: number;

  @IsString()
  @IsIn(['已交', '未交', '迟交'])
  status: string;
}

export class RecordSaveDto {
  @IsInt()
  homework_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordItemDto)
  items: RecordItemDto[];
}

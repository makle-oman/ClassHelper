import { IsInt, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreItemDto {
  @IsInt()
  student_id: number;

  @IsNumber()
  score: number;
}

export class BatchSaveScoreDto {
  @IsInt()
  exam_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  items: ScoreItemDto[];
}

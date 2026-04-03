import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsInt()
  full_score?: number;

  @IsInt()
  class_id: number;
}

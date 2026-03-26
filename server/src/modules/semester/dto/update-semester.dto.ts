import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSemesterDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weeks_count?: number;
}

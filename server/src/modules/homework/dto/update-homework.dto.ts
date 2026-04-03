import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateHomeworkDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deadline?: string;
}

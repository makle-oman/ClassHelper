import { IsInt, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateStudentDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  student_no?: string;

  @IsOptional()
  @IsString()
  @IsIn(['男', '女'])
  gender?: string;

  @IsOptional()
  @IsString()
  parent_name?: string;

  @IsOptional()
  @IsString()
  parent_phone?: string;
}

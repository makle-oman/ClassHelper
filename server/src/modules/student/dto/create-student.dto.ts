import { IsInt, IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsInt()
  class_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  student_no: string;

  @IsString()
  @IsIn(['男', '女'])
  gender: string;

  @IsOptional()
  @IsString()
  parent_name?: string;

  @IsOptional()
  @IsString()
  parent_phone?: string;
}

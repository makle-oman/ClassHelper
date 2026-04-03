import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateHomeworkDto {
  @IsInt()
  class_id: number;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  deadline: string;
}

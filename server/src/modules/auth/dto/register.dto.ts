import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少 6 位' })
  @IsString()
  password: string;

  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  subject?: string;
}

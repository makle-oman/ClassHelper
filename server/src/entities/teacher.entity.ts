import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true, comment: '手机号' })
  phone: string;

  @Column({ comment: '密码（加密存储）' })
  password: string;

  @Column({ length: 50, nullable: true, comment: '姓名' })
  name: string;

  @Column({ nullable: true, comment: '头像 URL' })
  avatar: string;

  @Column({ length: 100, nullable: true, comment: '学校' })
  school: string;

  @Column({ length: 50, nullable: true, comment: '科目' })
  subject: string;

  @Column({ type: 'text', nullable: true, comment: '当前有效 token（单设备登录）' })
  current_token: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

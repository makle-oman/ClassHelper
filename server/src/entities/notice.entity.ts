import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Teacher } from './teacher.entity';

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200, comment: '通知标题' })
  title: string;

  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @Column({ length: 20, default: '普通通知', comment: '通知类型：普通通知/放假通知/活动通知/紧急通知' })
  type: string;

  @Column({ type: 'int', comment: '目标班级ID' })
  class_id: number;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @Column({ type: 'int', comment: '发布教师ID' })
  teacher_id: number;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

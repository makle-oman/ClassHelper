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

@Entity('homework')
export class Homework {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '班级ID' })
  class_id: number;

  @Column({ length: 50, comment: '科目' })
  subject: string;

  @Column({ type: 'text', comment: '作业内容' })
  content: string;

  @Column({ type: 'date', comment: '截止日期' })
  deadline: string;

  @Column({ type: 'int', comment: '教师ID' })
  teacher_id: number;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

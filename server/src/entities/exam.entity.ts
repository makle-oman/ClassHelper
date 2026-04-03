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

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '考试名称' })
  name: string;

  @Column({ length: 50, comment: '科目' })
  subject: string;

  @Column({ type: 'date', comment: '考试日期' })
  date: string;

  @Column({ type: 'int', default: 100, comment: '满分' })
  full_score: number;

  @Column({ type: 'int', comment: '班级ID' })
  class_id: number;

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

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Homework } from './homework.entity';
import { Student } from './student.entity';

@Entity('homework_records')
export class HomeworkRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '作业ID' })
  homework_id: number;

  @Column({ type: 'int', comment: '学生ID' })
  student_id: number;

  @Column({ length: 10, default: '未交', comment: '提交状态：已交/未交/迟交' })
  status: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: '评分：优/良/中/差' })
  grade: string | null;

  @ManyToOne(() => Homework)
  @JoinColumn({ name: 'homework_id' })
  homework: Homework;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

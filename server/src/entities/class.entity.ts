import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from './teacher.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, comment: '年级，如三年级' })
  grade: string;

  @Column({ type: 'int', comment: '年级数字，如3' })
  grade_number: number;

  @Column({ type: 'int', comment: '班级序号，如2' })
  class_number: number;

  @Column({ length: 50, comment: '班级名称，如三年级2班' })
  name: string;

  @Column({ type: 'int', default: 0, comment: '学生人数' })
  student_count: number;

  @Column({ type: 'boolean', default: false, comment: '是否已归档' })
  is_archived: boolean;

  @Column({ type: 'int', comment: '所属教师ID' })
  teacher_id: number;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

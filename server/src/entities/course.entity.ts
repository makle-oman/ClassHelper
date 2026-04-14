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
import { Class } from './class.entity';
import { Semester } from './semester.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '班级ID' })
  class_id: number;

  @Column({ type: 'int', comment: '学期ID' })
  semester_id: number;

  @Column({ type: 'int', comment: '星期几(1-7)' })
  weekday: number;

  @Column({ type: 'int', comment: '第几节课' })
  period: number;

  @Column({ length: 50, comment: '科目' })
  subject: string;

  @Column({ type: 'int', comment: '授课教师ID' })
  teacher_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '教室' })
  room: string | null;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @ManyToOne(() => Semester)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

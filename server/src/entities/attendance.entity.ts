import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Class } from './class.entity';
import { Teacher } from './teacher.entity';

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '学生ID' })
  student_id: number;

  @Column({ type: 'int', comment: '班级ID' })
  class_id: number;

  @Column({ type: 'date', comment: '考勤日期' })
  date: string;

  @Column({ length: 10, default: '出勤', comment: '考勤状态：出勤/迟到/早退/请假/缺席' })
  status: string;

  @Column({ length: 200, nullable: true, comment: '备注' })
  remark: string | null;

  @Column({ type: 'int', comment: '记录教师ID' })
  teacher_id: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

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

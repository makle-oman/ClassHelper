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
import { Parent } from './parent.entity';
import { Class } from './class.entity';
import { Teacher } from './teacher.entity';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '学生ID' })
  student_id: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'int', nullable: true, comment: '家长ID（家长端提交时记录）' })
  parent_id: number;

  @ManyToOne(() => Parent)
  @JoinColumn({ name: 'parent_id' })
  parent: Parent;

  @Column({ type: 'int', comment: '班级ID' })
  class_id: number;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @Column({ type: 'date', comment: '请假开始日期' })
  start_date: string;

  @Column({ type: 'date', comment: '请假结束日期' })
  end_date: string;

  @Column({ length: 500, comment: '请假原因' })
  reason: string;

  @Column({ length: 10, default: '待审批', comment: '审批状态：待审批/已批准/已拒绝' })
  status: string;

  @Column({ type: 'int', nullable: true, comment: '审批教师ID' })
  teacher_id: number;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ type: 'datetime', nullable: true, comment: '审批时间' })
  reviewed_at: Date;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

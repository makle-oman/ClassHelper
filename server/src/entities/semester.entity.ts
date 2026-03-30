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

@Entity('semesters')
export class Semester {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '学期名称，如2025-2026学年第二学期' })
  name: string;

  @Column({ type: 'date', comment: '开始日期' })
  start_date: string;

  @Column({ type: 'date', comment: '结束日期' })
  end_date: string;

  @Column({ type: 'int', comment: '总周数' })
  weeks_count: number;

  @Column({ type: 'int', nullable: true, comment: '当前第几周' })
  current_week: number | null;

  @Column({ type: 'boolean', default: false, comment: '是否为当前活跃学期' })
  is_active: boolean;

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

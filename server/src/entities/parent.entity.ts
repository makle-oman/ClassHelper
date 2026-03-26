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

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, comment: '家长姓名' })
  name: string;

  @Column({ length: 20, comment: '家长手机号' })
  phone: string;

  @Column({ length: 20, default: '父亲', comment: '与学生关系' })
  relationship: string;

  @Column({ type: 'int', comment: '关联学生ID' })
  student_id: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

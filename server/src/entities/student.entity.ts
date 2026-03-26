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

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, comment: '学号' })
  student_no: string;

  @Column({ length: 50, comment: '姓名' })
  name: string;

  @Column({ length: 10, comment: '性别：男/女' })
  gender: string;

  @Column({ type: 'date', nullable: true, comment: '出生日期' })
  birth_date: Date;

  @Column({ type: 'int', comment: '所属班级ID' })
  class_id: number;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;
}

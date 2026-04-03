import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notice } from './notice.entity';
import { Parent } from './parent.entity';

@Entity('notice_reads')
export class NoticeRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '通知ID' })
  notice_id: number;

  @ManyToOne(() => Notice)
  @JoinColumn({ name: 'notice_id' })
  notice: Notice;

  @Column({ type: 'int', comment: '家长ID' })
  parent_id: number;

  @ManyToOne(() => Parent)
  @JoinColumn({ name: 'parent_id' })
  parent: Parent;

  @Column({ type: 'datetime', comment: '阅读时间' })
  read_at: Date;
}

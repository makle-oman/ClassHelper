/**
 * 考勤模块 API
 */
import { request } from './request';

export interface AttendanceRecord {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: '出勤' | '迟到' | '早退' | '请假' | '缺席';
  remark: string | null;
  student?: {
    id: number;
    name: string;
    student_no: string;
  };
}

export interface StudentStats {
  total: number;
  出勤: number;
  迟到: number;
  早退: number;
  请假: number;
  缺席: number;
  attendance_rate: number;
}

export interface ClassStats {
  student_count: number;
  出勤: number;
  迟到: number;
  早退: number;
  请假: number;
  缺席: number;
  attendance_rate: number;
}

/** 获取考勤记录 */
export function list(class_id: number, date: string) {
  return request<AttendanceRecord[]>('/attendance/list', { class_id, date });
}

/** 批量保存考勤 */
export function batchSave(data: {
  class_id: number;
  date: string;
  items: { student_id: number; status: string; remark?: string }[];
}) {
  return request<AttendanceRecord[]>('/attendance/batch-save', data);
}

/** 学生考勤统计 */
export function studentStats(student_id: number, start_date: string, end_date: string) {
  return request<StudentStats>('/attendance/student-stats', { student_id, start_date, end_date });
}

/** 班级考勤统计 */
export function classStats(class_id: number, date: string) {
  return request<ClassStats>('/attendance/class-stats', { class_id, date });
}

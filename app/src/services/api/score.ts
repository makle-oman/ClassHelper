/**
 * 成绩模块 API
 */
import { request } from './request';

export interface ScoreStats {
  avg: number;
  max: number;
  min: number;
  segments: {
    '90-100': number;
    '80-89': number;
    '70-79': number;
    '60-69': number;
    '<60': number;
  };
  pass_rate: number;
  excellent_rate: number;
  total: number;
}

export interface StudentScore {
  exam_id: number;
  exam_name: string;
  subject: string;
  date: string;
  full_score: number;
  score: number;
}

/** 批量录入成绩 */
export function batchSave(data: {
  exam_id: number;
  items: { student_id: number; score: number }[];
}) {
  return request<null>('/score/batch-save', data);
}

/** 考试统计 */
export function stats(exam_id: number) {
  return request<ScoreStats>('/score/stats', { exam_id });
}

/** 获取学生成绩 */
export function studentScores(student_id: number, class_id: number) {
  return request<StudentScore[]>('/score/student-scores', { student_id, class_id });
}

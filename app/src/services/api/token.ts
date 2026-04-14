/**
 * Token 管理工具
 * 负责 JWT Token 的存储、读取、清除
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'class_helper_token';
const TEACHER_KEY = 'class_helper_teacher';

/** 教师信息 */
export interface TeacherInfo {
  id: number;
  phone: string;
  name: string;
  avatar: string | null;
  school: string | null;
  subject: string | null;
  teaching_years: number | null;
}

/** 保存登录信息（Token + 教师信息） */
export async function saveAuth(token: string, teacher: TeacherInfo): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [TEACHER_KEY, JSON.stringify(teacher)],
  ]);
}

/** 获取 Token */
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/** 获取教师信息 */
export async function getTeacher(): Promise<TeacherInfo | null> {
  const raw = await AsyncStorage.getItem(TEACHER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 清除登录信息（退出登录） */
export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, TEACHER_KEY]);
}

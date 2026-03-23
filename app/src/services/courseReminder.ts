import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getReminderSettings, type ReminderSettings } from './reminderSettings';

// 通知处理配置：前台也显示通知
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 课程时间表（key 对应 period key）
const PERIOD_TIMES: Record<string, { hour: number; minute: number }> = {
  'morning': { hour: 7, minute: 40 },
  '1': { hour: 8, minute: 0 },
  '2': { hour: 8, minute: 50 },
  '3': { hour: 10, minute: 0 },
  '4': { hour: 10, minute: 50 },
  'noon': { hour: 12, minute: 30 },
  '5': { hour: 14, minute: 0 },
  '6': { hour: 14, minute: 50 },
  'after': { hour: 16, minute: 0 },
};

const PERIOD_LABELS: Record<string, string> = {
  'morning': '早读',
  '1': '第1节', '2': '第2节', '3': '第3节',
  '4': '第4节', '5': '第5节', '6': '第6节',
  'noon': '午阅',
  'after': '课后服务',
};

interface CourseForReminder {
  periodKey: string;
  subject: string;
  className: string;
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android 需要通知渠道
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('course-reminder', {
      name: '课程提醒',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

/**
 * 取消所有已调度的课程提醒
 */
export async function cancelAllCourseReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 为今天剩余的课程调度本地通知提醒
 */
export async function scheduleTodayReminders(courses: CourseForReminder[]): Promise<void> {
  const settings = await getReminderSettings();

  if (!settings.enabled) {
    await cancelAllCourseReminders();
    return;
  }

  // 先清除之前的调度
  await cancelAllCourseReminders();

  const now = new Date();

  for (const course of courses) {
    const periodTime = PERIOD_TIMES[course.periodKey];
    if (!periodTime) continue;

    // 计算提醒时间 = 课程开始时间 - 提前分钟数
    const courseDate = new Date();
    courseDate.setHours(periodTime.hour, periodTime.minute, 0, 0);

    const reminderDate = new Date(courseDate.getTime() - settings.minutesBefore * 60 * 1000);

    // 只调度还没过的提醒
    if (reminderDate <= now) continue;

    const periodLabel = PERIOD_LABELS[course.periodKey] || course.periodKey;
    const timeStr = `${periodTime.hour.toString().padStart(2, '0')}:${periodTime.minute.toString().padStart(2, '0')}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 课程提醒',
        body: `${settings.minutesBefore}分钟后有课：${periodLabel} ${course.subject}（${course.className}）${timeStr}开始`,
        data: { type: 'course_reminder', periodKey: course.periodKey },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'course-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
  }
}

/**
 * 根据设置变化重新调度提醒
 */
export async function refreshReminders(courses: CourseForReminder[]): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  await scheduleTodayReminders(courses);
}

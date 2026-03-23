import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'class_reminder_settings';

export interface ReminderSettings {
  enabled: boolean;        // 是否开启课前提醒
  minutesBefore: number;   // 提前几分钟提醒（5/10/15/20/30）
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  minutesBefore: 10,
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

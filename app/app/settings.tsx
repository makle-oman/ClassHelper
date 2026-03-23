import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import {
  getReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from '../src/services/reminderSettings';
import { requestNotificationPermission, cancelAllCourseReminders } from '../src/services/courseReminder';

const MINUTE_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen() {
  const colors = useTheme();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    minutesBefore: 10,
  });

  useEffect(() => {
    getReminderSettings().then(setSettings);
  }, []);

  const handleToggle = async (enabled: boolean) => {
    if (enabled && Platform.OS !== 'web') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('需要通知权限', '请在系统设置中允许通知权限，才能接收课程提醒。');
        return;
      }
    }

    if (!enabled) {
      await cancelAllCourseReminders();
    }

    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    await saveReminderSettings(newSettings);
  };

  const handleMinutesChange = async (minutes: number) => {
    const newSettings = { ...settings, minutesBefore: minutes };
    setSettings(newSettings);
    await saveReminderSettings(newSettings);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 课前提醒 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>课程提醒</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* 开关 */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.green.bg }]}>
                <Ionicons name="notifications" size={18} color={colors.palette.green.text} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>课前提醒</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  在您的课程开始前发送通知提醒
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={settings.enabled ? colors.primary : '#F4F4F4'}
              ios_backgroundColor={colors.border}
            />
          </View>

          {/* 提前时间 */}
          {settings.enabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.minutesSection}>
                <Text style={[styles.minutesLabel, { color: colors.textSecondary }]}>提前提醒时间</Text>
                <View style={styles.minutesOptions}>
                  {MINUTE_OPTIONS.map((min) => {
                    const isSelected = settings.minutesBefore === min;
                    return (
                      <TouchableOpacity
                        key={min}
                        style={[
                          styles.minuteChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => handleMinutesChange(min)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.minuteChipText,
                            { color: isSelected ? '#FFF' : colors.textSecondary },
                          ]}
                        >
                          {min}分钟
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>

        {/* 提示说明 */}
        <View style={styles.tipSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.tipText, { color: colors.textTertiary }]}>
            课前提醒仅对标记为"我的课程"的课程生效，每天打开APP时会自动调度当天的提醒。
          </Text>
        </View>

        {/* 其他设置（占位） */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>通用</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.blue.bg }]}>
                <Ionicons name="language" size={18} color={colors.palette.blue.text} />
              </View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>语言</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>简体中文</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.purple.bg }]}>
                <Ionicons name="color-palette" size={18} color={colors.palette.purple.text} />
              </View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>主题</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>跟随系统</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 0.5,
    marginLeft: 62,
  },
  minutesSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  minutesLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  minutesOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  minuteChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  minuteChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  tipText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});

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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, useThemeMode } from '../src/theme';
import {
  getReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from '../src/services/reminderSettings';
import { requestNotificationPermission, cancelAllCourseReminders } from '../src/services/courseReminder';

const MINUTE_OPTIONS = [5, 10, 15, 20, 30];

type ThemeModeType = 'system' | 'light' | 'dark';
const themeModeLabels: Record<ThemeModeType, string> = {
  system: '跟随系统',
  light: '浅色模式',
  dark: '深色模式',
};

export default function SettingsScreen() {
  const colors = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    minutesBefore: 10,
  });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

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

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }
    // TODO: 后续对接后端推送到管理后台
    Alert.alert('提交成功', '感谢您的反馈，我们会尽快处理！');
    setFeedbackText('');
    setShowFeedbackModal(false);
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
                        <Text style={[styles.minuteChipText, { color: isSelected ? '#FFF' : colors.textSecondary }]}>
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

        <View style={styles.tipSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.tipText, { color: colors.textTertiary }]}>
            课前提醒仅对标记为"我的课程"的课程生效，每天打开APP时会自动调度当天的提醒。
          </Text>
        </View>

        {/* 通用 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>通用</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowThemeModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.purple.bg }]}>
                <Ionicons name="color-palette" size={18} color={colors.palette.purple.text} />
              </View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>主题</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>{themeModeLabels[themeMode]}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 其他 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>其他</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowFeedbackModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.orange.bg }]}>
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.palette.orange.text} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>意见反馈</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>问题反馈和建议</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowAboutModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.cyan.bg }]}>
                <Ionicons name="information-circle" size={18} color={colors.palette.cyan.text} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>关于</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>版本信息</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>v1.0.0</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 主题选择弹窗 */}
      <Modal visible={showThemeModal} transparent animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>选择主题</Text>
            {([
              { mode: 'system' as ThemeModeType, label: '跟随系统', icon: 'phone-portrait-outline' as const },
              { mode: 'light' as ThemeModeType, label: '浅色模式', icon: 'sunny-outline' as const },
              { mode: 'dark' as ThemeModeType, label: '深色模式', icon: 'moon-outline' as const },
            ]).map((item) => (
              <TouchableOpacity
                key={item.mode}
                style={[styles.optionRow, themeMode === item.mode && { backgroundColor: colors.primaryLight }]}
                onPress={() => { setThemeMode(item.mode); setShowThemeModal(false); }}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name={item.icon} size={18} color={themeMode === item.mode ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.optionText, { color: themeMode === item.mode ? colors.primary : colors.text }]}>{item.label}</Text>
                </View>
                {themeMode === item.mode && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 关于弹窗 */}
      <Modal visible={showAboutModal} transparent animationType="fade" onRequestClose={() => setShowAboutModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAboutModal(false)}>
          <View style={[styles.aboutModal, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.aboutIcon, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.aboutIconText, { color: colors.primary }]}>C</Text>
            </View>
            <Text style={[styles.aboutName, { color: colors.text }]}>ClassHelper</Text>
            <Text style={[styles.aboutVersion, { color: colors.textTertiary }]}>版本 1.0.0</Text>
            <View style={[styles.aboutDivider, { backgroundColor: colors.divider }]} />
            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
              面向小学教师的智能教学管理工具，帮助教师高效管理班级、学生、课程、成绩和考勤。
            </Text>
            <View style={styles.aboutInfoList}>
              <View style={styles.aboutInfoRow}>
                <Text style={[styles.aboutInfoLabel, { color: colors.textTertiary }]}>更新日期</Text>
                <Text style={[styles.aboutInfoValue, { color: colors.text }]}>2026-03-23</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.aboutCloseBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAboutModal(false)}>
              <Text style={styles.aboutCloseBtnText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 意见反馈弹窗 */}
      <Modal visible={showFeedbackModal} transparent animationType="fade" onRequestClose={() => setShowFeedbackModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFeedbackModal(false)}>
          <View style={[styles.feedbackModal, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>意见反馈</Text>

            <TextInput
              style={[styles.feedbackInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
              placeholder="请描述您遇到的问题或建议..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmitFeedback}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={16} color="#FFF" />
              <Text style={styles.submitBtnText}>提交反馈</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.closeTextBtn]} onPress={() => setShowFeedbackModal(false)}>
              <Text style={[styles.closeTextBtnText, { color: colors.textTertiary }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  navTitle: { fontSize: 17, fontWeight: '700' },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '500' },
  card: { marginHorizontal: 20, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue: { fontSize: 14 },
  divider: { height: 0.5, marginLeft: 62 },
  minutesSection: { paddingHorizontal: 16, paddingVertical: 14 },
  minutesLabel: { fontSize: 13, fontWeight: '500', marginBottom: 12 },
  minutesOptions: { flexDirection: 'row', gap: 8 },
  minuteChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  minuteChipText: { fontSize: 13, fontWeight: '600' },
  tipSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 20, paddingTop: 12 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 18 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContent: { width: '100%', maxWidth: 360, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, marginHorizontal: 8, marginBottom: 4 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { fontSize: 15, fontWeight: '500' },
  // About
  aboutModal: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, alignItems: 'center' },
  aboutIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  aboutIconText: { fontSize: 28, fontWeight: '800' },
  aboutName: { fontSize: 22, fontWeight: '800' },
  aboutVersion: { fontSize: 13, marginTop: 4 },
  aboutDivider: { width: '100%', height: 0.5, marginVertical: 16 },
  aboutDesc: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  aboutInfoList: { width: '100%', marginTop: 16, gap: 8 },
  aboutInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  aboutInfoLabel: { fontSize: 13 },
  aboutInfoValue: { fontSize: 13, fontWeight: '500' },
  aboutCloseBtn: { width: '100%', height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  aboutCloseBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  // Feedback
  feedbackModal: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 20 },
  feedbackInput: { height: 140, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, fontSize: 14, borderWidth: 1, textAlignVertical: 'top' } as any,
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, marginTop: 12 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  closeTextBtn: { alignItems: 'center', paddingVertical: 12 },
  closeTextBtnText: { fontSize: 14 },
});

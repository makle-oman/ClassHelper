import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, useThemeMode } from '../src/theme';
import { getReminderSettings, saveReminderSettings, type ReminderSettings } from '../src/services/reminderSettings';
import { requestNotificationPermission, cancelAllCourseReminders } from '../src/services/courseReminder';
import { AppButton, AppCard, AppChip, AppSectionHeader, PrimaryHeroSection } from '../src/components/ui';

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
  const [settings, setSettings] = useState<ReminderSettings>({ enabled: true, minutesBefore: 10 });
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

    const nextSettings = { ...settings, enabled };
    setSettings(nextSettings);
    await saveReminderSettings(nextSettings);
  };

  const handleMinutesChange = async (minutes: number) => {
    const nextSettings = { ...settings, minutesBefore: minutes };
    setSettings(nextSettings);
    await saveReminderSettings(nextSettings);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }

    try {
      // 将反馈保存到本地存储
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const existing = await AsyncStorage.getItem('app_feedbacks');
      const feedbacks = existing ? JSON.parse(existing) : [];
      feedbacks.push({
        content: feedbackText.trim(),
        time: new Date().toISOString(),
      });
      await AsyncStorage.setItem('app_feedbacks', JSON.stringify(feedbacks));
      Alert.alert('提交成功', '感谢您的反馈，已记录到本地。');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch {
      Alert.alert('提交失败', '请稍后再试');
    }
  };

  const themeOptions: { mode: ThemeModeType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { mode: 'system', label: '跟随系统', icon: 'phone-portrait-outline', description: '自动匹配系统当前外观' },
    { mode: 'light', label: '浅色模式', icon: 'sunny-outline', description: '界面更明亮，适合白天使用' },
    { mode: 'dark', label: '深色模式', icon: 'moon-outline', description: '降低夜间视觉刺激，更沉稳' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <PrimaryHeroSection style={styles.topSection}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>设置</Text>
            <Text style={styles.navSubtitle}>提醒 · 主题 · 反馈</Text>
          </View>
          <View style={styles.navGhost} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroEyebrowWrap}>
              <Ionicons name="sparkles-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroEyebrow}>偏好中心</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeLabel}>当前主题</Text>
              <Text style={styles.heroBadgeValue}>{themeModeLabels[themeMode]}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>课程提醒 · 外观主题 · 反馈建议</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '提醒', value: settings.enabled ? '开启' : '关闭' },
              { label: '提前', value: `${settings.minutesBefore} 分钟` },
              { label: '反馈', value: '已就绪' },
            ].map((item) => (
              <View key={item.label} style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
                <Text style={styles.heroStatValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </PrimaryHeroSection>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageContent}>
        <AppSectionHeader title="课程提醒" style={styles.sectionHeader} />
        <AppCard padding="none" style={styles.card}> 
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.green.bg }]}> 
                <Ionicons name="notifications-outline" size={18} color={colors.palette.green.text} />
              </View>
              <View style={styles.settingBody}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>课前提醒</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>课程开始前发送通知，帮助您提前做好准备</Text>
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
                <View style={[styles.minutesPanel, { backgroundColor: colors.surfaceSecondary }]}>
                  <View style={styles.minutesHeader}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>提醒时间</Text>
                    <Text style={[styles.minutesValue, { color: colors.primary }]}>{settings.minutesBefore} 分钟前</Text>
                  </View>
                <View style={styles.minutesWrap}>
                  {MINUTE_OPTIONS.map((minute) => {
                    const selected = settings.minutesBefore === minute;
                    return (
                      <AppChip
                        key={minute}
                        label={`${minute} 分钟`}
                        selected={selected}
                        style={styles.minuteChip}
                        onPress={() => handleMinutesChange(minute)}
                      />
                    );
                  })}
                </View>
                </View>
              </View>
            </>
          )}
        </AppCard>

        <AppCard padding="none" style={styles.tipCard}> 
          <View style={[styles.tipIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
          </View>
          <Text style={[styles.tipText, { color: colors.textTertiary }]}>提醒仅对标记为“我的课程”的课程生效，打开 App 时会自动刷新当天提醒计划。</Text>
        </AppCard>

        <AppSectionHeader title="显示与个性化" style={styles.sectionHeader} />
        <AppCard padding="none" style={styles.card}> 
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.75} onPress={() => setShowThemeModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.purple.bg }]}> 
                <Ionicons name="color-palette-outline" size={18} color={colors.palette.purple.text} />
              </View>
              <View style={styles.settingBody}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>主题模式</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>跟随系统或手动切换浅色、深色模式</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.valueBadge, { backgroundColor: colors.palette.purple.bg }]}>
                <Text style={[styles.valueBadgeText, { color: colors.palette.purple.text }]}>{themeModeLabels[themeMode]}</Text>
              </View>
              <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </View>
            </View>
          </TouchableOpacity>
        </AppCard>

        <AppSectionHeader title="帮助与反馈" style={styles.sectionHeader} />
        <AppCard padding="none" style={styles.card}> 
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.75} onPress={() => setShowFeedbackModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.orange.bg }]}> 
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.palette.orange.text} />
              </View>
              <View style={styles.settingBody}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>意见反馈</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>遇到问题或有改进想法？随时记录下来</Text>
              </View>
            </View>
            <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.75} onPress={() => setShowAboutModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.palette.cyan.bg }]}> 
                <Ionicons name="information-circle-outline" size={18} color={colors.palette.cyan.text} />
              </View>
              <View style={styles.settingBody}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>关于应用</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>查看版本信息</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.valueBadge, { backgroundColor: colors.palette.cyan.bg }]}>
                <Text style={[styles.valueBadgeText, { color: colors.palette.cyan.text }]}>v1.0.0</Text>
              </View>
              <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </View>
            </View>
          </TouchableOpacity>
        </AppCard>
        </View>
      </ScrollView>

      <Modal visible={showThemeModal} transparent animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHero}>
              <View style={[styles.modalHeroIcon, { backgroundColor: colors.palette.purple.bg }]}>
                <Ionicons name="color-palette-outline" size={20} color={colors.palette.purple.text} />
              </View>
              <View style={styles.modalHeroTextWrap}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>选择主题模式</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>切换到更适合当前环境的界面外观。</Text>
              </View>
              <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
            {themeOptions.map((item) => (
              <TouchableOpacity
                key={item.mode}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: themeMode === item.mode ? colors.primaryLight : colors.surfaceSecondary,
                    borderColor: themeMode === item.mode ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setThemeMode(item.mode);
                  setShowThemeModal(false);
                }}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIconWrap, { backgroundColor: themeMode === item.mode ? '#FFFFFF' : colors.surface }]}>
                    <Ionicons name={item.icon} size={18} color={themeMode === item.mode ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionText, { color: themeMode === item.mode ? colors.primary : colors.text }]}>{item.label}</Text>
                    <Text style={[styles.optionHint, { color: themeMode === item.mode ? colors.primary : colors.textTertiary }]}>{item.description}</Text>
                  </View>
                </View>
                {themeMode === item.mode && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAboutModal} transparent animationType="fade" onRequestClose={() => setShowAboutModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAboutModal(false)}>
          <View style={[styles.modalSheet, styles.aboutSheet, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHero}>
              <View style={[styles.modalHeroIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.aboutIconText, { color: colors.primary }]}>C</Text>
              </View>
              <View style={styles.modalHeroTextWrap}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>ClassHelper</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>版本 1.0.0</Text>
              </View>
              <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>面向小学教师的教学管理助手，帮助老师更高效地管理班级、学生、课程、成绩和考勤。</Text>
            <View style={[styles.aboutInfoCard, { backgroundColor: colors.surfaceSecondary }]}> 
              <View style={styles.aboutInfoRow}>
                <Text style={[styles.aboutInfoLabel, { color: colors.textTertiary }]}>更新日期</Text>
                <Text style={[styles.aboutInfoValue, { color: colors.text }]}>2026-03-23</Text>
              </View>
              <View style={styles.aboutInfoRow}>
                <Text style={[styles.aboutInfoLabel, { color: colors.textTertiary }]}>当前阶段</Text>
                <Text style={[styles.aboutInfoValue, { color: colors.text }]}>前端静态完善</Text>
              </View>
            </View>
            <AppButton label="关闭" onPress={() => setShowAboutModal(false)} style={styles.primaryButton} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showFeedbackModal} transparent animationType="fade" onRequestClose={() => setShowFeedbackModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFeedbackModal(false)}>
          <View style={[styles.modalSheet, styles.feedbackSheet, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHero}>
              <View style={[styles.modalHeroIcon, { backgroundColor: colors.palette.orange.bg }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.palette.orange.text} />
              </View>
              <View style={styles.modalHeroTextWrap}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>意见反馈</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>欢迎记录您在使用中遇到的问题或改进建议。</Text>
              </View>
              <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
            <View style={[styles.feedbackInputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <TextInput
                style={[styles.feedbackInput, { color: colors.text }]}
                placeholder="请描述您遇到的问题或建议..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={feedbackText}
                onChangeText={setFeedbackText}
              />
            </View>
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <AppButton
                fullWidth={false}
                label="取消"
                onPress={() => setShowFeedbackModal(false)}
                style={styles.modalCancelButton}
                tone="info"
                variant="outline"
              />
              <AppButton
                fullWidth={false}
                label="提交反馈"
                onPress={handleSubmitFeedback}
                style={styles.modalConfirmButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: {
    paddingBottom: 10,
  },
  navBar: { flexDirection: 'row', alignItems: 'center' },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  navCenter: { flex: 1, marginLeft: 10 },
  navGhost: { width: 36, height: 36 },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  navSubtitle: { marginTop: 1, fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  heroCard: { paddingTop: 6 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroEyebrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '700' },
  heroBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroBadgeLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '700' },
  heroBadgeValue: { marginTop: 1, color: '#FFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  heroStatChip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  heroStatLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroStatValue: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  scrollContent: { paddingBottom: 28 },
  pageContent: { paddingHorizontal: 12, paddingTop: 10 },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingBody: { flex: 1, minWidth: 0 },
  settingTitle: { fontSize: 15, fontWeight: '800' },
  settingDesc: { marginTop: 4, fontSize: 12, lineHeight: 18 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
  valueBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  valueBadgeText: { fontSize: 11, fontWeight: '700' },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 0.5, marginLeft: 68 },
  minutesSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  minutesPanel: { borderRadius: 16, padding: 12 },
  minutesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  formLabel: { fontSize: 12, fontWeight: '700' },
  minutesValue: { fontSize: 12, fontWeight: '800' },
  minutesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  minuteChip: {
    minWidth: 76,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  minuteChipText: { fontSize: 13, fontWeight: '700' },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  modalSheet: { width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden' },
  aboutSheet: { maxWidth: 380 },
  feedbackSheet: { maxWidth: 420 },
  modalHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  modalHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeroTextWrap: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { paddingHorizontal: 18, paddingBottom: 18 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1 },
  optionText: { fontSize: 15, fontWeight: '700' },
  optionHint: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  aboutIconText: { fontSize: 24, fontWeight: '800' },
  aboutDesc: { fontSize: 13, lineHeight: 20 },
  aboutInfoCard: { width: '100%', borderRadius: 18, padding: 14, marginTop: 16, gap: 12 },
  aboutInfoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  aboutInfoLabel: { fontSize: 13 },
  aboutInfoValue: { fontSize: 13, fontWeight: '700' },
  primaryButton: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  feedbackInputWrap: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackInput: { minHeight: 128, padding: 0, fontSize: 14 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButton: {
    flex: 1.35,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700' },
  modalConfirmText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});

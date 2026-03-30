import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../src/theme';
import { semesterApi } from '../src/services/api';
import { PrimaryHeroSection } from '../src/components/ui/PrimaryHeroSection';
import { AppCard } from '../src/components/ui/AppCard';
import { AppButton } from '../src/components/ui/AppButton';
import { AppSectionHeader } from '../src/components/ui/AppSectionHeader';

type SemesterStatus = 'active' | 'ended' | 'archived';

interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  weeksCount: number;
  currentWeek?: number;
  status: SemesterStatus;
}

export default function SemesterScreen() {
  const colors = useTheme();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [setAsCurrent, setSetAsCurrent] = useState(false);
  const [newSemester, setNewSemester] = useState({
    name: '',
    startDate: '',
    endDate: '',
    weeksCount: '',
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'startDate' | 'endDate'>('startDate');
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerDay, setPickerDay] = useState(1);

  const loadSemesters = useCallback(async () => {
    try {
      const data = await semesterApi.list();
      setSemesters(data.map(s => ({
        id: s.id.toString(),
        name: s.name,
        startDate: s.start_date,
        endDate: s.end_date,
        weeksCount: s.weeks_count,
        currentWeek: s.current_week ?? undefined,
        status: s.is_archived ? 'archived' as const : s.is_active ? 'active' as const : 'ended' as const,
      })));
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSemesters();
    }, [loadSemesters])
  );

  const years = Array.from({ length: 10 }, (_, index) => 2024 + index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const daysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const activeSemester = semesters.find((item) => item.status === 'active');
  const endedSemesters = semesters.filter((item) => item.status === 'ended');
  const archivedSemesters = semesters.filter((item) => item.status === 'archived');

  const totalSemesterCount = semesters.length;
  const totalArchivedCount = archivedSemesters.length;
  const activeProgress = activeSemester && activeSemester.currentWeek
    ? Math.min((activeSemester.currentWeek / activeSemester.weeksCount) * 100, 100)
    : 0;
  const totalWeeks = useMemo(() => semesters.reduce((sum, item) => sum + item.weeksCount, 0), [semesters]);

  const formatDate = (date: string) => date.replace(/-/g, '.');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

  const openDatePicker = (field: 'startDate' | 'endDate') => {
    const current = newSemester[field];
    if (current) {
      const [year, month, day] = current.split('-').map((item) => parseInt(item, 10));
      setPickerYear(year || 2026);
      setPickerMonth(month || 1);
      setPickerDay(day || 1);
    } else {
      const now = new Date();
      setPickerYear(now.getFullYear());
      setPickerMonth(now.getMonth() + 1);
      setPickerDay(now.getDate());
    }

    setDatePickerField(field);
    setDatePickerVisible(true);
  };

  const confirmDatePicker = () => {
    const safeDay = Math.min(pickerDay, daysInMonth);
    const value = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    setNewSemester((prev) => ({ ...prev, [datePickerField]: value }));
    setDatePickerVisible(false);
  };

  const resetCreateForm = () => {
    setNewSemester({ name: '', startDate: '', endDate: '', weeksCount: '' });
    setSetAsCurrent(false);
  };

  const closeCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(false);
  };

  const handleArchive = (semester: Semester) => {
    Alert.alert(
      '确认归档',
      '归档后该学期会进入只读状态，历史课程、成绩和考勤仍可查看，但不能继续编辑。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认归档',
          style: 'destructive',
          onPress: async () => {
            try {
              await semesterApi.archive(parseInt(semester.id, 10));
              await loadSemesters();
            } catch {}
          },
        },
      ]
    );
  };

  const handleSetActive = async (semester: Semester) => {
    try {
      await semesterApi.setActive(parseInt(semester.id, 10));
      await loadSemesters();
    } catch {}
  };

  const handleCreate = async () => {
    if (!newSemester.name.trim() || !newSemester.startDate.trim() || !newSemester.endDate.trim() || !newSemester.weeksCount.trim()) {
      Alert.alert('提示', '请完整填写学期名称、起止日期和总周数。');
      return;
    }
    try {
      await semesterApi.create({
        name: newSemester.name.trim(),
        start_date: newSemester.startDate.trim(),
        end_date: newSemester.endDate.trim(),
        weeks_count: parseInt(newSemester.weeksCount, 10) || 18,
        set_as_current: setAsCurrent,
      });
      await loadSemesters();
      closeCreateModal();
    } catch {}
  };

  const selectedDatePreview = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(Math.min(pickerDay, daysInMonth)).padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <PrimaryHeroSection
          paddingBottom={10}
          style={{ marginHorizontal: -14, marginBottom: 12 }}
        >
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={handleBack}
              activeOpacity={0.78}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroPageTitle}>学期管理</Text>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.78}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEyebrow}>学期状态看板</Text>
          <Text style={styles.heroTitle}>{activeSemester ? activeSemester.name : '尚未设置当前学期'}</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '学期总数', value: totalSemesterCount.toString() },
              { label: '累计周数', value: totalWeeks.toString() },
              { label: '已归档', value: totalArchivedCount.toString() },
            ].map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.heroStatItem,
                  index < 2 && { borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.14)' },
                ]}
              >
                <Text style={styles.heroStatValue}>{item.value}</Text>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </PrimaryHeroSection>

        {activeSemester && (
          <AppCard radius={18} padding="sm" style={{ padding: 14, marginBottom: 14 }}>
            <View style={styles.sectionRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>当前学期进度</Text>
                <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>当前正在进行的学期信息</Text>
              </View>
              <View style={[styles.activeBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.activeBadgeText, { color: colors.primary }]}>进行中</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>起止日期</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(activeSemester.startDate)} - {formatDate(activeSemester.endDate)}</Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>总周数</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{activeSemester.weeksCount} 周</Text>
              </View>
            </View>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>学期进度</Text>
              <Text style={[styles.progressValue, { color: colors.primary }]}>{activeSemester.currentWeek}/{activeSemester.weeksCount}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.primaryLight }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${activeProgress}%` }]} />
            </View>
          </AppCard>
        )}

        <AppSectionHeader title="历史学期" style={{ marginBottom: 10 }} />
        <Text style={[styles.sectionHint, { color: colors.textTertiary, marginBottom: 10 }]}>可重新启用，也可归档为只读</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {endedSemesters.length > 0 ? (
          <View style={styles.listSection}>
            {endedSemesters.map((semester) => (
              <AppCard key={semester.id} radius={18} padding="sm" style={{ padding: 14 }}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{semester.name}</Text>
                    <Text style={[styles.cardMeta, { color: colors.textTertiary }]}>
                      {formatDate(semester.startDate)} - {formatDate(semester.endDate)} · {semester.weeksCount} 周
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.statusChipText, { color: colors.textTertiary }]}>已结束</Text>
                  </View>
                </View>
                <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
                  <AppButton
                    label="设为当前"
                    variant="soft"
                    tone="primary"
                    size="md"
                    leftIconName="refresh-outline"
                    onPress={() => handleSetActive(semester)}
                    style={{ flex: 1, height: 38, borderRadius: 12 }}
                    textStyle={{ fontSize: 13 }}
                  />
                  <AppButton
                    label="归档"
                    variant="soft"
                    tone="error"
                    size="md"
                    leftIconName="archive-outline"
                    onPress={() => handleArchive(semester)}
                    style={{ flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.palette.orange.bg }}
                    textStyle={{ fontSize: 13, color: colors.palette.orange.text }}
                  />
                </View>
              </AppCard>
            ))}
          </View>
        ) : (
          <AppCard radius={20} padding="lg" style={{ marginBottom: 14 }}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>暂无历史学期</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>创建新学期后，往期学期会显示在这里。</Text>
          </AppCard>
        )}

        <AppSectionHeader title="已归档学期" style={{ marginBottom: 10 }} />
        <Text style={[styles.sectionHint, { color: colors.textTertiary, marginBottom: 10 }]}>归档后仅可查看，不可修改</Text>

        {archivedSemesters.length > 0 ? (
          <View style={styles.listSection}>
            {archivedSemesters.map((semester) => (
              <AppCard key={semester.id} radius={18} padding="sm" style={{ padding: 14, opacity: 0.92 }}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{semester.name}</Text>
                    <Text style={[styles.cardMeta, { color: colors.textTertiary }]}>
                      {formatDate(semester.startDate)} - {formatDate(semester.endDate)} · {semester.weeksCount} 周
                    </Text>
                  </View>
                  <View style={styles.archivedBadges}>
                    <View style={[styles.statusChip, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.statusChipText, { color: colors.textTertiary }]}>已归档</Text>
                    </View>
                    <View style={[styles.lockChip, { backgroundColor: colors.palette.orange.bg }]}>
                      <Ionicons name="lock-closed" size={10} color={colors.palette.orange.text} />
                      <Text style={[styles.lockChipText, { color: colors.palette.orange.text }]}>只读</Text>
                    </View>
                  </View>
                </View>
              </AppCard>
            ))}
          </View>
        ) : (
          <AppCard radius={20} padding="lg" style={{ marginBottom: 14 }}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>暂无归档学期</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>学期结束后归档，课程表、成绩和考勤记录仍可查看。</Text>
          </AppCard>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={closeCreateModal}>
        <View style={styles.modalOverlay}>
          <AppCard radius={24} padding="none" style={{ width: '100%', maxWidth: 420, overflow: 'hidden' }}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>创建学期</Text>
                <Text style={[styles.modalHint, { color: colors.textTertiary }]}>填写学期信息，开始新学期的教学管理</Text>
              </View>
              <TouchableOpacity onPress={closeCreateModal}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>学期名称</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="如：2025-2026学年第二学期"
                  placeholderTextColor={colors.textTertiary}
                  value={newSemester.name}
                  onChangeText={(value) => setNewSemester((prev) => ({ ...prev, name: value }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>开始日期</Text>
                <TouchableOpacity
                  style={[styles.dateField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  activeOpacity={0.75}
                  onPress={() => openDatePicker('startDate')}
                >
                  <Ionicons name="calendar-outline" size={16} color={newSemester.startDate ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.dateFieldText, { color: newSemester.startDate ? colors.text : colors.textTertiary }]}>
                    {newSemester.startDate || '选择开始日期'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>结束日期</Text>
                <TouchableOpacity
                  style={[styles.dateField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  activeOpacity={0.75}
                  onPress={() => openDatePicker('endDate')}
                >
                  <Ionicons name="calendar-outline" size={16} color={newSemester.endDate ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.dateFieldText, { color: newSemester.endDate ? colors.text : colors.textTertiary }]}>
                    {newSemester.endDate || '选择结束日期'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>总周数</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="如：18"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  value={newSemester.weeksCount}
                  onChangeText={(value) => setNewSemester((prev) => ({ ...prev, weeksCount: value }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>是否设为当前学期</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleCard,
                    { backgroundColor: setAsCurrent ? colors.primaryLight : colors.surfaceSecondary, borderColor: setAsCurrent ? colors.primary : colors.border },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSetAsCurrent((prev) => !prev)}
                >
                  <Ionicons name={setAsCurrent ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={setAsCurrent ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.toggleCardText, { color: setAsCurrent ? colors.primary : colors.textSecondary }]}>创建后立即作为当前学期使用</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <AppButton
                label="取消"
                variant="outline"
                tone="primary"
                size="lg"
                onPress={closeCreateModal}
                style={{ flex: 1, borderColor: colors.border }}
                textStyle={{ color: colors.textSecondary }}
              />
              <AppButton
                label="创建学期"
                variant="solid"
                tone="primary"
                size="lg"
                onPress={handleCreate}
                style={{ flex: 1.35 }}
              />
            </View>
          </AppCard>
        </View>
      </Modal>

      <Modal visible={datePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
        <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setDatePickerVisible(false)}>
          <View style={[styles.datePickerCard, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.datePickerHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.datePickerTitle, { color: colors.text }]}>{datePickerField === 'startDate' ? '选择开始日期' : '选择结束日期'}</Text>
            <View style={styles.dateColumns}>
              <View style={styles.dateColumn}>
                <Text style={[styles.dateColumnLabel, { color: colors.textTertiary }]}>年</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      style={[styles.dateOption, pickerYear === year && { backgroundColor: colors.primaryLight }]}
                      onPress={() => setPickerYear(year)}
                    >
                      <Text style={[styles.dateOptionText, { color: pickerYear === year ? colors.primary : colors.text }]}>{year}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateColumn}>
                <Text style={[styles.dateColumnLabel, { color: colors.textTertiary }]}>月</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {months.map((month) => (
                    <Pressable
                      key={month}
                      style={[styles.dateOption, pickerMonth === month && { backgroundColor: colors.primaryLight }]}
                      onPress={() => setPickerMonth(month)}
                    >
                      <Text style={[styles.dateOptionText, { color: pickerMonth === month ? colors.primary : colors.text }]}>{month}月</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateColumn}>
                <Text style={[styles.dateColumnLabel, { color: colors.textTertiary }]}>日</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <Pressable
                      key={day}
                      style={[styles.dateOption, pickerDay === day && { backgroundColor: colors.primaryLight }]}
                      onPress={() => setPickerDay(day)}
                    >
                      <Text style={[styles.dateOptionText, { color: pickerDay === day ? colors.primary : colors.text }]}>{day}日</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={[styles.datePreview, { color: colors.primary }]}>{selectedDatePreview}</Text>
            <View style={styles.modalFooter}>
              <AppButton
                label="取消"
                variant="outline"
                tone="primary"
                size="lg"
                onPress={() => setDatePickerVisible(false)}
                style={{ flex: 1, borderColor: colors.border }}
                textStyle={{ color: colors.textSecondary }}
              />
              <AppButton
                label="确定"
                variant="solid"
                tone="primary"
                size="lg"
                onPress={confirmDatePicker}
                style={{ flex: 1.35 }}
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
  topSection: { paddingHorizontal: 14, zIndex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 0, paddingBottom: 24 },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBackButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroActionButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroPageTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 4,
  },
  heroStatItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12, marginTop: 4 },
  activeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  activeBadgeText: { fontSize: 12, fontWeight: '700' },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailItem: { flex: 1, borderRadius: 16, padding: 10 },
  detailLabel: { fontSize: 12, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressValue: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  listSection: { gap: 10, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  archivedBadges: { alignItems: 'flex-end', gap: 6 },
  lockChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  lockChipText: { fontSize: 11, fontWeight: '700' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHint: { fontSize: 12, marginTop: 4 },
  modalBody: { paddingHorizontal: 14, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  formInput: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  dateField: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFieldText: { fontSize: 14, fontWeight: '500' },
  toggleCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleCardText: { fontSize: 14, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 20, paddingTop: 4 },
  datePickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  datePickerCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, maxHeight: '78%' },
  datePickerHandle: { width: 44, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 14 },
  datePickerTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  dateColumns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  dateColumn: { flex: 1, maxHeight: 260 },
  dateColumnLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  dateOption: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  dateOptionText: { fontSize: 14, fontWeight: '600' },
  datePreview: { textAlign: 'center', fontSize: 16, fontWeight: '700', marginTop: 16 },
});

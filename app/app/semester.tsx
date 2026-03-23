import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

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

const mockSemesters: Semester[] = [
  { id: '1', name: '2025-2026学年第二学期', startDate: '2026-02-17', endDate: '2026-06-30', weeksCount: 18, currentWeek: 8, status: 'active' },
  { id: '2', name: '2025-2026学年第一学期', startDate: '2025-09-01', endDate: '2026-01-15', weeksCount: 20, status: 'ended' },
  { id: '3', name: '2024-2025学年第二学期', startDate: '2025-02-17', endDate: '2025-06-30', weeksCount: 18, status: 'archived' },
];

export default function SemesterScreen() {
  const colors = useTheme();
  const [semesters, setSemesters] = useState<Semester[]>(mockSemesters);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [setAsCurrent, setSetAsCurrent] = useState(false);
  const [newSemester, setNewSemester] = useState({
    name: '',
    startDate: '',
    endDate: '',
    weeksCount: '',
  });

  // 日期选择器状态
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'startDate' | 'endDate'>('startDate');
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerDay, setPickerDay] = useState(1);

  const years = Array.from({ length: 10 }, (_, i) => 2024 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const openDatePicker = (field: 'startDate' | 'endDate') => {
    const current = newSemester[field];
    if (current) {
      const parts = current.split('-');
      setPickerYear(parseInt(parts[0]) || 2026);
      setPickerMonth(parseInt(parts[1]) || 1);
      setPickerDay(parseInt(parts[2]) || 1);
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
    const day = Math.min(pickerDay, daysInMonth);
    const dateStr = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setNewSemester({ ...newSemester, [datePickerField]: dateStr });
    setDatePickerVisible(false);
  };

  const activeSemester = semesters.find((s) => s.status === 'active');
  const endedSemesters = semesters.filter((s) => s.status === 'ended');
  const archivedSemesters = semesters.filter((s) => s.status === 'archived');

  const formatDate = (date: string) => date.replace(/-/g, '.');

  const handleArchive = (semester: Semester) => {
    Alert.alert(
      '确认归档',
      '归档后该学期数据将变为只读，无法再进行修改操作。确定要归档吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认归档',
          style: 'destructive',
          onPress: () => {
            setSemesters((prev) =>
              prev.map((s) => (s.id === semester.id ? { ...s, status: 'archived' as SemesterStatus } : s))
            );
          },
        },
      ]
    );
  };

  const handleSetActive = (semester: Semester) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id === semester.id) return { ...s, status: 'active' as SemesterStatus, currentWeek: 1 };
        if (s.status === 'active') return { ...s, status: 'ended' as SemesterStatus, currentWeek: undefined };
        return s;
      })
    );
  };

  const handleCreate = () => {
    if (!newSemester.name.trim() || !newSemester.startDate.trim() || !newSemester.endDate.trim() || !newSemester.weeksCount.trim()) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }

    const created: Semester = {
      id: Date.now().toString(),
      name: newSemester.name.trim(),
      startDate: newSemester.startDate.trim(),
      endDate: newSemester.endDate.trim(),
      weeksCount: parseInt(newSemester.weeksCount, 10) || 18,
      status: setAsCurrent ? 'active' : 'ended',
      currentWeek: setAsCurrent ? 1 : undefined,
    };

    setSemesters((prev) => {
      let updated = [...prev];
      if (setAsCurrent) {
        updated = updated.map((s) =>
          s.status === 'active' ? { ...s, status: 'ended' as SemesterStatus, currentWeek: undefined } : s
        );
      }
      return [created, ...updated];
    });

    setNewSemester({ name: '', startDate: '', endDate: '', weeksCount: '' });
    setSetAsCurrent(false);
    setShowCreateModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>学期管理</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 当前学期 */}
        {activeSemester && (
          <View style={styles.activeSection}>
            <View
              style={[
                styles.activeCard,
                {
                  backgroundColor: colors.primaryLight,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              {/* 当前学期 badge */}
              <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.activeBadgeText}>当前学期</Text>
              </View>

              <Text style={[styles.activeName, { color: colors.text }]}>{activeSemester.name}</Text>

              {/* 日期行 */}
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {formatDate(activeSemester.startDate)} - {formatDate(activeSemester.endDate)}
                </Text>
              </View>

              {/* 周信息 */}
              <Text style={[styles.weekInfo, { color: colors.textSecondary }]}>
                共{activeSemester.weeksCount}周，当前第{activeSemester.currentWeek}周
              </Text>

              {/* 进度条 */}
              <View style={styles.progressSection}>
                <View style={[styles.progressTrack, { backgroundColor: colors.primary + '20' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((activeSemester.currentWeek || 0) / activeSemester.weeksCount) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.primaryDark }]}>
                  {activeSemester.currentWeek}/{activeSemester.weeksCount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 历史学期 */}
        {endedSemesters.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.palette.blue.text }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>历史学期</Text>
            </View>

            {endedSemesters.map((semester) => (
              <View key={semester.id} style={[styles.semesterCard, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{semester.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.textTertiary }]}>已结束</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                  <Text style={[styles.cardDateText, { color: colors.textTertiary }]}>
                    {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.outlinedBtn, { borderColor: colors.primary }]}
                    onPress={() => handleSetActive(semester)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.outlinedBtnText, { color: colors.primary }]}>设为当前</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.outlinedBtn, { borderColor: colors.palette.orange.text }]}
                    onPress={() => handleArchive(semester)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.outlinedBtnText, { color: colors.palette.orange.text }]}>归档</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 已归档学期 */}
        {archivedSemesters.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>已归档学期</Text>
            </View>

            {archivedSemesters.map((semester) => (
              <View key={semester.id} style={[styles.semesterCard, { backgroundColor: colors.surface, opacity: 0.7 }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{semester.name}</Text>
                  <View style={styles.archivedBadgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.textTertiary }]}>已归档</Text>
                    </View>
                    <View style={[styles.readonlyBadge, { backgroundColor: colors.palette.orange.bg }]}>
                      <Ionicons name="lock-closed" size={10} color={colors.palette.orange.text} />
                      <Text style={[styles.readonlyText, { color: colors.palette.orange.text }]}>只读</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                  <Text style={[styles.cardDateText, { color: colors.textTertiary }]}>
                    {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 创建学期弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>创建学期</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>学期名称</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="如：2025-2026学年第二学期"
                  placeholderTextColor={colors.textTertiary}
                  value={newSemester.name}
                  onChangeText={(t) => setNewSemester({ ...newSemester, name: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>开始日期</Text>
                <TouchableOpacity
                  style={[styles.datePickerBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => openDatePicker('startDate')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={16} color={newSemester.startDate ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.datePickerText, { color: newSemester.startDate ? colors.text : colors.textTertiary }]}>
                    {newSemester.startDate || '选择开始日期'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>结束日期</Text>
                <TouchableOpacity
                  style={[styles.datePickerBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => openDatePicker('endDate')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={16} color={newSemester.endDate ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.datePickerText, { color: newSemester.endDate ? colors.text : colors.textTertiary }]}>
                    {newSemester.endDate || '选择结束日期'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>总周数</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border, width: 100 }]}
                  placeholder="如：18"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  value={newSemester.weeksCount}
                  onChangeText={(t) => setNewSemester({ ...newSemester, weeksCount: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>设为当前学期</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    {
                      backgroundColor: setAsCurrent ? colors.primaryLight : colors.surfaceSecondary,
                      borderColor: setAsCurrent ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSetAsCurrent(!setAsCurrent)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleChipText,
                      { color: setAsCurrent ? colors.primary : colors.textTertiary },
                    ]}
                  >
                    {setAsCurrent ? '是' : '否'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setNewSemester({ name: '', startDate: '', endDate: '', weeksCount: '' });
                  setSetAsCurrent(false);
                  setShowCreateModal(false);
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
              >
                <Text style={styles.modalConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 日期选择器弹窗 */}
      <Modal visible={datePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
        <TouchableOpacity style={styles.dateModalOverlay} activeOpacity={1} onPress={() => setDatePickerVisible(false)}>
          <View style={[styles.dateModalContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.dateModalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.dateModalTitle, { color: colors.text }]}>
              {datePickerField === 'startDate' ? '选择开始日期' : '选择结束日期'}
            </Text>

            {/* 年月日选择 */}
            <View style={styles.dateColumns}>
              {/* 年 */}
              <View style={styles.dateColumn}>
                <Text style={[styles.dateColumnLabel, { color: colors.textTertiary }]}>年</Text>
                <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {years.map((y) => (
                    <Pressable
                      key={y}
                      style={[styles.dateOption, pickerYear === y && { backgroundColor: colors.primaryLight }]}
                      onPress={() => setPickerYear(y)}
                    >
                      <Text style={[styles.dateOptionText, { color: pickerYear === y ? colors.primary : colors.text, fontWeight: pickerYear === y ? '700' : '400' }]}>
                        {y}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 月 */}
              <View style={styles.dateColumn}>
                <Text style={[styles.dateColumnLabel, { color: colors.textTertiary }]}>月</Text>
                <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {months.map((m) => (
                    <Pressable
                      key={m}
                      style={[styles.dateOption, pickerMonth === m && { backgroundColor: colors.primaryLight }]}
                      onPress={() => setPickerMonth(m)}
                    >
                      <Text style={[styles.dateOptionText, { color: pickerMonth === m ? colors.primary : colors.text, fontWeight: pickerMonth === m ? '700' : '400' }]}>
                        {m}月
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 日 */}
              <View style={styles.dateColumn}>
                <Text style={[styles.dateColumnLabel, { color: colors.textTertiary }]}>日</Text>
                <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {days.map((d) => (
                    <Pressable
                      key={d}
                      style={[styles.dateOption, pickerDay === d && { backgroundColor: colors.primaryLight }]}
                      onPress={() => setPickerDay(d)}
                    >
                      <Text style={[styles.dateOptionText, { color: pickerDay === d ? colors.primary : colors.text, fontWeight: pickerDay === d ? '700' : '400' }]}>
                        {d}日
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* 预览 */}
            <Text style={[styles.datePreview, { color: colors.primary }]}>
              {pickerYear}-{String(pickerMonth).padStart(2, '0')}-{String(Math.min(pickerDay, daysInMonth)).padStart(2, '0')}
            </Text>

            <View style={styles.dateModalActions}>
              <TouchableOpacity style={[styles.dateModalCancelBtn, { borderColor: colors.border }]} onPress={() => setDatePickerVisible(false)}>
                <Text style={[styles.dateModalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateModalConfirmBtn, { backgroundColor: colors.primary }]} onPress={confirmDatePicker}>
                <Text style={styles.dateModalConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Nav
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

  // Active semester
  activeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activeCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activeBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  activeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingRight: 80,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
  },
  weekInfo: {
    fontSize: 13,
    marginBottom: 12,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Semester card
  semesterCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDateText: {
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  outlinedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlinedBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Archived
  archivedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readonlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readonlyText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    outlineStyle: 'none',
  } as any,
  toggleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  // === Date Picker Button ===
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 14,
  },
  // === Date Picker Modal ===
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  dateModalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 20 },
  dateModalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  dateModalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  dateColumns: { flexDirection: 'row', gap: 10, height: 200 },
  dateColumn: { flex: 1 },
  dateColumnLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  dateScroll: { flex: 1 },
  dateOption: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  dateOptionText: { fontSize: 15 },
  datePreview: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  dateModalActions: { flexDirection: 'row', gap: 10 },
  dateModalCancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dateModalCancelText: { fontSize: 14, fontWeight: '600' },
  dateModalConfirmBtn: { flex: 1.5, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateModalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

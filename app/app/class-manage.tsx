import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../src/theme';
import { classApi } from '../src/services/api';
import { PrimaryHeroSection, AppCard, AppButton, AppSectionHeader } from '../src/components/ui';

interface ClassInfo {
  id: string;
  grade: string;
  gradeNumber: number;
  classNumber: number;
  name: string;
  studentCount: number;
  subjects: string[];
}

const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const gradeColorKeys = ['blue', 'green', 'orange', 'red', 'purple', 'cyan'] as const;
const getGradeColorKey = (gradeNum: number) => gradeColorKeys[(gradeNum - 1) % 6];

export default function ClassManageScreen() {
  const colors = useTheme();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [classNumber, setClassNumber] = useState('');

  const totalStudents = useMemo(() => classes.reduce((sum, item) => sum + item.studentCount, 0), [classes]);
  const gradeCount = useMemo(() => new Set(classes.map((item) => item.grade)).size, [classes]);
  const averageStudents = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

  const loadClasses = useCallback(async () => {
    try {
      const data = await classApi.list();
      setClasses(data.map(c => ({
        id: c.id.toString(),
        grade: c.grade,
        gradeNumber: c.grade_number,
        classNumber: c.class_number,
        name: c.name,
        studentCount: c.student_count,
        subjects: [],
      })));
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  const handleCreate = async () => {
    if (!classNumber.trim()) return;
    setLoading(true);
    try {
      await classApi.create(selectedGrade, parseInt(classNumber, 10));
      await loadClasses();
      closeModal();
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls: ClassInfo) => {
    setEditingClass(cls);
    setSelectedGrade(cls.gradeNumber);
    setClassNumber(cls.classNumber.toString());
    setShowCreateModal(true);
  };

  const handleSaveEdit = () => {
    if (!classNumber.trim() || !editingClass) return;

    const grade = gradeNames[selectedGrade - 1];
    setClasses((prev) =>
      prev.map((item) =>
        item.id === editingClass.id
          ? {
              ...item,
              grade,
              gradeNumber: selectedGrade,
              classNumber: parseInt(classNumber, 10),
              name: `${grade}${classNumber}班`,
            }
          : item
      )
    );
    closeModal();
  };

  const handleDelete = (cls: ClassInfo) => {
    Alert.alert(
      '删除班级',
      `确定删除"${cls.name}"吗？删除后班级入口会移除，学生信息将保留待重新分配。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => setClasses((prev) => prev.filter((item) => item.id !== cls.id)),
        },
      ]
    );
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingClass(null);
    setClassNumber('');
    setSelectedGrade(3);
  };

  const previewName = `${gradeNames[selectedGrade - 1]}${classNumber || 'X'}班`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <PrimaryHeroSection paddingBottom={10} style={styles.heroCard}>
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={handleBack}
              activeOpacity={0.78}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroPageTitle}>班级管理</Text>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.78}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEyebrow}>班级管理总览</Text>
          <Text style={styles.heroTitle}>已管理 {classes.length} 个班级</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '学生总数', value: totalStudents.toString() },
              { label: '覆盖年级', value: gradeCount.toString() },
              { label: '平均规模', value: `${averageStudents}` },
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

        <AppCard radius={18} padding="sm" style={styles.quickCardSpacing}>
          <AppSectionHeader title="管理入口" style={styles.sectionHeaderInCard} />
          <View style={styles.quickGrid}>
            {[
              { label: '学期管理', desc: '查看当前学期与历史归档', icon: 'calendar-outline' as const, colorKey: 'blue' as const, route: '/semester' },
              { label: '年级升迁', desc: '批量升班与毕业归档', icon: 'trending-up-outline' as const, colorKey: 'green' as const, route: '/promotion' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.quickItem, { backgroundColor: colors.surfaceSecondary }]}
                activeOpacity={0.75}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                  <Ionicons name={item.icon} size={18} color={colors.palette[item.colorKey].text} />
                </View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.quickDesc, { color: colors.textTertiary }]}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        <AppSectionHeader
          title="班级列表"
          count={classes.length}
          actionLabel="新增班级"
          onActionPress={() => setShowCreateModal(true)}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {classes.length === 0 ? (
          <AppCard radius={20} padding="lg" style={styles.emptyCardContent}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="school-outline" size={32} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>还没有创建班级</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>先添加班级，再配置学生和课程表。</Text>
          </AppCard>
        ) : (
          <View style={styles.listSection}>
            {classes.map((cls) => {
              const paletteKey = getGradeColorKey(cls.gradeNumber);
              const gradePalette = colors.palette[paletteKey];

              return (
                <TouchableOpacity
                  key={cls.id}
                  activeOpacity={0.78}
                  onPress={() => router.push('/(tabs)/students' as any)}
                >
                  <AppCard radius={18} padding="none" style={styles.classCardRow}>
                    <View style={[styles.classAccent, { backgroundColor: gradePalette.text }]} />
                    <View style={styles.classBody}>
                      <View style={styles.classHeader}>
                        <View style={styles.classHeaderLeft}>
                          <Text style={[styles.className, { color: colors.text }]}>{cls.name}</Text>
                          <View style={[styles.gradeBadge, { backgroundColor: gradePalette.bg }]}>
                            <Text style={[styles.gradeBadgeText, { color: gradePalette.text }]}>{cls.grade}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </View>

                      <View style={styles.metaRow}>
                        <View style={[styles.metaChip, { backgroundColor: colors.surfaceSecondary }]}>
                          <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{cls.studentCount} 名学生</Text>
                        </View>
                        <View style={[styles.metaChip, { backgroundColor: colors.surfaceSecondary }]}>
                          <Ionicons name="book-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                            {cls.subjects.length > 0 ? cls.subjects.join(' / ') : '待补充学科'}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
                        <AppButton
                          label="编辑"
                          leftIconName="create-outline"
                          variant="soft"
                          tone="info"
                          size="md"
                          style={styles.footerBtn}
                          onPress={() => handleEdit(cls)}
                        />
                        <AppButton
                          label="删除"
                          leftIconName="trash-outline"
                          variant="soft"
                          tone="error"
                          size="md"
                          style={styles.footerBtn}
                          onPress={() => handleDelete(cls)}
                        />
                      </View>
                    </View>
                  </AppCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <AppCard radius={24} padding="none" style={styles.modalCardSize}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{editingClass ? '编辑班级' : '创建班级'}</Text>
                <Text style={[styles.modalHint, { color: colors.textTertiary }]}>创建后可继续添加学生和安排课程</Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.previewCard, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.previewLabel, { color: colors.primary }]}>班级预览</Text>
              <Text style={[styles.previewValue, { color: colors.text }]}>{previewName}</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>选择年级</Text>
                <View style={styles.chipRow}>
                  {gradeNames.map((grade, index) => {
                    const gradeNumber = index + 1;
                    const paletteKey = getGradeColorKey(gradeNumber);
                    const palette = colors.palette[paletteKey];
                    const selected = selectedGrade === gradeNumber;

                    return (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? palette.bg : colors.surfaceSecondary,
                            borderColor: selected ? palette.text : colors.border,
                          },
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setSelectedGrade(gradeNumber)}
                      >
                        <Text style={[styles.chipText, { color: selected ? palette.text : colors.textSecondary }]}>{grade}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级序号</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="如：1、2、3"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  value={classNumber}
                  onChangeText={setClassNumber}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <AppButton
                label="取消"
                variant="outline"
                tone="primary"
                style={styles.modalCancelBtn}
                onPress={closeModal}
              />
              <AppButton
                label={editingClass ? '保存修改' : '确认创建'}
                variant="solid"
                tone="primary"
                loading={loading}
                style={styles.modalConfirmBtn}
                onPress={editingClass ? handleSaveEdit : handleCreate}
              />
            </View>
          </AppCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 14, zIndex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 0, paddingBottom: 24 },
  heroCard: {
    marginHorizontal: -14,
    marginBottom: 12,
  },
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
  quickCardSpacing: { marginBottom: 12 },
  sectionHeaderInCard: { marginBottom: 8 },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickItem: { flex: 1, borderRadius: 16, padding: 12 },
  quickIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  quickDesc: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  emptyCardContent: { alignItems: 'center' },
  emptyIconBox: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  listSection: { gap: 10 },
  classCardRow: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  classAccent: { width: 5 },
  classBody: { flex: 1, padding: 14 },
  classHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  classHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 },
  className: { fontSize: 16, fontWeight: '700' },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  gradeBadgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  metaChipText: { fontSize: 12, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  footerBtn: { flex: 1, height: 38, borderRadius: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCardSize: { width: '100%', maxWidth: 420 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHint: { fontSize: 12, marginTop: 4 },
  previewCard: { marginHorizontal: 20, borderRadius: 16, padding: 14 },
  previewLabel: { fontSize: 12, fontWeight: '700' },
  previewValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  modalBody: { paddingHorizontal: 14, paddingVertical: 16 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  formInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 20 },
  modalCancelBtn: { flex: 1 },
  modalConfirmBtn: { flex: 1.4 },
});

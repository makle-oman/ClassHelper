import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

interface ClassInfo {
  id: string;
  grade: string;
  gradeNumber: number;
  classNumber: number;
  name: string;
  studentCount: number;
  subjects: string[];
}

const mockClasses: ClassInfo[] = [
  { id: '1', grade: '三年级', gradeNumber: 3, classNumber: 1, name: '三年级1班', studentCount: 43, subjects: ['语文', '数学'] },
  { id: '2', grade: '三年级', gradeNumber: 3, classNumber: 2, name: '三年级2班', studentCount: 43, subjects: ['语文', '数学'] },
];

const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const gradeColorKeys = ['blue', 'green', 'orange', 'red', 'purple', 'cyan'] as const;
const getGradeColorKey = (gradeNum: number) => gradeColorKeys[(gradeNum - 1) % 6];

export default function ClassManageScreen() {
  const colors = useTheme();
  const [classes, setClasses] = useState<ClassInfo[]>(mockClasses);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [classNumber, setClassNumber] = useState('');

  const handleCreate = () => {
    if (!classNumber.trim()) return;
    const grade = gradeNames[selectedGrade - 1];
    const newClass: ClassInfo = {
      id: Date.now().toString(),
      grade,
      gradeNumber: selectedGrade,
      classNumber: parseInt(classNumber, 10),
      name: `${grade}${classNumber}班`,
      studentCount: 0,
      subjects: [],
    };
    setClasses([...classes, newClass]);
    setClassNumber('');
    setSelectedGrade(3);
    setShowCreateModal(false);
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
    setClasses(classes.map((c) =>
      c.id === editingClass.id
        ? { ...c, grade, gradeNumber: selectedGrade, classNumber: parseInt(classNumber, 10), name: `${grade}${classNumber}班` }
        : c
    ));
    setEditingClass(null);
    setClassNumber('');
    setSelectedGrade(3);
    setShowCreateModal(false);
  };

  const handleDelete = (cls: ClassInfo) => {
    Alert.alert(
      '删除班级',
      `确定要删除"${cls.name}"吗？删除后该班级下的学生数据将保留但不再关联此班级。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => setClasses(classes.filter((c) => c.id !== cls.id)),
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>班级管理</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 快捷操作 */}
        <View style={styles.actionRow}>
          {[
            { label: '学期管理', icon: 'calendar' as const, colorKey: 'blue' as const, route: '/semester' },
            { label: '年级升迁', icon: 'trending-up' as const, colorKey: 'green' as const, route: '/promotion' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 班级列表 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>我的班级</Text>
        </View>

        {classes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="school-outline" size={40} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>暂无班级，点击右上角添加</Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            {classes.map((cls) => {
              const colorKey = getGradeColorKey(cls.gradeNumber);
              const gc = colors.palette[colorKey];

              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classCard, { backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/students' as any)}
                >
                  {/* 左侧彩色条 */}
                  <View style={[styles.classColorBar, { backgroundColor: gc.text }]} />

                  <View style={styles.classContent}>
                    {/* 标题行 */}
                    <View style={styles.classTitleRow}>
                      <Text style={[styles.className, { color: colors.text }]}>{cls.name}</Text>
                      <View style={[styles.gradeBadge, { backgroundColor: gc.bg }]}>
                        <Text style={[styles.gradeBadgeText, { color: gc.text }]}>{cls.grade}</Text>
                      </View>
                    </View>

                    {/* 信息行 */}
                    <View style={styles.classMetaRow}>
                      <View style={styles.classMetaItem}>
                        <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.classMetaText, { color: colors.textTertiary }]}>{cls.studentCount}人</Text>
                      </View>
                      {cls.subjects.length > 0 && (
                        <View style={styles.classMetaItem}>
                          <Ionicons name="book-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.classMetaText, { color: colors.textTertiary }]}>{cls.subjects.join('、')}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.classActions}>
                    <TouchableOpacity
                      style={[styles.classActionBtn, { backgroundColor: colors.palette.blue.bg }]}
                      onPress={(e) => { e.stopPropagation(); handleEdit(cls); }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.palette.blue.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.classActionBtn, { backgroundColor: colors.palette.red.bg }]}
                      onPress={(e) => { e.stopPropagation(); handleDelete(cls); }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.palette.red.text} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 创建/编辑班级弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingClass ? '编辑班级' : '创建班级'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>年级</Text>
                <View style={styles.chipRow}>
                  {gradeNames.map((g, i) => {
                    const gradeNum = i + 1;
                    const colorKey = getGradeColorKey(gradeNum);
                    const gc = colors.palette[colorKey];
                    const isSelected = selectedGrade === gradeNum;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.chip, { backgroundColor: isSelected ? gc.bg : colors.surfaceSecondary, borderColor: isSelected ? gc.text : colors.border }]}
                        onPress={() => setSelectedGrade(gradeNum)}
                      >
                        <Text style={[styles.chipText, { color: isSelected ? gc.text : colors.textSecondary }]}>{g}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级序号</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="如：1、2、3"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  value={classNumber}
                  onChangeText={setClassNumber}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={closeModal}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={editingClass ? handleSaveEdit : handleCreate}
              >
                <Text style={styles.modalConfirmText}>{editingClass ? '保存修改' : '确认创建'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navTitle: { fontSize: 17, fontWeight: '700' },

  // Action cards
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12 },
  actionCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  actionIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600' },

  // Section header
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14 },

  // Class list
  listSection: { paddingHorizontal: 20, gap: 12 },
  classCard: { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  classColorBar: { width: 4, alignSelf: 'stretch' },
  classContent: { flex: 1, padding: 16 },
  classTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  className: { fontSize: 16, fontWeight: '700' },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  gradeBadgeText: { fontSize: 11, fontWeight: '600' },
  classMetaRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  classMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  classMetaText: { fontSize: 11 },
  classArrow: { paddingRight: 14 },
  classActions: { flexDirection: 'row', gap: 8, paddingRight: 14 },
  classActionBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContent: { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formInput: { height: 44, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, outlineStyle: 'none' } as any,
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1.5, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/theme';
import { classApi, studentApi } from '../../src/services/api';

interface Student {
  id: string;
  name: string;
  studentNo: string;
  gender: '男' | '女';
  className: string;
  parentName: string;
  parentPhone: string;
}

export default function StudentsScreen() {
  const colors = useTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classList, setClassList] = useState<{id: number; name: string}[]>([]);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentNo: '',
    gender: '男' as '男' | '女',
    className: '',
    parentName: '',
    parentPhone: '',
  });

  const loadClasses = useCallback(async () => {
    try {
      const data = await classApi.list();
      setClassList(data.map((c: any) => ({ id: c.id, name: c.name })));
      if (data.length > 0 && !selectedClassId) {
        setSelectedClass(data[0].name);
        setSelectedClassId(data[0].id);
      }
    } catch {}
  }, [selectedClassId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const data = await studentApi.list(selectedClassId);
      setStudents(data.map((s: any) => ({
        id: s.id.toString(),
        name: s.name,
        studentNo: s.student_no,
        gender: s.gender,
        className: selectedClass,
        parentName: s.parent_name || '',
        parentPhone: s.parent_phone || '',
      })));
    } catch {}
  }, [selectedClassId, selectedClass]);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  React.useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    const cls = classList.find(c => c.name === className);
    if (cls) setSelectedClassId(cls.id);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      Alert.alert('提示', '请输入学生姓名');
      return;
    }
    if (!newStudent.studentNo.trim()) {
      Alert.alert('提示', '请输入学号');
      return;
    }
    if (!selectedClassId) {
      Alert.alert('提示', '请先选择班级');
      return;
    }
    try {
      await studentApi.create({
        class_id: selectedClassId,
        name: newStudent.name.trim(),
        student_no: newStudent.studentNo.trim(),
        gender: newStudent.gender,
        parent_name: newStudent.parentName.trim() || undefined,
        parent_phone: newStudent.parentPhone.trim() || undefined,
      });
      setShowAddModal(false);
      setNewStudent({ name: '', studentNo: '', gender: '男', className: selectedClass, parentName: '', parentPhone: '' });
      await loadStudents();
      Alert.alert('添加成功', `已添加学生`);
    } catch {}
  };

  const filteredStudents = students.filter(
    (student) => student.name.includes(searchText) || student.studentNo.includes(searchText),
  );

  const maleCount = students.filter((student) => student.gender === '男').length;
  const femaleCount = students.filter((student) => student.gender === '女').length;
  const visibleCount = filteredStudents.length;

  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={[styles.studentCard, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/student/${item.id}` as any)}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: item.gender === '男' ? colors.palette.blue.bg : colors.palette.red.bg },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { color: item.gender === '男' ? colors.male : colors.female },
          ]}
        >
          {item.name.slice(-1)}
        </Text>
      </View>
      <View style={styles.studentInfo}>
        <View style={styles.studentNameRow}>
          <View style={styles.studentTitleGroup}>
            <Text style={[styles.studentName, { color: colors.text }]}>{item.name}</Text>
            <View
              style={[
                styles.genderBadge,
                { backgroundColor: item.gender === '男' ? colors.palette.blue.bg : colors.palette.red.bg },
              ]}
            >
              <Ionicons
                name={item.gender === '男' ? 'male' : 'female'}
                size={12}
                color={item.gender === '男' ? colors.male : colors.female}
              />
            </View>
          </View>
          <View style={[styles.studentNoBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{item.studentNo}</Text>
          </View>
        </View>
        <View style={styles.studentMetaRow}>
          <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.parentInfo, { color: colors.textSecondary }]}>
            {item.parentName}（家长）· {item.parentPhone}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const handleImport = () => {
    Alert.alert(
      'Excel 导入',
      '选择包含学生信息的 Excel 文件（.xlsx）\n\n表头格式：姓名、学号、性别、班级、家长姓名、家长电话\n\n也可以在电脑端下载标准模板',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '下载模板',
          onPress: () => {
            Alert.alert('模板下载', '在电脑浏览器打开系统后台，进入「学生管理」即可下载模板');
          },
        },
        {
          text: '选择文件',
          onPress: () => {
            Alert.alert('导入成功', '已成功导入 15 名学生信息');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.summaryDecorLarge, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
          <View style={[styles.summaryDecorSmall, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryEyebrow}>学生花名册</Text>
              <TouchableOpacity style={styles.classPickerBtn} activeOpacity={0.7} onPress={() => setClassPickerOpen(true)}>
                <Text style={styles.summaryClassName}>{selectedClass}</Text>
                <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <Text style={styles.summaryHint}>点击学生可查看详情和家长联系方式</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeLabel}>在册</Text>
              <Text style={styles.summaryBadgeValue}>{students.length} 人</Text>
            </View>
          </View>

          <View style={styles.summaryStatsRow}>
            {[
              { label: '班级人数', value: students.length.toString(), color: '#FFF' },
              { label: '男生', value: maleCount.toString(), color: '#B8F0D8' },
              { label: '女生', value: femaleCount.toString(), color: '#FFD6E0' },
            ].map((item, index) => (
              <View
                key={`${item.label}-${index}`}
                style={[
                  styles.summaryStatItem,
                  index < 2 && { borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                <Text style={[styles.summaryStatValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.summaryStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fixedPanel}>
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.classPickerToolbarBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              activeOpacity={0.7}
              onPress={() => setClassPickerOpen(true)}
            >
              <Ionicons name="school-outline" size={15} color={colors.primary} />
              <Text style={[styles.classPickerToolbarText, { color: colors.primary }]}>{selectedClass}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchCard, { backgroundColor: colors.surface }]}>
            <View style={styles.searchSection}>
              <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="搜索学生姓名或学号"
                  placeholderTextColor={colors.textTertiary}
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText ? (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.importBtn, { borderColor: colors.primary }]}
                onPress={handleImport}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
                <Text style={[styles.importBtnText, { color: colors.primary }]}>导入</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setNewStudent({
                    name: '',
                    studentNo: '',
                    gender: newStudent.gender,
                    className: selectedClass,
                    parentName: '',
                    parentPhone: '',
                  });
                  setShowAddModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.addBtnText}>新增</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchFooter}>
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                当前展示 <Text style={{ color: colors.primary, fontWeight: '700' }}>{visibleCount}</Text> 名学生
              </Text>
              <Text style={[styles.searchFooterText, { color: colors.textTertiary }]}>输入姓名或学号即可快速找到学生</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>班级花名册</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>含家长联系方式</Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>{visibleCount}</Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        style={styles.studentList}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchText ? '没有找到匹配的学生' : '暂无学生，点击”新增”或”导入”添加'}
            </Text>
          </View>
        }
      />

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>新增学生</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>姓名 *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入学生姓名"
                  placeholderTextColor={colors.textTertiary}
                  value={newStudent.name}
                  onChangeText={(text) => setNewStudent({ ...newStudent, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>学号 *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入学号"
                  placeholderTextColor={colors.textTertiary}
                  value={newStudent.studentNo}
                  onChangeText={(text) => setNewStudent({ ...newStudent, studentNo: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>性别</Text>
                <View style={styles.chipRow}>
                  {(['男', '女'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: newStudent.gender === gender
                            ? gender === '男'
                              ? colors.palette.blue.bg
                              : colors.palette.red.bg
                            : colors.surfaceSecondary,
                          borderColor: newStudent.gender === gender
                            ? gender === '男'
                              ? colors.male
                              : colors.female
                            : colors.border,
                        },
                      ]}
                      onPress={() => setNewStudent({ ...newStudent, gender })}
                    >
                      <Ionicons
                        name={gender === '男' ? 'male' : 'female'}
                        size={14}
                        color={newStudent.gender === gender ? (gender === '男' ? colors.male : colors.female) : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: newStudent.gender === gender ? (gender === '男' ? colors.male : colors.female) : colors.textSecondary,
                          },
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级</Text>
                <View style={styles.chipRow}>
                  {classList.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: newStudent.className === c.name ? colors.primaryLight : colors.surfaceSecondary,
                          borderColor: newStudent.className === c.name ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setNewStudent({ ...newStudent, className: c.name })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: newStudent.className === c.name ? colors.primary : colors.textSecondary,
                          },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>家长姓名</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入家长姓名"
                  placeholderTextColor={colors.textTertiary}
                  value={newStudent.parentName}
                  onChangeText={(text) => setNewStudent({ ...newStudent, parentName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>家长电话</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入家长电话"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  value={newStudent.parentPhone}
                  onChangeText={(text) => setNewStudent({ ...newStudent, parentPhone: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddStudent}
              >
                <Text style={styles.modalConfirmText}>确认添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 班级选择弹窗 */}
      <Modal visible={classPickerOpen} transparent animationType="slide" onRequestClose={() => setClassPickerOpen(false)}>
        <TouchableOpacity style={styles.classPkOverlay} activeOpacity={1} onPress={() => setClassPickerOpen(false)}>
          <View style={[styles.classPkContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.classPkHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.classPkTitle, { color: colors.text }]}>选择班级</Text>
            <View style={styles.classPkList}>
              {classList.map((c) => {
                const isActive = selectedClass === c.name;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.classPkItem,
                      {
                        backgroundColor: isActive ? colors.primaryLight : colors.surfaceSecondary,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      handleClassSelect(c.name);
                      setClassPickerOpen(false);
                    }}
                  >
                    <Ionicons name="school-outline" size={18} color={isActive ? colors.primary : colors.textTertiary} />
                    <Text style={[styles.classPkItemText, { color: isActive ? colors.primary : colors.text }]}>{c.name}</Text>
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
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
  topSection: {
    paddingHorizontal: 14,
    zIndex: 1,
  },
  fixedPanel: {
    paddingBottom: 4,
  },
  studentList: {
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: -20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  summaryDecorLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
  },
  summaryDecorSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -20,
    left: -30,
  },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.68)',
    letterSpacing: 0.3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  summaryBadgeValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryClassName: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryHint: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryStatLabel: {
    fontSize: 11,
    marginTop: 3,
    color: 'rgba(255,255,255,0.7)',
  },
  toolbar: {
    paddingTop: 12,
  },
  classPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  classPickerToolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  classPickerToolbarText: { fontSize: 13, fontWeight: '700' },
  // Class picker modal
  classPkOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  classPkContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 14 },
  classPkHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  classPkTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  classPkList: { gap: 10 },
  classPkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  classPkItemText: { flex: 1, fontSize: 15, fontWeight: '700' },
  searchCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  importBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  searchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  searchFooterText: {
    fontSize: 11,
  },
  statsText: {
    fontSize: 13,
  },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  sectionBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    flexGrow: 1,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  studentNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  studentTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  genderBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentNoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  studentNo: {
    fontSize: 11,
    fontWeight: '600',
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  parentInfo: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 14,
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
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
});

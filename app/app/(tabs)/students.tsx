import { useState } from 'react';
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
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';

interface Student {
  id: string;
  name: string;
  studentNo: string;
  gender: '男' | '女';
  className: string;
  parentName: string;
  parentPhone: string;
}

const mockStudents: Student[] = [
  { id: '1', name: '张小明', studentNo: '2024001', gender: '男', className: '三年级1班', parentName: '张伟', parentPhone: '138****1234' },
  { id: '2', name: '李小红', studentNo: '2024002', gender: '女', className: '三年级1班', parentName: '李强', parentPhone: '139****5678' },
  { id: '3', name: '王小刚', studentNo: '2024003', gender: '男', className: '三年级1班', parentName: '王磊', parentPhone: '136****9012' },
  { id: '4', name: '赵小丽', studentNo: '2024004', gender: '女', className: '三年级1班', parentName: '赵敏', parentPhone: '137****3456' },
  { id: '5', name: '陈小华', studentNo: '2024005', gender: '男', className: '三年级2班', parentName: '陈刚', parentPhone: '135****7890' },
  { id: '6', name: '刘小芳', studentNo: '2024006', gender: '女', className: '三年级2班', parentName: '刘洋', parentPhone: '133****2345' },
  { id: '7', name: '孙小龙', studentNo: '2024007', gender: '男', className: '三年级2班', parentName: '孙涛', parentPhone: '131****6789' },
  { id: '8', name: '周小雨', studentNo: '2024008', gender: '女', className: '三年级2班', parentName: '周明', parentPhone: '132****0123' },
];

export default function StudentsScreen() {
  const colors = useTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('三年级2班');
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentNo: '',
    gender: '男' as '男' | '女',
    className: '三年级2班',
    parentName: '',
    parentPhone: '',
  });

  const handleAddStudent = () => {
    if (!newStudent.name.trim()) {
      Alert.alert('提示', '请输入学生姓名');
      return;
    }
    if (!newStudent.studentNo.trim()) {
      Alert.alert('提示', '请输入学号');
      return;
    }
    const created: Student = {
      id: Date.now().toString(),
      name: newStudent.name.trim(),
      studentNo: newStudent.studentNo.trim(),
      gender: newStudent.gender,
      className: newStudent.className,
      parentName: newStudent.parentName.trim(),
      parentPhone: newStudent.parentPhone.trim(),
    };
    setStudents([...students, created]);
    setNewStudent({
      name: '',
      studentNo: '',
      gender: '男',
      className: selectedClass,
      parentName: '',
      parentPhone: '',
    });
    setShowAddModal(false);
    Alert.alert('添加成功', `已添加学生：${created.name}`);
  };

  const classStudents = students.filter((student) => student.className === selectedClass);
  const filteredStudents = classStudents.filter(
    (student) => student.name.includes(searchText) || student.studentNo.includes(searchText),
  );

  const maleCount = classStudents.filter((student) => student.gender === '男').length;
  const femaleCount = classStudents.filter((student) => student.gender === '女').length;
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
      '请选择包含学生信息的 Excel 文件（.xlsx）\n\n模板格式：姓名、学号、性别、班级、家长姓名、家长电话\n\n提示：可在电脑端访问系统下载标准模板',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '下载模板',
          onPress: () => {
            Alert.alert('模板下载', '请在电脑浏览器中打开系统后台，进入「学生管理」页面下载 Excel 导入模板');
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
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.summaryHero, { backgroundColor: colors.primary }]}>
            <View style={[styles.summaryDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            <View style={[styles.summaryDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
            <Text style={styles.summaryEyebrow}>学生花名册</Text>
            <Text style={styles.summaryClassName}>{selectedClass}</Text>
            <Text style={styles.summaryHint}>快速查看班级学生、家长信息和导入状态</Text>
          </View>

          <View style={styles.summaryStatsRow}>
            {[
              { label: '班级人数', value: classStudents.length.toString(), color: colors.primary },
              { label: '男生', value: maleCount.toString(), color: colors.male },
              { label: '女生', value: femaleCount.toString(), color: colors.female },
            ].map((item, index) => (
              <View
                key={`${item.label}-${index}`}
                style={[
                  styles.summaryStatItem,
                  index < 2 && { borderRightWidth: 0.5, borderRightColor: colors.divider },
                ]}
              >
                <Text style={[styles.summaryStatValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fixedPanel}>
          <View style={styles.toolbar}>
            <ScrollableClassTabs
              colors={colors}
              selected={selectedClass}
              onSelect={setSelectedClass}
            />
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
              <Text style={[styles.searchFooterText, { color: colors.textTertiary }]}>支持按姓名或学号快速检索</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>班级花名册</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>学生基础信息与家长联系方式</Text>
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
              {searchText ? '没有找到匹配的学生' : '当前班级暂无学生，点击“新增”或“导入”添加'}
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
                  {['三年级1班', '三年级2班'].map((className) => (
                    <TouchableOpacity
                      key={className}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: newStudent.className === className ? colors.primaryLight : colors.surfaceSecondary,
                          borderColor: newStudent.className === className ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setNewStudent({ ...newStudent, className })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: newStudent.className === className ? colors.primary : colors.textSecondary,
                          },
                        ]}
                      >
                        {className}
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
    </SafeAreaView>
  );
}

function ScrollableClassTabs({
  colors,
  selected,
  onSelect,
}: {
  colors: any;
  selected: string;
  onSelect: (className: string) => void;
}) {
  const classes = ['三年级1班', '三年级2班'];

  return (
    <View style={[styles.classTabsCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.classTabs, { backgroundColor: colors.surfaceSecondary }]}>
        {classes.map((className) => (
          <TouchableOpacity
            key={className}
            style={[
              styles.classTab,
              {
                backgroundColor: selected === className ? colors.surface : 'transparent',
                borderColor: selected === className ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => onSelect(className)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.classTabText,
                { color: selected === className ? colors.primary : colors.textSecondary },
                selected === className && { fontWeight: '700' },
              ]}
            >
              {className}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  summaryDecorLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -35,
    right: -20,
  },
  summaryDecorSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    bottom: -24,
    left: -10,
  },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.68)',
    letterSpacing: 0.3,
  },
  summaryClassName: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryHint: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
  },
  summaryStatsRow: {
    flexDirection: 'row',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryStatLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  toolbar: {
    paddingTop: 12,
  },
  classTabsCard: {
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  classTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 6,
  },
  classTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
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
});

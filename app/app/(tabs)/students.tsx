import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
  { id: '1', name: '张小明', studentNo: '2024001', gender: '男', className: '三年级2班', parentName: '张伟', parentPhone: '138****1234' },
  { id: '2', name: '李小红', studentNo: '2024002', gender: '女', className: '三年级2班', parentName: '李强', parentPhone: '139****5678' },
  { id: '3', name: '王小刚', studentNo: '2024003', gender: '男', className: '三年级2班', parentName: '王磊', parentPhone: '136****9012' },
  { id: '4', name: '赵小丽', studentNo: '2024004', gender: '女', className: '三年级2班', parentName: '赵敏', parentPhone: '137****3456' },
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
    name: '', studentNo: '', gender: '男' as '男' | '女',
    className: '三年级2班', parentName: '', parentPhone: '',
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
    setNewStudent({ name: '', studentNo: '', gender: '男', className: selectedClass, parentName: '', parentPhone: '' });
    setShowAddModal(false);
    Alert.alert('添加成功', `已添加学生：${created.name}`);
  };

  const filteredStudents = students.filter(
    (s) => s.name.includes(searchText) || s.studentNo.includes(searchText)
  );

  const maleCount = filteredStudents.filter((s) => s.gender === '男').length;
  const femaleCount = filteredStudents.filter((s) => s.gender === '女').length;

  const renderStudent = ({ item, index }: { item: Student; index: number }) => (
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
          <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{item.studentNo}</Text>
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
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 搜索栏 + 导入按钮 */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            setNewStudent({ name: '', studentNo: '', gender: '男', className: selectedClass, parentName: '', parentPhone: '' });
            setShowAddModal(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>新增</Text>
        </TouchableOpacity>
      </View>

      {/* 班级切换 */}
      <View style={styles.toolbar}>
        <ScrollableClassTabs
          colors={colors}
          selected={selectedClass}
          onSelect={setSelectedClass}
        />
      </View>

      {/* 统计 */}
      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: colors.textSecondary }]}>
          共 <Text style={{ color: colors.primary, fontWeight: '700' }}>{filteredStudents.length}</Text> 名学生
        </Text>
        <View style={styles.genderStats}>
          <View style={styles.genderStatItem}>
            <Ionicons name="male" size={14} color={colors.male} />
            <Text style={[styles.genderStatText, { color: colors.textSecondary }]}>{maleCount}</Text>
          </View>
          <View style={styles.genderStatItem}>
            <Ionicons name="female" size={14} color={colors.female} />
            <Text style={[styles.genderStatText, { color: colors.textSecondary }]}>{femaleCount}</Text>
          </View>
        </View>
      </View>

      {/* 学生列表 */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchText ? '没有找到匹配的学生' : '暂无学生，点击"新增"或"导入"添加'}
            </Text>
          </View>
        }
      />

      {/* 新增学生弹窗 */}
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
                  onChangeText={(t) => setNewStudent({ ...newStudent, name: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>学号 *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入学号"
                  placeholderTextColor={colors.textTertiary}
                  value={newStudent.studentNo}
                  onChangeText={(t) => setNewStudent({ ...newStudent, studentNo: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>性别</Text>
                <View style={styles.chipRow}>
                  {(['男', '女'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, {
                        backgroundColor: newStudent.gender === g
                          ? (g === '男' ? colors.palette.blue.bg : colors.palette.red.bg)
                          : colors.surfaceSecondary,
                        borderColor: newStudent.gender === g
                          ? (g === '男' ? colors.male : colors.female)
                          : colors.border,
                      }]}
                      onPress={() => setNewStudent({ ...newStudent, gender: g })}
                    >
                      <Ionicons name={g === '男' ? 'male' : 'female'} size={14}
                        color={newStudent.gender === g ? (g === '男' ? colors.male : colors.female) : colors.textTertiary} />
                      <Text style={[styles.chipText, {
                        color: newStudent.gender === g ? (g === '男' ? colors.male : colors.female) : colors.textSecondary,
                      }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级</Text>
                <View style={styles.chipRow}>
                  {['三年级1班', '三年级2班'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, {
                        backgroundColor: newStudent.className === c ? colors.primaryLight : colors.surfaceSecondary,
                        borderColor: newStudent.className === c ? colors.primary : colors.border,
                      }]}
                      onPress={() => setNewStudent({ ...newStudent, className: c })}
                    >
                      <Text style={[styles.chipText, {
                        color: newStudent.className === c ? colors.primary : colors.textSecondary,
                      }]}>{c}</Text>
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
                  onChangeText={(t) => setNewStudent({ ...newStudent, parentName: t })}
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
                  onChangeText={(t) => setNewStudent({ ...newStudent, parentPhone: t })}
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
  onSelect: (c: string) => void;
}) {
  const classes = ['三年级1班', '三年级2班'];
  return (
    <View style={styles.classTabs}>
      {classes.map((cls) => (
        <TouchableOpacity
          key={cls}
          style={[
            styles.classTab,
            {
              backgroundColor: selected === cls ? colors.primary : colors.surface,
              borderColor: selected === cls ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelect(cls)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.classTabText,
              { color: selected === cls ? '#FFF' : colors.textSecondary },
            ]}
          >
            {cls}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  classTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  classTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  classTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 13,
  },
  genderStats: {
    flexDirection: 'row',
    gap: 12,
  },
  genderStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  genderStatText: {
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentNameRow: {
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
  studentNo: {
    fontSize: 12,
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

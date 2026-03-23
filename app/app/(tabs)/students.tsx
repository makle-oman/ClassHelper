import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
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

  const filteredStudents = mockStudents.filter(
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 搜索栏 */}
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
      </View>

      {/* 班级切换 + 操作按钮 */}
      <View style={styles.toolbar}>
        <ScrollableClassTabs
          colors={colors}
          selected={selectedClass}
          onSelect={setSelectedClass}
        />
        <TouchableOpacity style={[styles.importBtn, { backgroundColor: colors.palette.green.bg }]}>
          <Ionicons name="document-outline" size={16} color={colors.palette.green.text} />
          <Text style={[styles.importBtnText, { color: colors.palette.green.text }]}>Excel导入</Text>
        </TouchableOpacity>
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
              {searchText ? '没有找到匹配的学生' : '暂无学生，点击"Excel导入"添加'}
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  searchBar: {
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
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  importBtnText: {
    fontSize: 13,
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
});

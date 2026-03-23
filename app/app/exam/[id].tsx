import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme';

interface StudentScore {
  id: string;
  name: string;
  studentNo: string;
  gender: '男' | '女';
  score: string;
  absent?: boolean; // 缺考
}

const mockStudentScores: StudentScore[] = [
  { id: '1', name: '张小明', studentNo: '2024001', gender: '男', score: '92' },
  { id: '2', name: '李小红', studentNo: '2024002', gender: '女', score: '88' },
  { id: '3', name: '王小刚', studentNo: '2024003', gender: '男', score: '76' },
  { id: '4', name: '赵小丽', studentNo: '2024004', gender: '女', score: '95' },
  { id: '5', name: '陈小华', studentNo: '2024005', gender: '男', score: '52' },
  { id: '6', name: '刘小芳', studentNo: '2024006', gender: '女', score: '', absent: true },
  { id: '7', name: '孙小龙', studentNo: '2024007', gender: '男', score: '' },
  { id: '8', name: '周小雨', studentNo: '2024008', gender: '女', score: '' },
  { id: '9', name: '吴小军', studentNo: '2024009', gender: '男', score: '68' },
  { id: '10', name: '郑小美', studentNo: '2024010', gender: '女', score: '83' },
];

const FULL_SCORE = 100;

function getScoreColor(score: number, colors: any) {
  if (score >= 90) return colors.success;
  if (score >= 80) return colors.info;
  if (score >= 70) return '#F59E0B';
  if (score >= 60) return '#EA580C';
  return colors.error;
}

export default function ExamDetailScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams();
  const [students, setStudents] = useState(mockStudentScores);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const enteredStudents = students.filter((s) => s.score !== '');
  const scores = enteredStudents.map((s) => Number(s.score)).filter((n) => !isNaN(n));
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const passCount = scores.filter((s) => s >= 60).length;
  const excellentCount = scores.filter((s) => s >= 90).length;

  const handleScoreChange = (index: number, value: string) => {
    // 只允许数字和小数点
    const cleaned = value.replace(/[^0-9.]/g, '');
    const updated = [...students];
    updated[index] = { ...updated[index], score: cleaned };
    setStudents(updated);
  };

  const handleSubmitEditing = (index: number) => {
    // 录完一个自动跳到下一个未录入的
    for (let i = index + 1; i < students.length; i++) {
      if (students[i].score === '') {
        inputRefs.current[i]?.focus();
        return;
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 导航栏 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: colors.text }]}>期中考试</Text>
          <Text style={[styles.navSubtitle, { color: colors.textTertiary }]}>语文 · 三年级2班</Text>
        </View>
        <TouchableOpacity style={[styles.navAction, { backgroundColor: colors.palette.green.bg }]}>
          <Ionicons name="document-outline" size={16} color={colors.palette.green.text} />
          <Text style={[styles.navActionText, { color: colors.palette.green.text }]}>导入</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 实时统计卡片 */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statsRow}>
              {[
                { label: '已录入', value: `${enteredStudents.length}/${students.length}`, color: colors.primary },
                { label: '平均分', value: avg > 0 ? avg.toFixed(1) : '-', color: colors.primary },
                { label: '最高', value: max > 0 ? max.toString() : '-', color: colors.success },
                { label: '最低', value: min > 0 ? min.toString() : '-', color: colors.error },
              ].map((s, i) => (
                <View key={s.label} style={[styles.statBlock, i < 3 && { borderRightWidth: 0.5, borderRightColor: colors.divider }]}>
                  <Text style={[styles.statBlockValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statBlockLabel, { color: colors.textTertiary }]}>{s.label}</Text>
                </View>
              ))}
            </View>
            {scores.length > 0 && (
              <View style={[styles.rateRow, { borderTopColor: colors.divider }]}>
                <View style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: colors.textTertiary }]}>及格率</Text>
                  <Text style={[styles.rateValue, { color: colors.info }]}>
                    {((passCount / scores.length) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: colors.textTertiary }]}>优秀率</Text>
                  <Text style={[styles.rateValue, { color: colors.success }]}>
                    {((excellentCount / scores.length) * 100).toFixed(0)}%
                  </Text>
                </View>
                {/* 进度 */}
                <View style={[styles.rateItem, { flex: 2 }]}>
                  <Text style={[styles.rateLabel, { color: colors.textTertiary }]}>录入进度</Text>
                  <View style={styles.miniProgress}>
                    <View style={[styles.miniProgressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                      <View style={[styles.miniProgressFill, { width: `${(enteredStudents.length / students.length) * 100}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.miniProgressText, { color: colors.textTertiary }]}>
                      {((enteredStudents.length / students.length) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 学生成绩列表 */}
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderText, { color: colors.textSecondary }]}>学生成绩（满分 {FULL_SCORE}）</Text>
          </View>

          <View style={[styles.studentList, { backgroundColor: colors.surface }]}>
            {students.map((student, index) => {
              const hasScore = student.score !== '';
              const numScore = Number(student.score);
              const isAbsent = student.absent === true;
              const isFail = hasScore && !isNaN(numScore) && numScore < 60;
              const scoreColor = hasScore && !isNaN(numScore) ? getScoreColor(numScore, colors) : colors.textTertiary;

              return (
                <View
                  key={student.id}
                  style={[
                    styles.studentRow,
                    index < students.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                    isFail && { backgroundColor: colors.errorLight },
                  ]}
                >
                  {/* 序号 */}
                  <Text style={[styles.studentIndex, { color: isFail ? colors.error : colors.textTertiary }]}>{index + 1}</Text>

                  {/* 头像 */}
                  <View
                    style={[
                      styles.studentAvatar,
                      { backgroundColor: isAbsent ? '#F0F0F0' : student.gender === '男' ? '#E8F4FD' : '#FCE4EC' },
                    ]}
                  >
                    <Text style={[styles.studentAvatarText, { color: isAbsent ? '#BBB' : student.gender === '男' ? '#2E86C1' : '#C2457A' }]}>
                      {student.name.slice(-1)}
                    </Text>
                  </View>

                  {/* 姓名学号 */}
                  <View style={styles.studentInfo}>
                    <View style={styles.studentNameRow}>
                      <Text style={[styles.studentName, { color: isAbsent ? colors.textTertiary : colors.text }]}>{student.name}</Text>
                      {isAbsent && (
                        <View style={[styles.absentBadge, { backgroundColor: colors.errorLight }]}>
                          <Text style={[styles.absentBadgeText, { color: colors.error }]}>缺考</Text>
                        </View>
                      )}
                      {isFail && !isAbsent && (
                        <View style={[styles.failBadge, { backgroundColor: colors.error + '15' }]}>
                          <Text style={[styles.failBadgeText, { color: colors.error }]}>不及格</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{student.studentNo}</Text>
                  </View>

                  {/* 缺考按钮 或 分数输入 */}
                  {isAbsent ? (
                    <TouchableOpacity
                      style={[styles.absentBox, { backgroundColor: colors.errorLight, borderColor: colors.error + '30' }]}
                      onPress={() => {
                        const updated = [...students];
                        updated[index] = { ...updated[index], absent: false };
                        setStudents(updated);
                      }}
                    >
                      <Ionicons name="close-circle" size={14} color={colors.error} />
                      <Text style={[styles.absentBoxText, { color: colors.error }]}>缺考</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.scoreArea}>
                      <View style={styles.scoreInputWrapper}>
                        <TextInput
                          ref={(ref) => { inputRefs.current[index] = ref; }}
                          style={[
                            styles.scoreInput,
                            {
                              backgroundColor: hasScore ? scoreColor + '10' : colors.surfaceSecondary,
                              borderColor: hasScore ? scoreColor + '40' : colors.border,
                              color: hasScore ? scoreColor : colors.text,
                            },
                          ]}
                          placeholder="-"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="decimal-pad"
                          maxLength={5}
                          value={student.score}
                          onChangeText={(v) => handleScoreChange(index, v)}
                          onSubmitEditing={() => handleSubmitEditing(index)}
                          returnKeyType="next"
                          textAlign="center"
                        />
                        {hasScore && !isNaN(numScore) && numScore >= 90 && (
                          <View style={styles.excellentMark}>
                            <Ionicons name="star" size={10} color="#F59E0B" />
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.absentToggle}
                        onPress={() => {
                          const updated = [...students];
                          updated[index] = { ...updated[index], absent: true, score: '' };
                          setStudents(updated);
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="remove-circle-outline" size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 底部操作栏 */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.bottomInfo}>
            <Text style={[styles.bottomInfoText, { color: colors.textSecondary }]}>
              已录入 <Text style={{ color: colors.primary, fontWeight: '700' }}>{enteredStudents.length}</Text> / {students.length}
            </Text>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text style={styles.saveBtnText}>保存成绩</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5 },
  navBack: { padding: 4 },
  navCenter: { flex: 1, marginLeft: 8 },
  navTitle: { fontSize: 17, fontWeight: '700' },
  navSubtitle: { fontSize: 12, marginTop: 1 },
  navAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  navActionText: { fontSize: 12, fontWeight: '600' },

  // Stats
  statsCard: { marginHorizontal: 20, marginTop: 14, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statsRow: { flexDirection: 'row' },
  statBlock: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 3 },
  statBlockValue: { fontSize: 20, fontWeight: '800' },
  statBlockLabel: { fontSize: 10 },
  rateRow: { flexDirection: 'row', borderTopWidth: 0.5, paddingVertical: 12, paddingHorizontal: 16, gap: 16 },
  rateItem: { flex: 1, gap: 4 },
  rateLabel: { fontSize: 10 },
  rateValue: { fontSize: 15, fontWeight: '700' },
  miniProgress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniProgressTrack: { flex: 1, height: 5, borderRadius: 2.5, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 2.5 },
  miniProgressText: { fontSize: 11, fontWeight: '600' },

  // List
  listHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  listHeaderText: { fontSize: 13, fontWeight: '500' },
  studentList: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  studentIndex: { width: 20, fontSize: 12, textAlign: 'center', fontWeight: '500' },
  studentAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 14, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  studentName: { fontSize: 14, fontWeight: '600' },
  studentNo: { fontSize: 11, marginTop: 1 },
  absentBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  absentBadgeText: { fontSize: 9, fontWeight: '700' },
  failBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  failBadgeText: { fontSize: 9, fontWeight: '700' },
  scoreArea: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreInputWrapper: { position: 'relative' },
  scoreInput: { width: 64, height: 38, borderRadius: 10, borderWidth: 1, fontSize: 16, fontWeight: '700', textAlign: 'center', outlineStyle: 'none' } as any,
  excellentMark: { position: 'absolute', top: -4, right: -4 },
  absentToggle: { padding: 2 },
  absentBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  absentBoxText: { fontSize: 12, fontWeight: '700' },

  // Bottom bar
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5 },
  bottomInfo: {},
  bottomInfoText: { fontSize: 13 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme';

interface StudentDetail {
  id: string;
  name: string;
  studentNo: string;
  gender: '男' | '女';
  birthDate: string;
  enrollDate: string;
  className: string;
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  recentScores: { exam: string; subject: string; score: number; fullScore: number }[];
  attendance: { totalDays: number; present: number; late: number; absent: number; leave: number };
}

const mockStudents: Record<string, StudentDetail> = {
  '1': {
    id: '1', name: '张小明', studentNo: '20230101', gender: '男',
    birthDate: '2016-03-15', enrollDate: '2023-09-01', className: '三年级1班',
    parentName: '张伟', parentRelation: '父亲', parentPhone: '138****1234',
    recentScores: [
      { exam: '期中考试', subject: '语文', score: 92, fullScore: 100 },
      { exam: '期中考试', subject: '数学', score: 85, fullScore: 100 },
      { exam: '第二单元测验', subject: '数学', score: 78, fullScore: 100 },
      { exam: '第二单元测验', subject: '语文', score: 88, fullScore: 100 },
      { exam: '第一单元测验', subject: '语文', score: 82, fullScore: 100 },
      { exam: '第一单元测验', subject: '数学', score: 75, fullScore: 100 },
    ],
    attendance: { totalDays: 120, present: 115, late: 3, absent: 1, leave: 1 },
  },
  '2': {
    id: '2', name: '李小红', studentNo: '20230102', gender: '女',
    birthDate: '2016-05-22', enrollDate: '2023-09-01', className: '三年级1班',
    parentName: '李芳', parentRelation: '母亲', parentPhone: '139****5678',
    recentScores: [
      { exam: '期中考试', subject: '语文', score: 96, fullScore: 100 },
      { exam: '期中考试', subject: '数学', score: 91, fullScore: 100 },
      { exam: '第二单元测验', subject: '数学', score: 88, fullScore: 100 },
      { exam: '第二单元测验', subject: '语文', score: 94, fullScore: 100 },
      { exam: '第一单元测验', subject: '语文', score: 90, fullScore: 100 },
      { exam: '第一单元测验', subject: '数学', score: 85, fullScore: 100 },
    ],
    attendance: { totalDays: 120, present: 118, late: 1, absent: 0, leave: 1 },
  },
};

const subjectColors: Record<string, { bg: string; text: string }> = {
  '语文': { bg: '#E8F4FD', text: '#2E86C1' },
  '数学': { bg: '#FDEAE4', text: '#D35E44' },
  '英语': { bg: '#EDE7F6', text: '#7E57C2' },
};

export default function StudentDetailScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams();
  const studentId = typeof id === 'string' ? id : '1';
  const [studentsData, setStudentsData] = useState(mockStudents);
  const student = studentsData[studentId] || studentsData['1'];

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: student.name,
    gender: student.gender as '男' | '女',
    birthDate: student.birthDate,
    parentName: student.parentName,
    parentRelation: student.parentRelation,
    parentPhone: student.parentPhone,
  });

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) {
      Alert.alert('提示', '学生姓名不能为空');
      return;
    }
    setStudentsData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        name: editForm.name.trim(),
        gender: editForm.gender,
        birthDate: editForm.birthDate.trim(),
        parentName: editForm.parentName.trim(),
        parentRelation: editForm.parentRelation.trim(),
        parentPhone: editForm.parentPhone.trim(),
      },
    }));
    setShowEditModal(false);
  };

  const handleCall = () => {
    const phone = student.parentPhone.replace(/\*/g, '');
    if (phone.length < 5) {
      Alert.alert('提示', '当前号码不完整，无法拨打');
      return;
    }
    Linking.openURL(`tel:${student.parentPhone}`);
  };

  const handleDeleteStudent = () => {
    Alert.alert(
      '删除学生',
      `确定要删除"${student.name}"吗？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            // TODO: 后续对接后端 API
            Alert.alert('已删除', `${student.name}已从班级中移除`, [
              { text: '确定', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const attendanceRate = student.attendance.totalDays > 0
    ? ((student.attendance.present / student.attendance.totalDays) * 100).toFixed(1)
    : '0';

  const getSubjectColor = (subject: string) => subjectColors[subject] || subjectColors['语文'];

  // 综合分析计算
  const analyzeStudent = () => {
    const scores = student.recentScores;

    // 按科目分组
    const bySubject: Record<string, number[]> = {};
    scores.forEach((s) => {
      if (!bySubject[s.subject]) bySubject[s.subject] = [];
      bySubject[s.subject].push(s.score);
    });

    // 科目分析
    const subjectAnalysis = Object.entries(bySubject).map(([subject, scores]) => ({
      subject,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
      max: Math.max(...scores),
      min: Math.min(...scores),
      trend: scores.length >= 2 ? (scores[0] >= scores[1] ? 'up' : 'down') : 'stable',
      diff: scores.length >= 2 ? Math.abs(scores[0] - scores[1]) : 0,
    }));

    // 总平均分
    const totalAvg = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length * 10) / 10;

    // 等级
    const level = totalAvg >= 90 ? '优秀' : totalAvg >= 80 ? '良好' : totalAvg >= 70 ? '中等' : '需努力';

    // 最强/最弱科目
    const sorted = [...subjectAnalysis].sort((a, b) => b.avg - a.avg);
    const strongest = sorted[0];
    const weakest = sorted.length > 1 ? sorted[sorted.length - 1] : null;

    // 考勤率
    const attendRate = student.attendance.totalDays > 0
      ? (student.attendance.present / student.attendance.totalDays * 100)
      : 100;

    // 生成评语
    let comment = `${student.name}同学总体表现${level}，`;
    if (strongest) comment += `${strongest.subject}成绩突出（平均${strongest.avg}分）`;
    if (weakest && weakest.subject !== strongest?.subject) comment += `，${weakest.subject}还有提升空间（平均${weakest.avg}分）`;
    comment += '。';
    if (attendRate >= 98) comment += '出勤表现非常好，继续保持！';
    else if (attendRate >= 95) comment += '出勤情况良好。';
    else comment += '建议注意出勤，保证学习时间。';

    return { subjectAnalysis, totalAvg, level, comment };
  };

  const analysis = analyzeStudent();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{student.name}</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => {
            setEditForm({
              name: student.name, gender: student.gender, birthDate: student.birthDate,
              parentName: student.parentName, parentRelation: student.parentRelation, parentPhone: student.parentPhone,
            });
            setShowEditModal(true);
          }}>
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={handleDeleteStudent}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 学生头像卡片 */}
        <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.headerDecorCircle, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={styles.headerContent}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: student.gender === '男' ? 'rgba(59,130,246,0.3)' : 'rgba(236,72,153,0.3)' },
              ]}
            >
              <Text style={styles.avatarText}>{student.name[0]}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{student.name}</Text>
              <View style={styles.headerMetaRow}>
                <Text style={styles.headerStudentNo}>{student.studentNo}</Text>
                <View style={[styles.headerGenderBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons
                    name={student.gender === '男' ? 'male' : 'female'}
                    size={12}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.headerGenderText}>{student.gender}</Text>
                </View>
              </View>
              <View style={[styles.headerClassBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="school-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.headerClassName}>{student.className}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>基本信息</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {[
              { label: '性别', value: student.gender, icon: student.gender === '男' ? 'male' as const : 'female' as const },
              { label: '出生日期', value: student.birthDate, icon: 'calendar-outline' as const },
              { label: '入学日期', value: student.enrollDate, icon: 'school-outline' as const },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name={item.icon} size={16} color={colors.textTertiary} />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{item.value}</Text>
                </View>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* 家长信息 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.info }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>家长信息</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>姓名</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{student.parentName}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="heart-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>关系</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{student.parentRelation}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="call-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>电话</Text>
              </View>
              <View style={styles.phoneRow}>
                <Text style={[styles.infoValue, { color: colors.text }]}>{student.parentPhone}</Text>
                <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.palette.green.bg }]} onPress={handleCall}>
                  <Ionicons name="call" size={14} color={colors.palette.green.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 成绩概览 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>成绩概览</Text>
          </View>
          <View style={styles.scoreCards}>
            {student.recentScores.map((item, i) => {
              const sc = getSubjectColor(item.subject);
              return (
                <View key={i} style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.scoreCardTop}>
                    <View style={[styles.subjectBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.subjectBadgeText, { color: sc.text }]}>{item.subject}</Text>
                    </View>
                    <Text style={[styles.scoreCardExam, { color: colors.textTertiary }]}>{item.exam}</Text>
                  </View>
                  <View style={styles.scoreCardBottom}>
                    <Text style={[styles.scoreValue, { color: sc.text }]}>{item.score}</Text>
                    <Text style={[styles.scoreFullMark, { color: colors.textTertiary }]}>/{item.fullScore}</Text>
                  </View>
                  <View style={[styles.scoreProgressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.scoreProgressFill,
                        {
                          width: `${(item.score / item.fullScore) * 100}%` as any,
                          backgroundColor: sc.text,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 综合分析 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.palette.purple.text }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>综合分析</Text>
          </View>

          <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}>
            {/* 总体等级 */}
            <View style={styles.analysisLevelRow}>
              <View style={styles.analysisLevelLeft}>
                <Text style={[styles.analysisLevelLabel, { color: colors.textSecondary }]}>总体评价</Text>
                <View style={[styles.analysisLevelBadge, { backgroundColor: analysis.totalAvg >= 90 ? colors.successLight : analysis.totalAvg >= 80 ? colors.primaryLight : analysis.totalAvg >= 70 ? colors.warningLight : colors.errorLight }]}>
                  <Text style={[styles.analysisLevelText, { color: analysis.totalAvg >= 90 ? colors.success : analysis.totalAvg >= 80 ? colors.primary : analysis.totalAvg >= 70 ? colors.warning : colors.error }]}>{analysis.level}</Text>
                </View>
              </View>
              <Text style={[styles.analysisAvgScore, { color: colors.primary }]}>{analysis.totalAvg}</Text>
            </View>

            <View style={[styles.analysisDivider, { backgroundColor: colors.divider }]} />

            {/* 各科分析 */}
            {analysis.subjectAnalysis.map((item) => {
              const sc = subjectColors[item.subject] || subjectColors['语文'];
              return (
                <View key={item.subject} style={styles.subjectRow}>
                  <View style={[styles.subjectDot, { backgroundColor: sc.text }]} />
                  <Text style={[styles.subjectName, { color: colors.text }]}>{item.subject}</Text>
                  <Text style={[styles.subjectAvg, { color: colors.textSecondary }]}>均分 {item.avg}</Text>
                  <View style={styles.subjectRange}>
                    <Text style={[styles.subjectRangeText, { color: colors.textTertiary }]}>{item.min}~{item.max}</Text>
                  </View>
                  {item.trend !== 'stable' && (
                    <View style={[styles.trendBadge, { backgroundColor: item.trend === 'up' ? colors.successLight : colors.errorLight }]}>
                      <Ionicons name={item.trend === 'up' ? 'arrow-up' : 'arrow-down'} size={10} color={item.trend === 'up' ? colors.success : colors.error} />
                      <Text style={[styles.trendText, { color: item.trend === 'up' ? colors.success : colors.error }]}>{item.diff}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={[styles.analysisDivider, { backgroundColor: colors.divider }]} />

            {/* 评语 */}
            <View style={styles.commentSection}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.commentText, { color: colors.textSecondary }]}>{analysis.comment}</Text>
            </View>
          </View>
        </View>

        {/* 考勤统计 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>考勤统计</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.attendanceSemester, { color: colors.textTertiary }]}>本学期</Text>
            <View style={styles.attendanceGrid}>
              {[
                { label: '总天数', value: student.attendance.totalDays.toString(), color: colors.text },
                { label: '出勤', value: student.attendance.present.toString(), color: colors.success },
                { label: '迟到', value: student.attendance.late.toString(), color: colors.warning },
                { label: '缺勤', value: student.attendance.absent.toString(), color: colors.error },
              ].map((item) => (
                <View key={item.label} style={styles.attendanceItem}>
                  <Text style={[styles.attendanceValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={[styles.attendanceLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.attendanceDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.attendanceRateSection}>
              <View style={styles.attendanceRateHeader}>
                <Text style={[styles.attendanceRateLabel, { color: colors.textSecondary }]}>出勤率</Text>
                <Text style={[styles.attendanceRateValue, { color: colors.primary }]}>{attendanceRate}%</Text>
              </View>
              <View style={[styles.attendanceProgressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                <View
                  style={[
                    styles.attendanceProgressFill,
                    {
                      width: `${attendanceRate}%` as any,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 编辑学生弹窗 */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>编辑学生信息</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>姓名</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  value={editForm.name}
                  onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>性别</Text>
                <View style={styles.chipRow}>
                  {(['男', '女'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, {
                        backgroundColor: editForm.gender === g ? (g === '男' ? colors.palette.blue.bg : colors.palette.red.bg) : colors.surfaceSecondary,
                        borderColor: editForm.gender === g ? (g === '男' ? colors.palette.blue.text : colors.palette.red.text) : colors.border,
                      }]}
                      onPress={() => setEditForm({ ...editForm, gender: g })}
                    >
                      <Ionicons name={g === '男' ? 'male' : 'female'} size={14} color={editForm.gender === g ? (g === '男' ? colors.palette.blue.text : colors.palette.red.text) : colors.textTertiary} />
                      <Text style={[styles.chipText, { color: editForm.gender === g ? (g === '男' ? colors.palette.blue.text : colors.palette.red.text) : colors.textSecondary }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>出生日期</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="如：2016-03-15"
                  placeholderTextColor={colors.textTertiary}
                  value={editForm.birthDate}
                  onChangeText={(t) => setEditForm({ ...editForm, birthDate: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>家长姓名</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  value={editForm.parentName}
                  onChangeText={(t) => setEditForm({ ...editForm, parentName: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>与学生关系</Text>
                <View style={styles.chipRow}>
                  {['父亲', '母亲', '其他'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, {
                        backgroundColor: editForm.parentRelation === r ? colors.primaryLight : colors.surfaceSecondary,
                        borderColor: editForm.parentRelation === r ? colors.primary : colors.border,
                      }]}
                      onPress={() => setEditForm({ ...editForm, parentRelation: r })}
                    >
                      <Text style={[styles.chipText, { color: editForm.parentRelation === r ? colors.primary : colors.textSecondary }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>家长电话</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  keyboardType="phone-pad"
                  value={editForm.parentPhone}
                  onChangeText={(t) => setEditForm({ ...editForm, parentPhone: t })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={() => setShowEditModal(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]} onPress={handleSaveEdit}>
                <Text style={styles.modalConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  // Header card
  headerCard: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerDecorCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -30,
    right: -20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  headerStudentNo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  headerGenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerGenderText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  headerClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  headerClassName: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  // Section
  section: {
    marginTop: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Card
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    marginLeft: 42,
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Score cards
  scoreCards: {
    paddingHorizontal: 20,
    gap: 10,
  },
  scoreCard: {
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  scoreCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreCardExam: {
    fontSize: 12,
  },
  scoreCardBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreFullMark: {
    fontSize: 13,
    marginLeft: 2,
  },
  scoreProgressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Attendance
  attendanceSemester: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  attendanceGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 14,
  },
  attendanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  attendanceValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  attendanceLabel: {
    fontSize: 11,
  },
  attendanceDivider: {
    height: 0.5,
    marginHorizontal: 16,
  },
  attendanceRateSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  attendanceRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceRateLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  attendanceRateValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  attendanceProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  attendanceProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // === Modal ===
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  // 综合分析
  analysisCard: { marginHorizontal: 20, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  analysisLevelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  analysisLevelLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analysisLevelLabel: { fontSize: 13 },
  analysisLevelBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  analysisLevelText: { fontSize: 12, fontWeight: '700' },
  analysisAvgScore: { fontSize: 28, fontWeight: '800' },
  analysisDivider: { height: 0.5, marginVertical: 14 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  subjectDot: { width: 6, height: 6, borderRadius: 3 },
  subjectName: { fontSize: 14, fontWeight: '600', width: 36 },
  subjectAvg: { fontSize: 13, flex: 1 },
  subjectRange: {},
  subjectRangeText: { fontSize: 11 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  trendText: { fontSize: 10, fontWeight: '700' },
  commentSection: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  commentText: { fontSize: 13, lineHeight: 20, flex: 1 },
  modalContent: { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formInput: { height: 44, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, borderWidth: 1 } as any,
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1.5, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

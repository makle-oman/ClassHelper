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
  const examName = '期中考试';
  const examSubject = '语文';
  const examClassName = '三年级2班';
  const examCaption = `${examSubject} · ${examClassName}`;

  const enteredStudents = students.filter((s) => s.score !== '');
  const scores = enteredStudents.map((s) => Number(s.score)).filter((n) => !isNaN(n));
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const passCount = scores.filter((s) => s >= 60).length;
  const excellentCount = scores.filter((s) => s >= 90).length;
  const completionRate = students.length > 0 ? Math.round((enteredStudents.length / students.length) * 100) : 0;
  const pendingCount = students.length - enteredStudents.length;
  const passRate = scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0;
  const excellentRate = scores.length > 0 ? Math.round((excellentCount / scores.length) * 100) : 0;

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
      <View style={[styles.topSection, { backgroundColor: colors.primary }]}>
        <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>{examName}</Text>
          </View>
          <TouchableOpacity style={styles.navAction}>
            <Ionicons name="document-outline" size={16} color="#FFF" />
            <Text style={styles.navActionText}>导入</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCompactRow}>
            <View style={styles.heroCompactMeta}>
              <Ionicons name="sparkles-outline" size={12} color="rgba(255,255,255,0.88)" />
              <Text numberOfLines={1} style={styles.heroCompactMetaText}>{examCaption}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeLabel}>待录入</Text>
              <Text style={styles.heroBadgeValue}>{pendingCount} 人</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            {[
              { label: '已录', value: `${enteredStudents.length}/${students.length}` },
              { label: '均分', value: avg > 0 ? avg.toFixed(1) : '--' },
              { label: '优秀', value: excellentCount.toString() },
            ].map((item) => (
              <View key={item.label} style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
                <Text style={styles.heroStatValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.pageContent}>
            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.statsCardTopRow}>
                <Text style={[styles.statsCardTitle, { color: colors.text }]}>本次概览</Text>
                <Text style={[styles.statsCardHint, { color: colors.primary }]}>录入 {completionRate}%</Text>
              </View>

              <View style={styles.statsGrid}>
                {[
                  { label: '已录入', value: `${enteredStudents.length}/${students.length}`, color: colors.primary },
                  { label: '平均分', value: avg > 0 ? avg.toFixed(1) : '--', color: colors.primary },
                  { label: '最高分', value: max > 0 ? max.toString() : '--', color: colors.success },
                  { label: '最低分', value: min > 0 ? min.toString() : '--', color: colors.error },
                ].map((item) => (
                  <View key={item.label} style={[styles.statTile, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.statTileValue, { color: item.color }]}>{item.value}</Text>
                    <Text style={[styles.statTileLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.progressSummaryCard, { backgroundColor: colors.surfaceSecondary }]}>
                <View style={styles.progressSummaryHeader}>
                  <Text style={[styles.progressSummaryTitle, { color: colors.textSecondary }]}>录入进度</Text>
                  <Text style={[styles.progressSummaryValue, { color: colors.primary }]}>{completionRate}%</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
                  <View style={[styles.progressFill, { width: `${completionRate}%`, backgroundColor: colors.primary }]} />
                </View>
                <View style={styles.progressMetaRow}>
                  {[
                    { label: '及格率', value: `${passRate}%`, tone: colors.infoLight, text: colors.info },
                    { label: '优秀率', value: `${excellentRate}%`, tone: colors.successLight, text: colors.success },
                    { label: '待录入', value: `${pendingCount}人`, tone: colors.palette.orange.bg, text: colors.palette.orange.text },
                  ].map((item) => (
                    <View key={item.label} style={[styles.progressMetaChip, { backgroundColor: item.tone }]}>
                      <Text style={[styles.progressMetaLabel, { color: item.text }]}>{item.label}</Text>
                      <Text style={[styles.progressMetaValue, { color: item.text }]}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>学生成绩</Text>
              <View style={[styles.sectionBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>满分 {FULL_SCORE}</Text>
              </View>
            </View>

            <View style={styles.studentList}>
              {students.map((student, index) => {
                const hasScore = student.score !== '';
                const numScore = Number(student.score);
                const isAbsent = student.absent === true;
                const isFail = hasScore && !isNaN(numScore) && numScore < 60;
                const isExcellent = hasScore && !isNaN(numScore) && numScore >= 90;
                const scoreColor = hasScore && !isNaN(numScore) ? getScoreColor(numScore, colors) : colors.textTertiary;
                const avatarBg = isAbsent
                  ? colors.surfaceSecondary
                  : student.gender === '男'
                    ? colors.palette.blue.bg
                    : colors.palette.red.bg;
                const avatarTextColor = isAbsent
                  ? colors.textTertiary
                  : student.gender === '男'
                    ? colors.palette.blue.text
                    : colors.palette.red.text;

                return (
                  <View
                    key={student.id}
                    style={[
                      styles.studentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isAbsent
                          ? colors.border
                          : isFail
                            ? colors.error + '22'
                            : colors.borderLight,
                      },
                      isAbsent && { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <View style={[styles.studentIndexBadge, { backgroundColor: isFail ? colors.errorLight : colors.surfaceSecondary }]}>
                      <Text style={[styles.studentIndex, { color: isFail ? colors.error : colors.textTertiary }]}>{index + 1}</Text>
                    </View>

                    <View style={[styles.studentAvatar, { backgroundColor: avatarBg }]}>
                      <Text style={[styles.studentAvatarText, { color: avatarTextColor }]}>{student.name.slice(-1)}</Text>
                    </View>

                    <View style={styles.studentInfo}>
                      <View style={styles.studentNameRow}>
                        <Text style={[styles.studentName, { color: isAbsent ? colors.textSecondary : colors.text }]}>{student.name}</Text>
                        {isAbsent && (
                          <View style={[styles.statusChip, { backgroundColor: colors.errorLight }]}>
                            <Text style={[styles.statusChipText, { color: colors.error }]}>缺考</Text>
                          </View>
                        )}
                        {isFail && !isAbsent && (
                          <View style={[styles.statusChip, { backgroundColor: colors.error + '12' }]}>
                            <Text style={[styles.statusChipText, { color: colors.error }]}>待提升</Text>
                          </View>
                        )}
                        {isExcellent && (
                          <View style={[styles.statusChip, { backgroundColor: '#FFF7E8' }]}>
                            <Ionicons name="star" size={10} color="#F59E0B" />
                            <Text style={[styles.statusChipText, { color: '#D97706' }]}>优秀</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{student.studentNo}</Text>
                    </View>

                    {isAbsent ? (
                      <TouchableOpacity
                        style={[styles.absentAction, { backgroundColor: colors.errorLight, borderColor: colors.error + '30' }]}
                        onPress={() => {
                          const updated = [...students];
                          updated[index] = { ...updated[index], absent: false };
                          setStudents(updated);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="refresh-outline" size={14} color={colors.error} />
                        <Text style={[styles.absentActionText, { color: colors.error }]}>恢复</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.scoreArea}>
                        <View style={styles.scoreInputWrapper}>
                          <TextInput
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                              styles.scoreInput,
                              {
                                backgroundColor: hasScore ? `${scoreColor}12` : colors.surfaceSecondary,
                                borderColor: hasScore ? `${scoreColor}35` : colors.border,
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
                          {isExcellent && (
                            <View style={styles.excellentMark}>
                              <Ionicons name="star" size={10} color="#F59E0B" />
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.absentToggle, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
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
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.bottomInfo}>
            <Text style={[styles.bottomInfoLabel, { color: colors.textTertiary }]}>当前录入</Text>
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
  topSection: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  navBack: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  navCenter: { flex: 1, marginLeft: 8 },
  navTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  navAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  navActionText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // Page
  scrollContent: { paddingBottom: 104 },
  pageContent: { paddingHorizontal: 12, paddingTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionSubtitle: { marginTop: 2, fontSize: 11, lineHeight: 16 },
  sectionBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700' },

  // Hero
  heroCard: {
    paddingHorizontal: 0,
    paddingTop: 5,
    paddingBottom: 0,
  },
  heroDecorLarge: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    top: -68,
    right: -18,
  },
  heroDecorSmall: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    bottom: -24,
    right: 28,
  },
  heroCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroCompactMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroCompactMetaText: { color: 'rgba(255,255,255,0.88)', fontSize: 10, fontWeight: '700', flexShrink: 1 },
  heroBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroBadgeLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 9, fontWeight: '700' },
  heroBadgeValue: { color: '#FFF', fontSize: 13, fontWeight: '800', marginTop: 1 },
  heroStatsRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  heroStatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  heroStatLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  heroStatValue: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },

  // Stats
  statsCard: {
    marginTop: 6,
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statsCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  statsCardTitle: { fontSize: 14, fontWeight: '800' },
  statsCardHint: { fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statTile: {
    width: '48.8%',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 3,
  },
  statTileValue: { fontSize: 18, fontWeight: '800' },
  statTileLabel: { fontSize: 10, fontWeight: '600' },
  progressSummaryCard: { marginTop: 6, borderRadius: 16, padding: 10 },
  progressSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressSummaryTitle: { fontSize: 12, fontWeight: '700' },
  progressSummaryValue: { fontSize: 14, fontWeight: '800' },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 7,
  },
  progressFill: { height: '100%', borderRadius: 999 },
  progressMetaRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  progressMetaChip: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 2,
  },
  progressMetaLabel: { fontSize: 9, fontWeight: '700' },
  progressMetaValue: { fontSize: 11, fontWeight: '800' },

  // Students
  studentList: { gap: 7 },
  studentCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  studentIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentIndex: { fontSize: 12, textAlign: 'center', fontWeight: '700' },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 15, fontWeight: '800' },
  studentInfo: { flex: 1, minWidth: 0 },
  studentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  studentName: { fontSize: 13, fontWeight: '700' },
  studentNo: { fontSize: 10, marginTop: 2 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  scoreArea: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreInputWrapper: { position: 'relative' },
  scoreInput: {
    width: 66,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    outlineStyle: 'none',
  } as any,
  excellentMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentToggle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentAction: {
    minWidth: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  absentActionText: { fontSize: 12, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 0.5,
  },
  bottomInfo: { flex: 1 },
  bottomInfoLabel: { fontSize: 11, fontWeight: '600' },
  bottomInfoText: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  saveBtn: {
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 16,
    shadowColor: '#4CC590',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});

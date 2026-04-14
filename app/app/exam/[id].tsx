import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme';
import { PrimaryHeroSection } from '../../src/components/ui/PrimaryHeroSection';
import { AppCard } from '../../src/components/ui/AppCard';
import { AppChip } from '../../src/components/ui/AppChip';
import { AppSectionHeader } from '../../src/components/ui/AppSectionHeader';
import { examApi, scoreApi } from '../../src/services/api';
import { showFeedback } from '../../src/services/feedback';

interface StudentScore {
  id: string;
  name: string;
  studentNo: string;
  score: string;
  absent?: boolean; // 缺考
}

const FULL_SCORE_DEFAULT = 100;

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
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [examName, setExamName] = useState('考试详情');
  const [examSubject, setExamSubject] = useState('');
  const [examClassName, setExamClassName] = useState('');
  const [fullScore, setFullScore] = useState(100);
  const examCaption = `${examSubject} · ${examClassName}`;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const detail = await examApi.detail(Number(id));
        setExamName(detail.name);
        setExamSubject(detail.subject);
        setExamClassName((detail as any).class_name || '');
        setFullScore(detail.full_score);
        const mapped: StudentScore[] = detail.students.map(s => ({
          id: s.student_id.toString(),
          name: s.student_name,
          studentNo: s.student_no,
          score: s.score != null ? s.score.toString() : '',
          absent: false,
        }));
        setStudents(mapped);
      } catch (e) {
        showFeedback({ title: '加载考试详情失败', tone: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
    // 校验不超过满分
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > fullScore) {
      showFeedback({ title: `成绩不能超过满分 ${fullScore}`, tone: 'warning' });
      return;
    }
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
      <PrimaryHeroSection
        bottomRadius={22}
        paddingHorizontal={14}
        paddingTop={4}
        paddingBottom={6}
      >
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>{examName}</Text>
          </View>
          <View style={{ width: 34 }} />
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
      </PrimaryHeroSection>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.pageContent}>
            <AppCard padding="sm" radius={18} style={{ marginTop: 6 }}>
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
                    <AppChip
                      key={item.label}
                      label={`${item.label} ${item.value}`}
                      style={{
                        flex: 1,
                        backgroundColor: item.tone,
                        borderColor: item.tone,
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        justifyContent: 'center',
                      }}
                      textStyle={{ color: item.text, fontSize: 10, fontWeight: '700' }}
                    />
                  ))}
                </View>
              </View>
            </AppCard>

            <AppSectionHeader
              title="学生成绩"
              actionLabel={`满分 ${fullScore}`}
              style={{ marginTop: 10, marginBottom: 6 }}
            />

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
                  : colors.palette.blue.bg;
                const avatarTextColor = isAbsent
                  ? colors.textTertiary
                  : colors.palette.blue.text;

                return (
                  <AppCard
                    key={student.id}
                    padding="none"
                    radius={16}
                    variant={isAbsent ? 'secondary' : 'surface'}
                    style={[
                      styles.studentCardInner,
                      {
                        borderColor: isAbsent
                          ? colors.border
                          : isFail
                            ? colors.error + '22'
                            : colors.borderLight,
                      },
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
                          <AppChip
                            label="缺考"
                            style={{ backgroundColor: colors.errorLight, borderColor: colors.errorLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 }}
                            textStyle={{ color: colors.error, fontSize: 10 }}
                          />
                        )}
                        {isFail && !isAbsent && (
                          <AppChip
                            label="待提升"
                            style={{ backgroundColor: colors.error + '12', borderColor: colors.error + '12', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 }}
                            textStyle={{ color: colors.error, fontSize: 10 }}
                          />
                        )}
                        {isExcellent && (
                          <AppChip
                            iconName="star"
                            label="优秀"
                            style={{ backgroundColor: '#FFF7E8', borderColor: '#FFF7E8', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 }}
                            textStyle={{ color: '#D97706', fontSize: 10 }}
                          />
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
                  </AppCard>
                );
              })}
            </View>
          </View>
        </ScrollView>
        )}

        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.bottomInfo}>
            <Text style={[styles.bottomInfoLabel, { color: colors.textTertiary }]}>当前录入</Text>
            <Text style={[styles.bottomInfoText, { color: colors.textSecondary }]}>
              已录入 <Text style={{ color: colors.primary, fontWeight: '700' }}>{enteredStudents.length}</Text> / {students.length}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={async () => {
              try {
                const items = students
                  .filter(s => s.score !== '' && !s.absent)
                  .map(s => ({ student_id: parseInt(s.id), score: parseFloat(s.score) }))
                  .filter(s => !isNaN(s.score));
                if (items.length === 0) {
                  showFeedback({ title: '请至少录入一个成绩', tone: 'warning' });
                  return;
                }
                const overMax = items.find(s => s.score > fullScore);
                if (overMax) {
                  showFeedback({ title: `存在成绩超过满分 ${fullScore}，请检查`, tone: 'warning' });
                  return;
                }
                await scoreApi.batchSave({ exam_id: Number(id), items });
                showFeedback({ title: `已保存 ${items.length} 条成绩`, tone: 'success' });
              } catch (e) {
                showFeedback({ title: '保存失败，请重试', tone: 'error' });
              }
            }}
          >
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

  // Hero
  heroCard: {
    paddingHorizontal: 0,
    paddingTop: 5,
    paddingBottom: 0,
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

  // Students
  studentList: { gap: 7 },
  studentCardInner: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

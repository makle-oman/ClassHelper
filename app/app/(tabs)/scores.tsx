import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';

interface Exam {
  id: string;
  name: string;
  subject: string;
  date: string;
  className: string;
  fullScore: number;
  enteredCount: number;
  totalStudents: number;
  avg?: number;
  max?: number;
  min?: number;
  passRate?: number;
}

const mockExams: Exam[] = [
  {
    id: '1', name: '期中考试', subject: '语文', date: '2026-03-15',
    className: '三年级2班', fullScore: 100, enteredCount: 43, totalStudents: 43,
    avg: 85.6, max: 98, min: 52, passRate: 92,
  },
  {
    id: '2', name: '第二单元测验', subject: '数学', date: '2026-03-10',
    className: '三年级2班', fullScore: 100, enteredCount: 43, totalStudents: 43,
    avg: 78.3, max: 100, min: 45, passRate: 85,
  },
  {
    id: '3', name: '第一单元测验', subject: '语文', date: '2026-02-28',
    className: '三年级1班', fullScore: 100, enteredCount: 40, totalStudents: 43,
    avg: 82.1, max: 96, min: 48, passRate: 88,
  },
  {
    id: '4', name: '口算竞赛', subject: '数学', date: '2026-03-20',
    className: '三年级2班', fullScore: 50, enteredCount: 10, totalStudents: 43,
  },
];

const subjectColors: Record<string, { bg: string; text: string; dot: string }> = {
  '语文': { bg: '#E8F4FD', text: '#2E86C1', dot: '#2E86C1' },
  '数学': { bg: '#FDEAE4', text: '#D35E44', dot: '#D35E44' },
  '英语': { bg: '#EDE7F6', text: '#7E57C2', dot: '#7E57C2' },
};

export default function ScoresScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'list' | 'analysis'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', subject: '语文', className: '三年级2班', fullScore: '100', date: '' });
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const listScrollRef = useRef<ScrollView | null>(null);
  const analysisScrollRef = useRef<ScrollView | null>(null);

  // 日期选择器
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonth, setPickerMonth] = useState(3);
  const [pickerDay, setPickerDay] = useState(1);
  const dpYears = Array.from({ length: 10 }, (_, i) => 2024 + i);
  const dpMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const dpDaysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const dpDays = Array.from({ length: dpDaysInMonth }, (_, i) => i + 1);

  const openExamDatePicker = () => {
    if (newExam.date) {
      const p = newExam.date.split('-');
      setPickerYear(parseInt(p[0]) || 2026);
      setPickerMonth(parseInt(p[1]) || 3);
      setPickerDay(parseInt(p[2]) || 1);
    } else {
      const now = new Date();
      setPickerYear(now.getFullYear());
      setPickerMonth(now.getMonth() + 1);
      setPickerDay(now.getDate());
    }
    setDatePickerVisible(true);
  };

  const confirmExamDate = () => {
    const d = Math.min(pickerDay, dpDaysInMonth);
    setNewExam({ ...newExam, date: `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    setDatePickerVisible(false);
  };

  const handleCreateExam = () => {
    if (!newExam.name.trim()) return;
    const created: Exam = {
      id: Date.now().toString(),
      name: newExam.name.trim(),
      subject: newExam.subject,
      date: newExam.date || new Date().toISOString().split('T')[0],
      className: newExam.className,
      fullScore: parseInt(newExam.fullScore) || 100,
      enteredCount: 0,
      totalStudents: 43,
    };
    setExams([created, ...exams]);
    setNewExam({ name: '', subject: '语文', className: '三年级2班', fullScore: '100', date: '' });
    setShowCreateModal(false);
  };

  const handleImportScores = () => {
    Alert.alert(
      'Excel 导入成绩',
      '选择包含成绩数据的 Excel 文件（.xlsx）\n\n表头格式：学号、姓名、分数\n\n也可以在电脑端下载标准模板',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '下载模板',
          onPress: () => {
            Alert.alert('模板下载', '在电脑浏览器打开系统后台，进入「成绩管理」即可下载模板');
          },
        },
        {
          text: '选择文件',
          onPress: () => {
            Alert.alert('导入成功', '已成功导入 43 名学生的成绩');
          },
        },
      ]
    );
  };

  const getSubjectColor = (subject: string) => subjectColors[subject] || subjectColors['语文'];
  const pendingCount = exams.filter((exam) => exam.enteredCount < exam.totalStudents).length;
  const completedCount = exams.filter((exam) => exam.enteredCount >= exam.totalStudents).length;
  const highlightedExam = exams.find((exam) => exam.enteredCount < exam.totalStudents) || exams[0];
  const analysisExam = exams.find((exam) => exam.avg != null) || highlightedExam;
  const semesterLabel = '2025-2026学年第二学期';
  const heroMetrics = useMemo(
    () => [
      { label: '考试总数', value: `${exams.length} 场` },
      { label: '待录入', value: `${pendingCount} 场` },
      { label: '已完成', value: `${completedCount} 场` },
    ],
    [completedCount, exams.length, pendingCount],
  );

  const scrollTabToTop = (tab: 'list' | 'analysis', animated = true) => {
    const targetRef = tab === 'list' ? listScrollRef.current : analysisScrollRef.current;
    targetRef?.scrollTo({ x: 0, y: 0, animated });
  };

  const handleTabChange = (tab: 'list' | 'analysis') => {
    if (selectedTab === tab) {
      scrollTabToTop(tab);
      return;
    }
    setSelectedTab(tab);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollTabToTop(selectedTab, false);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedTab]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.scoreHeroCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.scoreHeroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        <View style={[styles.scoreHeroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
        <View style={styles.scoreHeroHeader}>
          <View style={styles.scoreHeroMain}>
            <View style={styles.scoreHeroEyebrowWrap}>
              <Ionicons name="bar-chart-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.scoreHeroEyebrow}>成绩总览</Text>
            </View>
            <Text style={styles.scoreHeroTitle}>{highlightedExam.className}</Text>
            <Text style={styles.scoreHeroMeta}>{semesterLabel}</Text>
          </View>
          <View style={styles.scoreHeroBadge}>
            <Text style={styles.scoreHeroBadgeLabel}>待处理</Text>
            <Text style={styles.scoreHeroBadgeValue}>{pendingCount} 场</Text>
          </View>
        </View>
        <Text style={styles.scoreHeroDescription}>
          还有 {pendingCount} 场考试未录完成绩，点击进入即可继续录分。
        </Text>
        <View style={styles.scoreHeroStatsRow}>
          {heroMetrics.map((item) => (
            <View key={item.label} style={styles.scoreHeroMetricChip}>
              <Text style={styles.scoreHeroMetricLabel}>{item.label}</Text>
              <Text style={styles.scoreHeroMetricValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
        <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['list', 'analysis'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, selectedTab === tab && { backgroundColor: colors.surface }]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'list' ? 'list' : 'analytics'}
                size={15}
                color={selectedTab === tab ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? colors.primary : colors.textTertiary },
                  selectedTab === tab && { fontWeight: '700' },
                ]}
              >
                {tab === 'list' ? '考试列表' : '成绩分析'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedTab === 'list' ? (
        <ScrollView
          key="scores-list-scroll"
          ref={listScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.pageContent}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButtonSecondary, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                activeOpacity={0.7}
                onPress={handleImportScores}
              >
                <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                <Text style={[styles.actionButtonSecondaryText, { color: colors.primary }]}>导入成绩</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButtonPrimary, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={17} color="#FFF" />
                <Text style={styles.actionButtonPrimaryText}>创建考试</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.scopeCard, { backgroundColor: colors.surface }]}>
              <View style={styles.scopeHeader}>
                <View style={styles.scopeTitleWrap}>
                  <Text style={[styles.scopeTitle, { color: colors.text }]}>最近的考试</Text>
                  <Text style={[styles.scopeSubtitle, { color: colors.textTertiary }]}>
                    把成绩录完就能看班级分析和各科对比了
                  </Text>
                </View>
                <View style={[styles.scopeBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.scopeBadgeText, { color: colors.primary }]}>
                    {highlightedExam.className}
                  </Text>
                </View>
              </View>
              <View style={styles.scopeMetaRow}>
                {[
                  { icon: 'albums-outline' as const, text: highlightedExam.name },
                  { icon: 'book-outline' as const, text: highlightedExam.subject },
                  { icon: 'calendar-outline' as const, text: highlightedExam.date },
                ].map((item) => (
                  <View key={item.text} style={[styles.scopeMetaChip, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name={item.icon} size={13} color={colors.textTertiary} />
                    <Text style={[styles.scopeMetaText, { color: colors.textSecondary }]}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>考试进度</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>点击可进入录分或查看详情</Text>
              </View>
              <View style={[styles.sectionBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.sectionBadgeText, { color: colors.textSecondary }]}>{exams.length} 场</Text>
              </View>
            </View>

            <View style={styles.listSection}>
            {exams.map((exam) => {
              const sc = getSubjectColor(exam.subject);
              const isComplete = exam.enteredCount >= exam.totalStudents;
              const progress = exam.totalStudents > 0 ? exam.enteredCount / exam.totalStudents : 0;

              return (
                <TouchableOpacity
                  key={exam.id}
                  style={[styles.examCard, { backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/exam/${exam.id}`)}
                >
                  {/* 左侧彩色条 */}
                  <View style={[styles.examColorBar, { backgroundColor: sc.dot }]} />

                  <View style={styles.examContent}>
                    <View style={styles.examTitleRow}>
                      <View style={styles.examTitleLeft}>
                        <Text style={[styles.examName, { color: colors.text }]}>{exam.name}</Text>
                        <View style={[styles.subjectBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.subjectBadgeText, { color: sc.text }]}>{exam.subject}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: isComplete ? colors.palette.green.bg : colors.palette.orange.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: isComplete ? colors.success : colors.warning }]} />
                        <Text style={[styles.statusText, { color: isComplete ? colors.palette.green.text : colors.palette.orange.text }]}>
                          {isComplete ? '已完成' : '录入中'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.examMetaRow}>
                      {[
                        { icon: 'calendar-outline' as const, text: exam.date },
                        { icon: 'school-outline' as const, text: exam.className },
                        { icon: 'trophy-outline' as const, text: `满分${exam.fullScore}` },
                      ].map((item) => (
                        <View key={item.text} style={[styles.examMetaChip, { backgroundColor: colors.surfaceSecondary }]}>
                          <Ionicons name={item.icon} size={12} color={colors.textTertiary} />
                          <Text style={[styles.examMetaText, { color: colors.textTertiary }]}>{item.text}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.progressCard, { backgroundColor: colors.surfaceSecondary }]}>
                      <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>录入进度</Text>
                        <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                          {exam.enteredCount}/{exam.totalStudents}
                        </Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: isComplete ? colors.success : colors.primary }]} />
                      </View>
                    </View>

                    {isComplete && exam.avg != null && (
                      <View style={styles.examStats}>
                        {[
                          { label: '平均', value: exam.avg.toFixed(1), color: colors.primary },
                          { label: '最高', value: exam.max!.toString(), color: colors.success },
                          { label: '最低', value: exam.min!.toString(), color: colors.error },
                          { label: '及格率', value: `${exam.passRate}%`, color: colors.info },
                        ].map((s) => (
                          <View key={s.label} style={[styles.examStatCard, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.examStatValue, { color: s.color }]}>{s.value}</Text>
                            <Text style={[styles.examStatLabel, { color: colors.textTertiary }]}>{s.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          key="scores-analysis-scroll"
          ref={analysisScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.pageContent}>
            <View style={[styles.analysisOverviewCard, { backgroundColor: colors.surface }]}>
              <View style={styles.scopeHeader}>
                <View style={styles.scopeTitleWrap}>
                  <Text style={[styles.scopeTitle, { color: colors.text }]}>成绩分析</Text>
                  <Text style={[styles.scopeSubtitle, { color: colors.textTertiary }]}>
                    基于已完成的考试数据，查看分数分布和各科成绩走势。
                  </Text>
                </View>
                <View style={[styles.scopeBadge, { backgroundColor: colors.palette.blue.bg }]}>
                  <Text style={[styles.scopeBadgeText, { color: colors.palette.blue.text }]}>
                    {analysisExam.className}
                  </Text>
                </View>
              </View>
              <View style={styles.analysisHeroMeta}>
                {[
                  { label: '学期', value: semesterLabel, layout: 'wide' as const },
                  { label: '考试', value: analysisExam.name, layout: 'half' as const },
                  { label: '科目', value: analysisExam.subject, layout: 'half' as const },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.analysisHeroChip,
                      item.layout === 'wide' ? styles.analysisHeroChipWide : styles.analysisHeroChipHalf,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.analysisHeroChipLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                    <Text style={[styles.analysisHeroChipValue, { color: colors.text }]}>{item.value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.analysisStatsRow}>
                {[
                  { label: '平均分', value: analysisExam.avg != null ? analysisExam.avg.toFixed(1) : '--', color: colors.primary },
                  { label: '及格率', value: analysisExam.passRate != null ? `${analysisExam.passRate}%` : '--', color: colors.success },
                  { label: '最高分', value: analysisExam.max != null ? analysisExam.max.toString() : '--', color: colors.info },
                ].map((item) => (
                  <View key={item.label} style={[styles.analysisStatCard, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.analysisStatValue, { color: item.color }]}>{item.value}</Text>
                    <Text style={[styles.analysisStatLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 班级成绩对比 */}
            <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}>
              <View style={styles.analysisCardHeader}>
                <Text style={[styles.analysisTitle, { color: colors.text }]}>分数段分布</Text>
                <View style={[styles.analysisTag, { backgroundColor: colors.palette.blue.bg }]}>
                  <Text style={[styles.analysisTagText, { color: colors.palette.blue.text }]}>{analysisExam.name} · {analysisExam.subject}</Text>
                </View>
              </View>

              {[
                { range: '90-100', count: 8, label: '优秀', color: '#22C55E' },
                { range: '80-89', count: 15, label: '良好', color: '#3B82F6' },
                { range: '70-79', count: 10, label: '中等', color: '#F59E0B' },
                { range: '60-69', count: 7, label: '及格', color: '#EA580C' },
                { range: '60以下', count: 3, label: '不及格', color: '#EF4444' },
              ].map((item) => (
                <View key={item.range} style={styles.barRow}>
                  <View style={styles.barLabelCol}>
                    <Text style={[styles.barRange, { color: colors.text }]}>{item.range}</Text>
                    <Text style={[styles.barLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={[styles.barFill, { width: `${(item.count / 15) * 100}%`, backgroundColor: item.color }]}>
                      <Text style={styles.barFillText}>{item.count}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* 趋势 */}
            <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}>
              <View style={styles.analysisCardHeader}>
                <Text style={[styles.analysisTitle, { color: colors.text }]}>班级平均分趋势</Text>
                <View style={[styles.analysisTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.analysisTagText, { color: colors.primary }]}>最近三次</Text>
                </View>
              </View>
              <View style={styles.trendList}>
                {[
                  { exam: '第一单元测验', subject: '语文', avg: 82.1, date: '02-28' },
                  { exam: '第二单元测验', subject: '数学', avg: 78.3, date: '03-10' },
                  { exam: '期中考试', subject: '语文', avg: 85.6, date: '03-15' },
                ].map((item, i, arr) => {
                  const prevAvg = i > 0 ? arr[i - 1].avg : item.avg;
                  const trend = item.avg >= prevAvg ? 'up' : 'down';
                  const diff = Math.abs(item.avg - prevAvg).toFixed(1);
                  const sc = getSubjectColor(item.subject);

                  return (
                    <View
                      key={i}
                      style={[
                        styles.trendItem,
                        { backgroundColor: colors.surfaceSecondary },
                        i < arr.length - 1 && { marginBottom: 8 },
                      ]}
                    >
                      <View style={styles.trendLeft}>
                        <View style={[styles.trendDot, { backgroundColor: sc.dot }]} />
                        <View>
                          <Text style={[styles.trendExam, { color: colors.text }]}>{item.exam}</Text>
                          <View style={styles.trendMetaRow}>
                            <View style={[styles.trendSubjectBadge, { backgroundColor: sc.bg }]}>
                              <Text style={[styles.trendSubjectText, { color: sc.text }]}>{item.subject}</Text>
                            </View>
                            <Text style={[styles.trendDate, { color: colors.textTertiary }]}>{item.date}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.trendRight}>
                        <Text style={[styles.trendValue, { color: colors.text }]}>{item.avg}</Text>
                        {i > 0 && (
                          <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? colors.palette.green.bg : colors.palette.red.bg }]}>
                            <Ionicons
                              name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
                              size={10}
                              color={trend === 'up' ? colors.success : colors.error}
                            />
                            <Text style={[styles.trendDiff, { color: trend === 'up' ? colors.success : colors.error }]}>{diff}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 科目对比 */}
            <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}>
              <View style={styles.analysisCardHeader}>
                <Text style={[styles.analysisTitle, { color: colors.text }]}>科目平均分对比</Text>
                <View style={[styles.analysisTag, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.analysisTagText, { color: colors.textSecondary }]}>学科维度</Text>
                </View>
              </View>
              <View style={styles.subjectCompare}>
                {[
                  { subject: '语文', avg: 83.9, exams: 2 },
                  { subject: '数学', avg: 78.3, exams: 1 },
                ].map((item) => {
                  const sc = getSubjectColor(item.subject);
                  return (
                    <View key={item.subject} style={[styles.subjectCompareItem, { backgroundColor: colors.surfaceSecondary }]}>
                      <View style={[styles.subjectCompareIcon, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.subjectCompareIconText, { color: sc.text }]}>{item.subject[0]}</Text>
                      </View>
                      <Text style={[styles.subjectCompareName, { color: colors.text }]}>{item.subject}</Text>
                      <Text style={[styles.subjectCompareAvg, { color: sc.text }]}>{item.avg}</Text>
                      <Text style={[styles.subjectCompareExams, { color: colors.textTertiary }]}>{item.exams} 次考试</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 创建考试弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHero, { backgroundColor: colors.primaryLight }]}>
              <View style={[styles.modalHeroIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.modalHeroTextWrap}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>创建考试</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  填好考试名称和日期，创建后就能直接录分。
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.formSectionCard, { backgroundColor: colors.surfaceSecondary }]}>
                <View style={styles.formSectionHeader}>
                  <View style={styles.formSectionTitleWrap}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>基础信息</Text>
                    <Text style={[styles.formSectionHint, { color: colors.textTertiary }]}>设定考试名称和日期</Text>
                  </View>
                  <View style={[styles.formSectionBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.formSectionBadgeText, { color: colors.primary }]}>必填</Text>
                  </View>
                </View>

                <View style={styles.formSectionFields}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>考试名称</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder="如：期中考试、第三单元测验"
                      placeholderTextColor={colors.textTertiary}
                      value={newExam.name}
                      onChangeText={(t) => setNewExam({ ...newExam, name: t })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>考试日期</Text>
                    <TouchableOpacity
                      style={[styles.datePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={openExamDatePicker}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar-outline" size={16} color={newExam.date ? colors.primary : colors.textTertiary} />
                      <Text style={[styles.datePickerText, { color: newExam.date ? colors.text : colors.textTertiary }]}>
                        {newExam.date || '选择考试日期'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.formSectionCard, { backgroundColor: colors.surfaceSecondary }]}>
                <View style={styles.formSectionHeader}>
                  <View style={styles.formSectionTitleWrap}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>范围设置</Text>
                    <Text style={[styles.formSectionHint, { color: colors.textTertiary }]}>选择科目、班级和满分值</Text>
                  </View>
                  <View style={[styles.formSectionBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.formSectionBadgeText, { color: colors.textSecondary }]}>可调整</Text>
                  </View>
                </View>

                <View style={styles.formSectionFields}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>科目</Text>
                    <View style={styles.optionGrid}>
                      {['语文', '数学', '英语'].map((s) => {
                        const sc = getSubjectColor(s);
                        const isSelected = newExam.subject === s;
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[
                              styles.optionCard,
                              styles.optionCardThird,
                              {
                                backgroundColor: isSelected ? sc.bg : colors.surface,
                                borderColor: isSelected ? sc.text : colors.border,
                              },
                            ]}
                            onPress={() => setNewExam({ ...newExam, subject: s })}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.optionText, { color: isSelected ? sc.text : colors.textSecondary }]}>{s}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级</Text>
                    <View style={styles.optionGrid}>
                      {['三年级1班', '三年级2班'].map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.optionCard,
                            styles.optionCardHalf,
                            {
                              backgroundColor: newExam.className === c ? colors.primaryLight : colors.surface,
                              borderColor: newExam.className === c ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setNewExam({ ...newExam, className: c })}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.optionText, { color: newExam.className === c ? colors.primary : colors.textSecondary }]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>满分</Text>
                    <View style={styles.scoreInputRow}>
                      <TextInput
                        style={[styles.formInput, styles.scoreInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        keyboardType="number-pad"
                        value={newExam.fullScore}
                        onChangeText={(t) => setNewExam({ ...newExam, fullScore: t })}
                      />
                      <View style={[styles.scoreHintCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="people-outline" size={14} color={colors.primary} />
                        <Text style={[styles.scoreHintText, { color: colors.textSecondary }]}>创建后默认全班录分</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateExam}
              >
                <Text style={styles.modalConfirmText}>创建并录入</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 日期选择器 */}
      <Modal visible={datePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
        <TouchableOpacity style={styles.dpOverlay} activeOpacity={1} onPress={() => setDatePickerVisible(false)}>
          <View style={[styles.dpContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.dpHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.dpTitle, { color: colors.text }]}>选择考试日期</Text>
            <View style={styles.dpColumns}>
              <View style={styles.dpColumn}>
                <Text style={[styles.dpColLabel, { color: colors.textTertiary }]}>年</Text>
                <ScrollView style={styles.dpScroll} showsVerticalScrollIndicator={false}>
                  {dpYears.map((y) => (
                    <TouchableOpacity key={y} style={[styles.dpOption, pickerYear === y && { backgroundColor: colors.primaryLight }]} onPress={() => setPickerYear(y)}>
                      <Text style={[styles.dpOptionText, { color: pickerYear === y ? colors.primary : colors.text, fontWeight: pickerYear === y ? '700' : '400' }]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dpColumn}>
                <Text style={[styles.dpColLabel, { color: colors.textTertiary }]}>月</Text>
                <ScrollView style={styles.dpScroll} showsVerticalScrollIndicator={false}>
                  {dpMonths.map((m) => (
                    <TouchableOpacity key={m} style={[styles.dpOption, pickerMonth === m && { backgroundColor: colors.primaryLight }]} onPress={() => setPickerMonth(m)}>
                      <Text style={[styles.dpOptionText, { color: pickerMonth === m ? colors.primary : colors.text, fontWeight: pickerMonth === m ? '700' : '400' }]}>{m}月</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dpColumn}>
                <Text style={[styles.dpColLabel, { color: colors.textTertiary }]}>日</Text>
                <ScrollView style={styles.dpScroll} showsVerticalScrollIndicator={false}>
                  {dpDays.map((d) => (
                    <TouchableOpacity key={d} style={[styles.dpOption, pickerDay === d && { backgroundColor: colors.primaryLight }]} onPress={() => setPickerDay(d)}>
                      <Text style={[styles.dpOptionText, { color: pickerDay === d ? colors.primary : colors.text, fontWeight: pickerDay === d ? '700' : '400' }]}>{d}日</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={[styles.dpPreview, { color: colors.primary }]}>
              {pickerYear}-{String(pickerMonth).padStart(2, '0')}-{String(Math.min(pickerDay, dpDaysInMonth)).padStart(2, '0')}
            </Text>
            <View style={styles.dpActions}>
              <TouchableOpacity style={[styles.dpCancelBtn, { borderColor: colors.border }]} onPress={() => setDatePickerVisible(false)}>
                <Text style={[styles.dpCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dpConfirmBtn, { backgroundColor: colors.primary }]} onPress={confirmExamDate}>
                <Text style={styles.dpConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero & Tabs
  scoreHeroCard: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  scoreHeroDecorLarge: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    top: -42,
    right: -12,
  },
  scoreHeroDecorSmall: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    bottom: -20,
    left: -14,
  },
  scoreHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  scoreHeroMain: { flex: 1, minWidth: 0 },
  scoreHeroEyebrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  scoreHeroEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.2 },
  scoreHeroTitle: { marginTop: 8, fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  scoreHeroMeta: { marginTop: 3, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
  scoreHeroBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  scoreHeroBadgeLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.72)' },
  scoreHeroBadgeValue: { marginTop: 2, fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  scoreHeroDescription: { marginTop: 9, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.8)' },
  scoreHeroStatsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  scoreHeroMetricChip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHeroMetricLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.76)', textAlign: 'center' },
  scoreHeroMetricValue: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  tabBar: { paddingHorizontal: 12, paddingTop: 7, paddingBottom: 6 },
  tabInner: { flexDirection: 'row', borderRadius: 14, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 11 },
  tabText: { fontSize: 13 },
  scrollContent: { paddingBottom: 28 },
  pageContent: { paddingHorizontal: 12, paddingTop: 4 },

  // List page
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionButtonSecondary: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionButtonSecondaryText: { fontSize: 13, fontWeight: '700' },
  actionButtonPrimary: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#4CC590',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonPrimaryText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  scopeCard: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  scopeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  scopeTitleWrap: { flex: 1 },
  scopeTitle: { fontSize: 16, fontWeight: '800' },
  scopeSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  scopeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  scopeBadgeText: { fontSize: 12, fontWeight: '700' },
  scopeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  scopeMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  scopeMetaText: { fontSize: 12, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { fontSize: 12, marginTop: 3 },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700' },
  listSection: { gap: 10 },
  examCard: {
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  examColorBar: { width: 5 },
  examContent: { flex: 1, padding: 14 },
  examTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  examTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, flexWrap: 'wrap' },
  examName: { fontSize: 15, fontWeight: '800' },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subjectBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '700' },
  examMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  examMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  examMetaText: { fontSize: 11 },
  progressCard: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressTrack: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressText: { fontSize: 11, fontWeight: '700' },
  examStats: { flexDirection: 'row', gap: 6, marginTop: 10 },
  examStatCard: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 3 },
  examStatValue: { fontSize: 16, fontWeight: '800' },
  examStatLabel: { fontSize: 10 },

  // Analysis
  analysisOverviewCard: {
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  analysisHeroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  analysisHeroChip: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10 },
  analysisHeroChipWide: { width: '100%' },
  analysisHeroChipHalf: { flexGrow: 1, minWidth: 120 },
  analysisHeroChipLabel: { fontSize: 10, fontWeight: '500' },
  analysisHeroChipValue: { marginTop: 4, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  analysisStatsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  analysisStatCard: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 3 },
  analysisStatValue: { fontSize: 16, fontWeight: '800' },
  analysisStatLabel: { fontSize: 10 },
  analysisCard: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  analysisCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 14 },
  analysisTitle: { fontSize: 16, fontWeight: '800' },
  analysisTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  analysisTagText: { fontSize: 11, fontWeight: '700' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  barLabelCol: { width: 54, alignItems: 'flex-end' },
  barRange: { fontSize: 12, fontWeight: '700' },
  barLabel: { fontSize: 9, marginTop: 1 },
  barTrack: { flex: 1, height: 26, borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8, minWidth: 30 },
  barFillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  trendList: { marginTop: 2 },
  trendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14 },
  trendLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendExam: { fontSize: 14, fontWeight: '700' },
  trendMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trendSubjectBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  trendSubjectText: { fontSize: 10, fontWeight: '700' },
  trendDate: { fontSize: 11 },
  trendRight: { alignItems: 'flex-end', gap: 4 },
  trendValue: { fontSize: 18, fontWeight: '800' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  trendDiff: { fontSize: 10, fontWeight: '700' },
  subjectCompare: { flexDirection: 'row', gap: 10, marginTop: 0 },
  subjectCompareItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, gap: 4 },
  subjectCompareIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectCompareIconText: { fontSize: 16, fontWeight: '800' },
  subjectCompareName: { fontSize: 14, fontWeight: '700' },
  subjectCompareAvg: { fontSize: 22, fontWeight: '800' },
  subjectCompareExams: { fontSize: 11 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  modalContent: { width: '100%', maxWidth: 420, maxHeight: '86%', borderRadius: 24, overflow: 'hidden' },
  modalHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalHeroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalHeroTextWrap: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBody: { flexGrow: 0 },
  modalBodyContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, gap: 12 },
  formSectionCard: { borderRadius: 18, padding: 14 },
  formSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  formSectionTitleWrap: { flex: 1 },
  formSectionTitle: { fontSize: 15, fontWeight: '800' },
  formSectionHint: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  formSectionBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  formSectionBadgeText: { fontSize: 11, fontWeight: '700' },
  formSectionFields: { gap: 14, marginTop: 12 },
  formGroup: {},
  formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 7 },
  formInput: { height: 46, borderRadius: 14, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, outlineStyle: 'none' } as any,
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  optionCardThird: { flexGrow: 1, minWidth: 84 },
  optionCardHalf: { flexGrow: 1, minWidth: 132 },
  optionText: { fontSize: 13, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1.5, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  // Date picker button
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1 },
  datePickerText: { fontSize: 14, fontWeight: '600' },
  scoreInputRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  scoreInput: { width: 96 },
  scoreHintCard: { flex: 1, minHeight: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  scoreHintText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  // Date picker modal
  dpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  dpContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 20 },
  dpHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  dpTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  dpColumns: { flexDirection: 'row', gap: 10, height: 200 },
  dpColumn: { flex: 1 },
  dpColLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  dpScroll: { flex: 1 },
  dpOption: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  dpOptionText: { fontSize: 15 },
  dpPreview: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  dpActions: { flexDirection: 'row', gap: 10 },
  dpCancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dpCancelText: { fontSize: 14, fontWeight: '600' },
  dpConfirmBtn: { flex: 1.5, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dpConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

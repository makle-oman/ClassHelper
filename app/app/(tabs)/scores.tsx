import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
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
      '请选择包含成绩数据的 Excel 文件（.xlsx）\n\n模板格式：学号、姓名、分数\n\n提示：可在电脑端访问系统下载标准模板',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '下载模板',
          onPress: () => {
            Alert.alert('模板下载', '请在电脑浏览器中打开系统后台，进入「成绩管理」页面下载 Excel 导入模板');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Tab 切换 */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['list', 'analysis'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                selectedTab === tab && { backgroundColor: colors.surface },
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'list' ? 'list' : 'analytics'}
                size={16}
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 概览统计 */}
          <View style={styles.overviewRow}>
            {[
              { label: '本学期考试', value: exams.length.toString(), icon: 'document-text' as const, colorKey: 'blue' as const },
              { label: '待录入', value: exams.filter(e => e.enteredCount < e.totalStudents).length.toString(), icon: 'create' as const, colorKey: 'orange' as const },
              { label: '已完成', value: exams.filter(e => e.enteredCount >= e.totalStudents).length.toString(), icon: 'checkmark-circle' as const, colorKey: 'green' as const },
            ].map((item) => (
              <View key={item.label} style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.overviewIconBox, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                  <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                </View>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.overviewLabel, { color: colors.textTertiary }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* 考试列表 */}
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
                    {/* 标题行 */}
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

                    {/* 信息行 */}
                    <View style={styles.examMetaRow}>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.examMetaText, { color: colors.textTertiary }]}>{exam.date}</Text>
                      </View>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="school-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.examMetaText, { color: colors.textTertiary }]}>{exam.className}</Text>
                      </View>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="trophy-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.examMetaText, { color: colors.textTertiary }]}>满分{exam.fullScore}</Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    <View style={styles.progressSection}>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: isComplete ? colors.success : colors.primary }]} />
                      </View>
                      <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                        {exam.enteredCount}/{exam.totalStudents}
                      </Text>
                    </View>

                    {/* 统计数据（已完成才显示） */}
                    {isComplete && exam.avg != null && (
                      <View style={[styles.examStats, { borderTopColor: colors.divider }]}>
                        {[
                          { label: '平均', value: exam.avg.toFixed(1), color: colors.primary },
                          { label: '最高', value: exam.max!.toString(), color: colors.success },
                          { label: '最低', value: exam.min!.toString(), color: colors.error },
                          { label: '及格率', value: exam.passRate + '%', color: colors.info },
                        ].map((s) => (
                          <View key={s.label} style={styles.examStatItem}>
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
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.analysisContent}>
            {/* 班级成绩对比 */}
            <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}>
              <View style={styles.analysisCardHeader}>
                <Text style={[styles.analysisTitle, { color: colors.text }]}>分数段分布</Text>
                <View style={[styles.analysisTag, { backgroundColor: colors.palette.blue.bg }]}>
                  <Text style={[styles.analysisTagText, { color: colors.palette.blue.text }]}>期中考试 · 语文</Text>
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
              <Text style={[styles.analysisTitle, { color: colors.text }]}>班级平均分趋势</Text>
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
                    <View key={i} style={[styles.trendItem, i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider }]}>
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
              <Text style={[styles.analysisTitle, { color: colors.text }]}>科目平均分对比</Text>
              <View style={styles.subjectCompare}>
                {[
                  { subject: '语文', avg: 83.9, exams: 2 },
                  { subject: '数学', avg: 78.3, exams: 1 },
                ].map((item) => {
                  const sc = getSubjectColor(item.subject);
                  return (
                    <View key={item.subject} style={[styles.subjectCompareItem, { borderColor: colors.divider }]}>
                      <View style={[styles.subjectCompareIcon, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.subjectCompareIconText, { color: sc.text }]}>{item.subject[0]}</Text>
                      </View>
                      <Text style={[styles.subjectCompareName, { color: colors.text }]}>{item.subject}</Text>
                      <Text style={[styles.subjectCompareAvg, { color: sc.text }]}>{item.avg}</Text>
                      <Text style={[styles.subjectCompareExams, { color: colors.textTertiary }]}>{item.exams}次考试</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* 底部操作按钮 */}
      <View style={styles.fabGroup}>
        <TouchableOpacity
          style={[styles.fabSecondary, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          activeOpacity={0.7}
          onPress={handleImportScores}
        >
          <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
          <Text style={[styles.fabSecondaryText, { color: colors.primary }]}>导入</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.fabText}>创建考试</Text>
        </TouchableOpacity>
      </View>

      {/* 创建考试弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>创建考试</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>考试名称</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="如：期中考试、第三单元测验"
                  placeholderTextColor={colors.textTertiary}
                  value={newExam.name}
                  onChangeText={(t) => setNewExam({ ...newExam, name: t })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>考试日期</Text>
                <TouchableOpacity
                  style={[styles.datePickerBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={openExamDatePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={16} color={newExam.date ? colors.primary : colors.textTertiary} />
                  <Text style={{ fontSize: 14, color: newExam.date ? colors.text : colors.textTertiary }}>
                    {newExam.date || '选择考试日期'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>科目</Text>
                  <View style={styles.chipRow}>
                    {['语文', '数学', '英语'].map((s) => {
                      const sc = getSubjectColor(s);
                      const isSelected = newExam.subject === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.chip, { backgroundColor: isSelected ? sc.bg : colors.surfaceSecondary, borderColor: isSelected ? sc.text : colors.border }]}
                          onPress={() => setNewExam({ ...newExam, subject: s })}
                        >
                          <Text style={[styles.chipText, { color: isSelected ? sc.text : colors.textSecondary }]}>{s}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级</Text>
                  <View style={styles.chipRow}>
                    {['三年级1班', '三年级2班'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.chip, { backgroundColor: newExam.className === c ? colors.primaryLight : colors.surfaceSecondary, borderColor: newExam.className === c ? colors.primary : colors.border }]}
                        onPress={() => setNewExam({ ...newExam, className: c })}
                      >
                        <Text style={[styles.chipText, { color: newExam.className === c ? colors.primary : colors.textSecondary }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>满分</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border, width: 100 }]}
                  keyboardType="number-pad"
                  value={newExam.fullScore}
                  onChangeText={(t) => setNewExam({ ...newExam, fullScore: t })}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={() => { handleCreateExam(); }}
              >
                <Text style={styles.modalConfirmText}>创建并录入</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  // Tab
  tabBar: { paddingHorizontal: 20, paddingVertical: 10 },
  tabInner: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  tabText: { fontSize: 13 },

  // Overview
  overviewRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 6 },
  overviewCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  overviewIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 20, fontWeight: '800' },
  overviewLabel: { fontSize: 10 },

  // Exam list
  listSection: { paddingHorizontal: 20, marginTop: 16, gap: 12 },
  examCard: { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  examColorBar: { width: 4 },
  examContent: { flex: 1, padding: 16 },
  examTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  examTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  examName: { fontSize: 16, fontWeight: '700' },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  subjectBadgeText: { fontSize: 11, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '600' },
  examMetaRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  examMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  examMetaText: { fontSize: 11 },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', width: 40, textAlign: 'right' },
  examStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14, paddingTop: 14, borderTopWidth: 0.5 },
  examStatItem: { alignItems: 'center', gap: 2 },
  examStatValue: { fontSize: 17, fontWeight: '800' },
  examStatLabel: { fontSize: 10 },

  // FAB
  fabGroup: { position: 'absolute', bottom: 30, right: 20, flexDirection: 'row', gap: 8 },
  fabSecondary: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  fabSecondaryText: { fontSize: 12, fontWeight: '600' },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 14, borderRadius: 12, shadowColor: '#4CC590', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Analysis
  analysisContent: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  analysisCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  analysisCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  analysisTitle: { fontSize: 16, fontWeight: '700' },
  analysisTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  analysisTagText: { fontSize: 11, fontWeight: '600' },

  // Bar chart
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  barLabelCol: { width: 54, alignItems: 'flex-end' },
  barRange: { fontSize: 12, fontWeight: '600' },
  barLabel: { fontSize: 9, marginTop: 1 },
  barTrack: { flex: 1, height: 26, borderRadius: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 8, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8, minWidth: 30 },
  barFillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // Trend
  trendList: { marginTop: 14 },
  trendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  trendLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendExam: { fontSize: 14, fontWeight: '600' },
  trendMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trendSubjectBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  trendSubjectText: { fontSize: 10, fontWeight: '600' },
  trendDate: { fontSize: 11 },
  trendRight: { alignItems: 'flex-end', gap: 4 },
  trendValue: { fontSize: 20, fontWeight: '800' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendDiff: { fontSize: 10, fontWeight: '700' },

  // Subject compare
  subjectCompare: { flexDirection: 'row', gap: 12, marginTop: 14 },
  subjectCompareItem: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 0.5, gap: 6 },
  subjectCompareIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectCompareIconText: { fontSize: 16, fontWeight: '800' },
  subjectCompareName: { fontSize: 14, fontWeight: '600' },
  subjectCompareAvg: { fontSize: 24, fontWeight: '800' },
  subjectCompareExams: { fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContent: { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formInput: { height: 44, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, outlineStyle: 'none' } as any,
  formRow: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1.5, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  // Date picker button
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1 },
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

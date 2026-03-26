import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

interface Homework {
  id: string;
  title: string;
  subject: string;
  className: string;
  deadline: string;
  totalStudents: number;
  submitted: number;
  late: number;
  status: 'active' | 'expired' | 'completed';
}

const mockHomework: Homework[] = [
  { id: '1', title: '完成课本 P42-43 练习题', subject: '数学', className: '三年级1班', deadline: '2026-03-25', totalStudents: 43, submitted: 38, late: 2, status: 'active' },
  { id: '2', title: '背诵《望庐山瀑布》并默写', subject: '语文', className: '三年级2班', deadline: '2026-03-23', totalStudents: 43, submitted: 43, late: 1, status: 'completed' },
  { id: '3', title: '抄写单词表 Unit3 并造句', subject: '英语', className: '三年级1班', deadline: '2026-03-20', totalStudents: 43, submitted: 35, late: 3, status: 'expired' },
];

type Grade = '优' | '良' | '中' | '差' | null;

interface SubmissionRecord {
  id: string;
  name: string;
  studentNo: string;
  status: 'submitted' | 'not_submitted' | 'late';
  grade: Grade;
}

const initialSubmissions: Record<string, SubmissionRecord[]> = {
  '1': [
    { id: '1', name: '张小明', studentNo: '20230101', status: 'submitted', grade: '优' },
    { id: '2', name: '李小红', studentNo: '20230102', status: 'submitted', grade: '良' },
    { id: '3', name: '王大力', studentNo: '20230103', status: 'not_submitted', grade: null },
    { id: '4', name: '赵小燕', studentNo: '20230104', status: 'late', grade: null },
    { id: '5', name: '刘天宇', studentNo: '20230105', status: 'submitted', grade: '中' },
    { id: '6', name: '陈美丽', studentNo: '20230106', status: 'not_submitted', grade: null },
    { id: '7', name: '孙浩然', studentNo: '20230107', status: 'submitted', grade: null },
    { id: '8', name: '周小雪', studentNo: '20230108', status: 'submitted', grade: '优' },
  ],
  '2': [
    { id: '1', name: '刘佳怡', studentNo: '20230201', status: 'submitted', grade: '优' },
    { id: '2', name: '陈思远', studentNo: '20230202', status: 'submitted', grade: '优' },
    { id: '3', name: '王子涵', studentNo: '20230203', status: 'submitted', grade: '良' },
    { id: '4', name: '张雨萱', studentNo: '20230204', status: 'submitted', grade: '良' },
    { id: '5', name: '李明轩', studentNo: '20230205', status: 'submitted', grade: '中' },
    { id: '6', name: '赵欣怡', studentNo: '20230206', status: 'submitted', grade: '优' },
    { id: '7', name: '孙博文', studentNo: '20230207', status: 'submitted', grade: '良' },
    { id: '8', name: '周雅琪', studentNo: '20230208', status: 'submitted', grade: '优' },
  ],
};

const gradeConfig: Record<string, { bg: string; text: string; emoji: string }> = {
  '优': { bg: '#DCFCE7', text: '#16A34A', emoji: '🌟' },
  '良': { bg: '#DBEAFE', text: '#2563EB', emoji: '👍' },
  '中': { bg: '#FEF3C7', text: '#D97706', emoji: '✏️' },
  '差': { bg: '#FEE2E2', text: '#DC2626', emoji: '📝' },
};

const subjectColors: Record<string, { bg: string; text: string; dot: string }> = {
  语文: { bg: '#E8F4FD', text: '#2E86C1', dot: '#2E86C1' },
  数学: { bg: '#FDEAE4', text: '#D35E44', dot: '#D35E44' },
  英语: { bg: '#EDE7F6', text: '#7E57C2', dot: '#7E57C2' },
};

export default function HomeworkScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'list' | 'status'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHomework, setNewHomework] = useState({ content: '', subject: '语文', className: '三年级1班', deadline: '' });
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(mockHomework[0].id);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [gradingStudentId, setGradingStudentId] = useState<string | null>(null);

  const handleGrade = (studentId: string, grade: Grade) => {
    setSubmissions((prev) => ({
      ...prev,
      [selectedHomeworkId]: (prev[selectedHomeworkId] || []).map((s) =>
        s.id === studentId ? { ...s, grade } : s
      ),
    }));
    setGradingStudentId(null);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

  const getSubjectColor = (subject: string) => subjectColors[subject] || subjectColors['语文'];

  const getStatusConfig = (status: Homework['status']) => {
    switch (status) {
      case 'active':
        return { label: '进行中', bg: colors.palette.orange.bg, text: colors.palette.orange.text, dot: colors.warning };
      case 'expired':
        return { label: '已截止', bg: colors.surfaceSecondary, text: colors.textTertiary, dot: colors.textTertiary };
      case 'completed':
        return { label: '全部完成', bg: colors.palette.green.bg, text: colors.palette.green.text, dot: colors.success };
    }
  };

  const getSubmissionStatusConfig = (status: SubmissionRecord['status']) => {
    switch (status) {
      case 'submitted':
        return { label: '已交', bg: colors.palette.green.bg, text: colors.palette.green.text };
      case 'not_submitted':
        return { label: '未交', bg: colors.palette.red.bg, text: colors.palette.red.text };
      case 'late':
        return { label: '迟交', bg: colors.palette.orange.bg, text: colors.palette.orange.text };
    }
  };

  const selectedHomework = mockHomework.find((item) => item.id === selectedHomeworkId) || mockHomework[0];
  const currentSubmissions = submissions[selectedHomeworkId] || [];
  const submittedCount = currentSubmissions.filter((item: SubmissionRecord) => item.status === 'submitted').length;
  const notSubmittedCount = currentSubmissions.filter((item: SubmissionRecord) => item.status === 'not_submitted').length;
  const lateCount = currentSubmissions.filter((item: SubmissionRecord) => item.status === 'late').length;
  const gradedCount = currentSubmissions.filter((item: SubmissionRecord) => item.grade != null).length;
  const totalGradable = currentSubmissions.filter((item: SubmissionRecord) => item.status !== 'not_submitted').length;

  const activeCount = useMemo(() => mockHomework.filter((item) => item.status === 'active').length, []);
  const pendingReviewCount = useMemo(() => mockHomework.reduce((sum, item) => sum + (item.totalStudents - item.submitted), 0), []);
  const averageCompletion = useMemo(() => {
    const ratio = mockHomework.reduce((sum, item) => sum + item.submitted / item.totalStudents, 0) / mockHomework.length;
    return `${Math.round(ratio * 100)}%`;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
          <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={handleBack}
              activeOpacity={0.78}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroPageTitle}>作业管理</Text>
            <View style={styles.heroTopSpacer} />
          </View>
          <Text style={styles.heroEyebrow}>作业看板</Text>
          <Text style={styles.heroTitle}>{selectedTab === 'list' ? '本周作业概览' : '批改与完成追踪'}</Text>
          <View style={styles.heroStatsRow}>
            {(selectedTab === 'list'
              ? [
                  { label: '进行中', value: activeCount.toString() },
                  { label: '待提交', value: pendingReviewCount.toString() },
                  { label: '平均完成', value: averageCompletion },
                ]
              : [
                  { label: '已交', value: submittedCount.toString() },
                  { label: '已批改', value: `${gradedCount}/${totalGradable}` },
                  { label: '批改率', value: totalGradable > 0 ? `${Math.round((gradedCount / totalGradable) * 100)}%` : '0%' },
                ]
            ).map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.heroStatItem,
                  index < 2 && { borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.14)' },
                ]}
              >
                <Text style={styles.heroStatValue}>{item.value}</Text>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.tabCard, { backgroundColor: colors.surface }]}> 
          <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}> 
            {(['list', 'status'] as const).map((tab) => {
              const selected = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, selected && { backgroundColor: colors.surface }]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Ionicons name={tab === 'list' ? 'list-outline' : 'checkmark-done-outline'} size={16} color={selected ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.tabText, { color: selected ? colors.primary : colors.textTertiary }]}>{tab === 'list' ? '作业列表' : '完成情况'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {selectedTab === 'list' ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>作业列表</Text>
                <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>按截止时间和完成度查看作业</Text>
              </View>
            </View>
            <View style={styles.listSection}>
              {mockHomework.map((hw) => {
                const subjectColor = getSubjectColor(hw.subject);
                const status = getStatusConfig(hw.status);
                const progress = hw.totalStudents > 0 ? Math.round((hw.submitted / hw.totalStudents) * 100) : 0;

                return (
                  <View key={hw.id} style={[styles.homeworkCard, { backgroundColor: colors.surface }]}> 
                    <View style={[styles.homeworkAccent, { backgroundColor: subjectColor.dot }]} />
                    <View style={styles.homeworkBody}>
                      <View style={styles.homeworkHeader}>
                        <View style={styles.homeworkHeaderLeft}>
                          <Text style={[styles.homeworkTitle, { color: colors.text }]} numberOfLines={1}>{hw.title}</Text>
                          <View style={[styles.subjectBadge, { backgroundColor: subjectColor.bg }]}> 
                            <Text style={[styles.subjectBadgeText, { color: subjectColor.text }]}>{hw.subject}</Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}> 
                          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                          <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <View style={[styles.metaChip, { backgroundColor: colors.surfaceSecondary }]}> 
                          <Ionicons name="school-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{hw.className}</Text>
                        </View>
                        <View style={[styles.metaChip, { backgroundColor: colors.surfaceSecondary }]}> 
                          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{hw.deadline}</Text>
                        </View>
                      </View>

                      <View style={[styles.progressBlock, { borderTopColor: colors.divider }]}> 
                        <View style={styles.progressHeader}>
                          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>提交进度</Text>
                          <Text style={[styles.progressValue, { color: colors.primary }]}>{hw.submitted}/{hw.totalStudents}</Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}> 
                          <View style={[styles.progressFill, { backgroundColor: hw.status === 'completed' ? colors.success : colors.primary, width: `${progress}%` }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={[styles.selectorCard, { backgroundColor: colors.surface }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>查看口径</Text>
              <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>选择一份作业，查看每位学生的完成情况</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                {mockHomework.map((hw) => {
                  const selected = hw.id === selectedHomeworkId;
                  return (
                    <TouchableOpacity
                      key={hw.id}
                      style={[
                        styles.selectorChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setSelectedHomeworkId(hw.id)}
                    >
                      <Text style={[styles.selectorChipText, { color: selected ? '#FFF' : colors.textSecondary }]} numberOfLines={1}>{hw.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.overviewRow}>
              {[
                { label: '已交', value: submittedCount.toString(), icon: 'checkmark-circle' as const, colorKey: 'green' as const },
                { label: '未交', value: notSubmittedCount.toString(), icon: 'close-circle' as const, colorKey: 'red' as const },
                { label: '迟交', value: lateCount.toString(), icon: 'time' as const, colorKey: 'orange' as const },
                { label: '已批改', value: gradedCount.toString(), icon: 'pencil' as const, colorKey: 'blue' as const },
              ].map((item) => (
                <View key={item.label} style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.overviewIcon, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                    <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>{item.value}</Text>
                  <Text style={[styles.overviewLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.currentHomeworkCard, { backgroundColor: colors.surface }]}>
              <View style={styles.currentHomeworkHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.currentHomeworkTitle, { color: colors.text }]}>{selectedHomework.title}</Text>
                  <Text style={[styles.currentHomeworkMeta, { color: colors.textTertiary }]}>{selectedHomework.subject} · {selectedHomework.className} · 截止 {selectedHomework.deadline}</Text>
                </View>
                {totalGradable > 0 && (
                  <View style={[styles.gradingBadge, { backgroundColor: gradedCount >= totalGradable ? colors.palette.green.bg : colors.palette.orange.bg }]}>
                    <Text style={[styles.gradingBadgeText, { color: gradedCount >= totalGradable ? colors.palette.green.text : colors.palette.orange.text }]}>
                      {gradedCount >= totalGradable ? '批改完成' : `待批 ${totalGradable - gradedCount}`}
                    </Text>
                  </View>
                )}
              </View>
              {totalGradable > 0 && (
                <View style={styles.gradingProgressBlock}>
                  <View style={styles.gradingProgressHeader}>
                    <Text style={[styles.gradingProgressLabel, { color: colors.textSecondary }]}>批改进度</Text>
                    <Text style={[styles.gradingProgressValue, { color: colors.primary }]}>{gradedCount}/{totalGradable}</Text>
                  </View>
                  <View style={[styles.gradingProgressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={[styles.gradingProgressFill, { backgroundColor: gradedCount >= totalGradable ? colors.success : colors.primary, width: `${Math.round((gradedCount / totalGradable) * 100)}%` }]} />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.listSection}>
              {currentSubmissions.map((student: SubmissionRecord) => {
                const status = getSubmissionStatusConfig(student.status);
                const isGradingThis = gradingStudentId === student.id;
                const canGrade = student.status !== 'not_submitted';
                return (
                  <View key={student.id} style={[styles.studentRow, { backgroundColor: colors.surface }, isGradingThis && { borderColor: colors.primary, borderWidth: 1.5 }]}>
                    <View style={[styles.studentAvatar, { backgroundColor: student.grade ? gradeConfig[student.grade].bg : colors.palette.blue.bg }]}>
                      <Text style={[styles.studentAvatarText, { color: student.grade ? gradeConfig[student.grade].text : colors.palette.blue.text }]}>
                        {student.grade ? gradeConfig[student.grade].emoji : student.name[0]}
                      </Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                      <View style={styles.studentMetaRow}>
                        <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{student.studentNo}</Text>
                        {student.grade && (
                          <View style={[styles.gradeBadgeSmall, { backgroundColor: gradeConfig[student.grade].bg }]}>
                            <Text style={[styles.gradeBadgeSmallText, { color: gradeConfig[student.grade].text }]}>{student.grade}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {canGrade ? (
                      isGradingThis ? (
                        <View style={styles.gradeSelector}>
                          {(['优', '良', '中', '差'] as Grade[]).map((g) => (
                            <TouchableOpacity
                              key={g!}
                              style={[
                                styles.gradeOption,
                                {
                                  backgroundColor: student.grade === g ? gradeConfig[g!].bg : colors.surfaceSecondary,
                                  borderColor: student.grade === g ? gradeConfig[g!].text : 'transparent',
                                },
                              ]}
                              activeOpacity={0.7}
                              onPress={() => handleGrade(student.id, g)}
                            >
                              <Text style={[styles.gradeOptionText, { color: student.grade === g ? gradeConfig[g!].text : colors.textSecondary }]}>{g}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.submissionBadge,
                            { backgroundColor: student.grade ? gradeConfig[student.grade].bg : status.bg },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setGradingStudentId(student.id)}
                        >
                          <Text style={[styles.submissionBadgeText, { color: student.grade ? gradeConfig[student.grade].text : status.text }]}>
                            {student.grade || status.label}
                          </Text>
                          <Ionicons name="chevron-down" size={12} color={student.grade ? gradeConfig[student.grade].text : status.text} />
                        </TouchableOpacity>
                      )
                    ) : (
                      <View style={[styles.submissionBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.submissionBadgeText, { color: status.text }]}>{status.label}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.82}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>布置作业</Text>
                <Text style={[styles.modalHint, { color: colors.textTertiary }]}>填写作业信息后发布给学生</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级</Text>
                <View style={styles.chipWrap}>
                  {['三年级1班', '三年级2班'].map((className) => {
                    const selected = newHomework.className === className;
                    return (
                      <TouchableOpacity
                        key={className}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: selected ? colors.primaryLight : colors.surfaceSecondary,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setNewHomework((prev) => ({ ...prev, className }))}
                      >
                        <Text style={[styles.optionChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{className}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>科目</Text>
                <View style={styles.chipWrap}>
                  {['语文', '数学', '英语'].map((subject) => {
                    const subjectColor = getSubjectColor(subject);
                    const selected = newHomework.subject === subject;
                    return (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: selected ? subjectColor.bg : colors.surfaceSecondary,
                            borderColor: selected ? subjectColor.text : colors.border,
                          },
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setNewHomework((prev) => ({ ...prev, subject }))}
                      >
                        <Text style={[styles.optionChipText, { color: selected ? subjectColor.text : colors.textSecondary }]}>{subject}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>作业内容</Text>
                <TextInput
                  style={[styles.formTextArea, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="请输入作业内容"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={newHomework.content}
                  onChangeText={(value) => setNewHomework((prev) => ({ ...prev, content: value }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>截止日期</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="如：2026-03-25"
                  placeholderTextColor={colors.textTertiary}
                  value={newHomework.deadline}
                  onChangeText={(value) => setNewHomework((prev) => ({ ...prev, deadline: value }))}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                activeOpacity={0.75}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.82}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalConfirmText}>发布作业</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 14, zIndex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 96 },
  heroCard: {
    marginHorizontal: -14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBackButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroPageTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  heroTopSpacer: { width: 34, height: 34 },
  heroDecorLarge: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -80, right: -50 },
  heroDecorSmall: { position: 'absolute', width: 120, height: 120, borderRadius: 60, bottom: -20, left: -30 },
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', marginTop: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4 },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  tabCard: { borderRadius: 18, padding: 10, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  tabInner: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '700' },
  sectionHeaderRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12, marginTop: 4 },
  listSection: { gap: 12 },
  homeworkCard: { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  homeworkAccent: { width: 5 },
  homeworkBody: { flex: 1, padding: 16 },
  homeworkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  homeworkHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  homeworkTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  subjectBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  metaChipText: { fontSize: 12, fontWeight: '500' },
  progressBlock: { marginTop: 14, paddingTop: 12, borderTopWidth: 0.5 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 999 },
  selectorCard: { borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  selectorRow: { gap: 8, paddingTop: 12 },
  selectorChip: { maxWidth: 220, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  selectorChipText: { fontSize: 13, fontWeight: '600' },
  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  overviewCard: { flex: 1, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  overviewIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 20, fontWeight: '800', marginTop: 10 },
  overviewLabel: { fontSize: 11, marginTop: 4 },
  currentHomeworkCard: { borderRadius: 18, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  currentHomeworkTitle: { fontSize: 15, fontWeight: '700' },
  currentHomeworkMeta: { fontSize: 12, marginTop: 6 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  studentAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 15, fontWeight: '700' },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '700' },
  studentNo: { fontSize: 12, marginTop: 4 },
  submissionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  submissionBadgeText: { fontSize: 11, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#4CC590', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHint: { fontSize: 12, marginTop: 4 },
  modalBody: { paddingHorizontal: 14, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  formInput: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  formTextArea: { height: 110, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, fontSize: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  optionChipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 20, paddingTop: 4 },
  modalCancelButton: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalConfirmButton: { flex: 1.35, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Grading styles
  currentHomeworkHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  gradingBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginTop: 2 },
  gradingBadgeText: { fontSize: 11, fontWeight: '700' },
  gradingProgressBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)' },
  gradingProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradingProgressLabel: { fontSize: 12, fontWeight: '600' },
  gradingProgressValue: { fontSize: 12, fontWeight: '700' },
  gradingProgressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  gradingProgressFill: { height: '100%', borderRadius: 999 },
  studentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  gradeBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gradeBadgeSmallText: { fontSize: 10, fontWeight: '700' },
  gradeSelector: { flexDirection: 'row', gap: 6 },
  gradeOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  gradeOptionText: { fontSize: 12, fontWeight: '700' },
});

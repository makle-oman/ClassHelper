import { useState } from 'react';
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
  { id: '1', title: '完成课本P42-43练习题', subject: '数学', className: '三年级2班', deadline: '2026-03-25', totalStudents: 43, submitted: 38, late: 2, status: 'active' },
  { id: '2', title: '背诵《望庐山瀑布》并默写', subject: '语文', className: '三年级1班', deadline: '2026-03-23', totalStudents: 43, submitted: 43, late: 1, status: 'completed' },
  { id: '3', title: '抄写单词表Unit3并造句', subject: '英语', className: '三年级2班', deadline: '2026-03-20', totalStudents: 43, submitted: 35, late: 3, status: 'expired' },
];

interface SubmissionRecord {
  id: string;
  name: string;
  studentNo: string;
  status: 'submitted' | 'not_submitted' | 'late';
}

const mockSubmissions: Record<string, SubmissionRecord[]> = {
  '1': [
    { id: '1', name: '张小明', studentNo: '20230101', status: 'submitted' },
    { id: '2', name: '李小红', studentNo: '20230102', status: 'submitted' },
    { id: '3', name: '王大力', studentNo: '20230103', status: 'not_submitted' },
    { id: '4', name: '赵小燕', studentNo: '20230104', status: 'late' },
    { id: '5', name: '刘天宝', studentNo: '20230105', status: 'submitted' },
    { id: '6', name: '陈美丽', studentNo: '20230106', status: 'not_submitted' },
    { id: '7', name: '孙浩然', studentNo: '20230107', status: 'submitted' },
    { id: '8', name: '周小婷', studentNo: '20230108', status: 'submitted' },
  ],
};

const subjectColors: Record<string, { bg: string; text: string; dot: string }> = {
  '语文': { bg: '#E8F4FD', text: '#2E86C1', dot: '#2E86C1' },
  '数学': { bg: '#FDEAE4', text: '#D35E44', dot: '#D35E44' },
  '英语': { bg: '#EDE7F6', text: '#7E57C2', dot: '#7E57C2' },
};

export default function HomeworkScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'list' | 'status'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHomework, setNewHomework] = useState({ content: '', subject: '语文', className: '三年级2班', deadline: '' });
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(mockHomework[0].id);

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

  const selectedHomework = mockHomework.find(h => h.id === selectedHomeworkId);
  const submissions = mockSubmissions[selectedHomeworkId] || [];
  const submittedCount = submissions.filter(s => s.status === 'submitted').length;
  const notSubmittedCount = submissions.filter(s => s.status === 'not_submitted').length;
  const lateCount = submissions.filter(s => s.status === 'late').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>作业管理</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab 切换 */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['list', 'status'] as const).map((tab) => (
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
                name={tab === 'list' ? 'list' : 'checkmark-done'}
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
                {tab === 'list' ? '作业列表' : '完成情况'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedTab === 'list' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 作业列表 */}
          <View style={styles.listSection}>
            {mockHomework.map((hw) => {
              const sc = getSubjectColor(hw.subject);
              const statusCfg = getStatusConfig(hw.status);
              const progress = hw.totalStudents > 0 ? hw.submitted / hw.totalStudents : 0;

              return (
                <View
                  key={hw.id}
                  style={[styles.examCard, { backgroundColor: colors.surface }]}
                >
                  {/* 左侧彩色条 */}
                  <View style={[styles.examColorBar, { backgroundColor: sc.dot }]} />

                  <View style={styles.examContent}>
                    {/* 标题行 */}
                    <View style={styles.examTitleRow}>
                      <View style={styles.examTitleLeft}>
                        <Text style={[styles.examName, { color: colors.text }]} numberOfLines={1}>{hw.title}</Text>
                        <View style={[styles.subjectBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.subjectBadgeText, { color: sc.text }]}>{hw.subject}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                        <Text style={[styles.statusText, { color: statusCfg.text }]}>
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>

                    {/* 信息行 */}
                    <View style={styles.examMetaRow}>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="school-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.examMetaText, { color: colors.textTertiary }]}>{hw.className}</Text>
                      </View>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.examMetaText, { color: colors.textTertiary }]}>{hw.deadline}</Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    <View style={styles.progressSection}>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: hw.status === 'completed' ? colors.success : colors.primary }]} />
                      </View>
                      <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                        已交 {hw.submitted}/{hw.totalStudents}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 作业选择器 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.homeworkSelector}
            contentContainerStyle={styles.homeworkSelectorContent}
          >
            {mockHomework.map((hw) => {
              const isSelected = hw.id === selectedHomeworkId;
              return (
                <TouchableOpacity
                  key={hw.id}
                  style={[
                    styles.homeworkChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedHomeworkId(hw.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.homeworkChipText,
                      { color: isSelected ? '#FFF' : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {hw.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 概览统计 */}
          <View style={styles.overviewRow}>
            {[
              { label: '已交', value: submittedCount.toString(), icon: 'checkmark-circle' as const, colorKey: 'green' as const },
              { label: '未交', value: notSubmittedCount.toString(), icon: 'close-circle' as const, colorKey: 'red' as const },
              { label: '迟交', value: lateCount.toString(), icon: 'time' as const, colorKey: 'orange' as const },
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

          {/* 学生列表 */}
          <View style={styles.studentListSection}>
            {submissions.map((student) => {
              const statusCfg = getSubmissionStatusConfig(student.status);
              return (
                <View key={student.id} style={[styles.studentRow, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
                  <View style={[styles.studentAvatar, { backgroundColor: colors.palette.blue.bg }]}>
                    <Text style={[styles.studentAvatarText, { color: colors.palette.blue.text }]}>{student.name[0]}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                    <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{student.studentNo}</Text>
                  </View>
                  <View style={[styles.submissionBadge, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.submissionBadgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* 创建作业浮动按钮 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* 创建作业弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>布置作业</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>班级</Text>
                <View style={styles.chipRow}>
                  {['三年级1班', '三年级2班'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, { backgroundColor: newHomework.className === c ? colors.primaryLight : colors.surfaceSecondary, borderColor: newHomework.className === c ? colors.primary : colors.border }]}
                      onPress={() => setNewHomework({ ...newHomework, className: c })}
                    >
                      <Text style={[styles.chipText, { color: newHomework.className === c ? colors.primary : colors.textSecondary }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>科目</Text>
                <View style={styles.chipRow}>
                  {['语文', '数学', '英语'].map((s) => {
                    const sc = getSubjectColor(s);
                    const isSelected = newHomework.subject === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.chip, { backgroundColor: isSelected ? sc.bg : colors.surfaceSecondary, borderColor: isSelected ? sc.text : colors.border }]}
                        onPress={() => setNewHomework({ ...newHomework, subject: s })}
                      >
                        <Text style={[styles.chipText, { color: isSelected ? sc.text : colors.textSecondary }]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>作业内容</Text>
                <TextInput
                  style={[styles.formTextArea, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入作业内容..."
                  placeholderTextColor={colors.textTertiary}
                  value={newHomework.content}
                  onChangeText={(t) => setNewHomework({ ...newHomework, content: t })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>截止日期</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="如：2026-03-25"
                  placeholderTextColor={colors.textTertiary}
                  value={newHomework.deadline}
                  onChangeText={(t) => setNewHomework({ ...newHomework, deadline: t })}
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
                onPress={() => { setShowCreateModal(false); }}
              >
                <Text style={styles.modalConfirmText}>发布</Text>
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

  // Nav
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  navTitle: { fontSize: 17, fontWeight: '700' },

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

  // Homework list
  listSection: { paddingHorizontal: 20, marginTop: 16, gap: 12 },
  examCard: { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  examColorBar: { width: 4 },
  examContent: { flex: 1, padding: 16 },
  examTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  examTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  examName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  subjectBadgeText: { fontSize: 11, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '600' },
  examMetaRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  examMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  examMetaText: { fontSize: 11 },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', minWidth: 55, textAlign: 'right' },

  // Homework selector (Tab 2)
  homeworkSelector: { marginTop: 10 },
  homeworkSelectorContent: { paddingHorizontal: 20, gap: 8 },
  homeworkChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, maxWidth: 200 },
  homeworkChipText: { fontSize: 13, fontWeight: '600' },

  // Student list
  studentListSection: { marginTop: 16, marginHorizontal: 20, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 14, fontWeight: '700' },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '500' },
  studentNo: { fontSize: 11, marginTop: 2 },
  submissionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  submissionBadgeText: { fontSize: 11, fontWeight: '600' },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#4CC590', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContent: { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formInput: { height: 44, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, outlineStyle: 'none' } as any,
  formTextArea: { height: 100, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, fontSize: 14, borderWidth: 1, outlineStyle: 'none' } as any,
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1.5, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

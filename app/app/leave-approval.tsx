import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { PrimaryHeroSection } from '../src/components/ui/PrimaryHeroSection';
import { AppCard } from '../src/components/ui/AppCard';
import { AppButton } from '../src/components/ui/AppButton';
import { classApi, leaveApi } from '../src/services/api';
import type { ClassInfo } from '../src/services/api/class';
import type { LeaveInfo } from '../src/services/api/leave';
import { showFeedback } from '../src/services/feedback';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

/** Backend status <-> frontend status */
const backendStatusToFrontend: Record<string, LeaveStatus> = {
  '待审批': 'pending',
  '已批准': 'approved',
  '已拒绝': 'rejected',
};

/** Calculate days between two date strings */
function calcDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

/** Format a date string for display, e.g. "3月24日" */
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** Map a LeaveInfo from API to the view model used by the card renderer */
function mapLeave(info: LeaveInfo, classes: ClassInfo[]) {
  const status = backendStatusToFrontend[info.status] ?? 'pending';
  return {
    id: String(info.id),
    studentName: info.student?.name ?? '未知学生',
    studentId: info.student?.student_no ?? '',
    className: classes.find((c) => c.id === info.class_id)?.name ?? '',
    startDate: formatDateShort(info.start_date),
    endDate: formatDateShort(info.end_date),
    days: calcDays(info.start_date, info.end_date),
    reason: info.reason,
    parentName: info.parent?.name ?? '—',
    parentRelation: info.parent?.relationship ?? '',
    status,
    createdAt: info.created_at?.replace('T', ' ').slice(0, 16) ?? '',
    processedAt: info.reviewed_at?.replace('T', ' ').slice(0, 16) ?? undefined,
    _apiId: info.id,
  };
}

type MappedLeave = ReturnType<typeof mapLeave>;

const avatarColors = ['#4CC590', '#3B82F6', '#F59E0B', '#EC4899', '#7C3AED', '#0891B2'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function LeaveApprovalScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processed'>('pending');

  // API data state
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [leaves, setLeaves] = useState<MappedLeave[]>([]);
  const [loading, setLoading] = useState(false);

  // Load classes on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await classApi.list();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      } catch {
        showFeedback({ title: '加载班级列表失败', tone: 'error' });
      }
    })();
  }, []);

  // Load leave requests when selected class changes
  const loadLeaves = useCallback(async () => {
    if (selectedClassId === null) return;
    setLoading(true);
    try {
      const data = await leaveApi.list(selectedClassId);
      setLeaves(data.map((item) => mapLeave(item, classes)));
    } catch {
      showFeedback({ title: '加载请假列表失败', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, classes]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const pendingLeaves = leaves.filter((item) => item.status === 'pending');
  const processedLeaves = leaves.filter((item) => item.status !== 'pending');
  const approvedCount = processedLeaves.filter((item) => item.status === 'approved').length;
  const rejectedCount = processedLeaves.filter((item) => item.status === 'rejected').length;
  const pendingCount = pendingLeaves.length;
  const weeklyTotal = leaves.length;
  const pendingDays = useMemo(() => pendingLeaves.reduce((sum, item) => sum + item.days, 0), [pendingLeaves]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

  const handleApprove = (leave: MappedLeave) => {
    Alert.alert(
      '确认批准',
      `确定批准 ${leave.studentName} 的请假申请吗？\n${leave.startDate} - ${leave.endDate} · 共 ${leave.days} 天`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '批准',
          onPress: async () => {
            try {
              await leaveApi.approve(leave._apiId);
              showFeedback({ title: '已批准请假申请', tone: 'success' });
              loadLeaves();
            } catch {
              showFeedback({ title: '批准操作失败', tone: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleReject = (leave: MappedLeave) => {
    Alert.alert(
      '确认拒绝',
      `确定拒绝 ${leave.studentName} 的请假申请吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '拒绝',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveApi.reject(leave._apiId);
              showFeedback({ title: '已拒绝请假申请', tone: 'success' });
              loadLeaves();
            } catch {
              showFeedback({ title: '拒绝操作失败', tone: 'error' });
            }
          },
        },
      ]
    );
  };

  const renderLeaveCard = (leave: MappedLeave, pending: boolean) => {
    const avatarColor = getAvatarColor(leave.studentName);
    const processedStatus = leave.status === 'approved'
      ? { label: '已批准', bg: colors.palette.green.bg, text: colors.palette.green.text, icon: 'checkmark-circle' as const }
      : { label: '已拒绝', bg: colors.palette.red.bg, text: colors.palette.red.text, icon: 'close-circle' as const };

    return (
      <AppCard key={leave.id} radius={18} padding="sm" style={styles.leaveCard}> 
        <View style={styles.cardHeader}>
          <View style={styles.studentBlock}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}> 
              <Text style={styles.avatarText}>{leave.studentName[0]}</Text>
            </View>
            <View>
              <Text style={[styles.studentName, { color: colors.text }]}>{leave.studentName}</Text>
              <Text style={[styles.studentMeta, { color: colors.textTertiary }]}>{leave.className} · 学号 {leave.studentId}</Text>
            </View>
          </View>
          {pending ? (
            <View style={[styles.statusChip, { backgroundColor: colors.palette.orange.bg }]}> 
              <Ionicons name="hourglass-outline" size={13} color={colors.palette.orange.text} />
              <Text style={[styles.statusChipText, { color: colors.palette.orange.text }]}>待审批</Text>
            </View>
          ) : (
            <View style={[styles.statusChip, { backgroundColor: processedStatus.bg }]}> 
              <Ionicons name={processedStatus.icon} size={13} color={processedStatus.text} />
              <Text style={[styles.statusChipText, { color: processedStatus.text }]}>{processedStatus.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: colors.surfaceSecondary }]}> 
            <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{leave.startDate} - {leave.endDate}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: colors.surfaceSecondary }]}> 
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{leave.days} 天</Text>
          </View>
        </View>

        <View style={[styles.reasonBlock, { backgroundColor: colors.surfaceSecondary }]}> 
          <Text style={[styles.reasonLabel, { color: colors.textTertiary }]}>请假原因</Text>
          <Text style={[styles.reasonValue, { color: colors.text }]}>{leave.reason}</Text>
        </View>

        <View style={[styles.footerRow, { borderTopColor: colors.divider }]}> 
          <View style={styles.parentInfo}>
            <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.parentText, { color: colors.textSecondary }]}>{leave.parentName}</Text>
            <View style={[styles.relationBadge, { backgroundColor: colors.palette.blue.bg }]}> 
              <Text style={[styles.relationBadgeText, { color: colors.palette.blue.text }]}>{leave.parentRelation}</Text>
            </View>
          </View>
          <Text style={[styles.createdAt, { color: colors.textTertiary }]}>{pending ? `申请于 ${leave.createdAt}` : `处理于 ${leave.processedAt}`}</Text>
        </View>

        {pending && (
          <View style={styles.actionRow}>
            <AppButton
              label="拒绝"
              leftIconName="close-circle"
              variant="soft"
              tone="error"
              size="md"
              onPress={() => handleReject(leave)}
              style={styles.actionButton}
            />
            <AppButton
              label="同意"
              leftIconName="checkmark-circle"
              variant="solid"
              tone="primary"
              size="md"
              onPress={() => handleApprove(leave)}
              style={styles.actionButton}
            />
          </View>
        )}
      </AppCard>
    );
  };

  const currentList = selectedTab === 'pending' ? pendingLeaves : processedLeaves;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <PrimaryHeroSection paddingBottom={10} style={styles.heroCard}>
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={handleBack}
              activeOpacity={0.78}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroPageTitle}>请假审批</Text>
            <View style={styles.heroTopSpacer} />
          </View>
          <Text style={styles.heroEyebrow}>审批中心</Text>
          <Text style={styles.heroTitle}>{selectedTab === 'pending' ? '待审批请假申请' : '已处理请假记录'}</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '全部申请', value: weeklyTotal.toString() },
              { label: '待审批', value: pendingCount.toString() },
              { label: '待批天数', value: pendingDays.toString() },
            ].map((item, index) => (
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
        </PrimaryHeroSection>

        <AppCard radius={18} padding="sm" style={styles.tabCard}>
          <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
            {(['pending', 'processed'] as const).map((tab) => {
              const selected = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, selected && { backgroundColor: colors.surface }]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Ionicons name={tab === 'pending' ? 'hourglass-outline' : 'checkmark-done-outline'} size={16} color={selected ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.tabText, { color: selected ? colors.primary : colors.textTertiary }]}>{tab === 'pending' ? '待审批' : '已处理'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        {classes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classFilterRow}>
            {classes.map((cls) => {
              const selected = selectedClassId === cls.id;
              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classFilterChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedClassId(cls.id)}
                >
                  <Text style={[styles.classFilterChipText, { color: selected ? '#FFF' : colors.textSecondary }]}>{cls.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {selectedTab === 'processed' && (
          <View style={styles.overviewRow}>
            {[
              { label: '已批准', value: approvedCount.toString(), colorKey: 'green' as const, icon: 'checkmark-circle' as const },
              { label: '已拒绝', value: rejectedCount.toString(), colorKey: 'red' as const, icon: 'close-circle' as const },
            ].map((item) => (
              <AppCard key={item.label} radius={18} padding="sm" style={styles.overviewCard}>
                <View style={[styles.overviewIcon, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                  <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                </View>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.overviewLabel, { color: colors.textTertiary }]}>{item.label}</Text>
              </AppCard>
            ))}
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : currentList.length > 0 ? (
          <View style={styles.listSection}>{currentList.map((leave) => renderLeaveCard(leave, selectedTab === 'pending'))}</View>
        ) : (
          <AppCard padding="lg" style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{selectedTab === 'pending' ? '暂无待审批申请' : '暂无已处理记录'}</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{selectedTab === 'pending' ? '家长提交的新申请会实时显示在这里' : '已处理的申请会保存在这里，方便后续查询'}</Text>
          </AppCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 14, zIndex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 0, paddingBottom: 24 },
  heroCard: {
    marginHorizontal: -14,
    marginBottom: 12,
  },
  heroTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroBackButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroTopSpacer: { width: 34, height: 34 },
  heroPageTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', marginTop: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4 },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  tabCard: { marginBottom: 12 },
  tabInner: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '700' },
  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  overviewCard: { flex: 1, alignItems: 'center' },
  overviewIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  overviewLabel: { fontSize: 11, marginTop: 3 },
  listSection: { gap: 10 },
  leaveCard: { padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  studentBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  studentName: { fontSize: 16, fontWeight: '700' },
  studentMeta: { fontSize: 12, marginTop: 4 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  metaChipText: { fontSize: 12, fontWeight: '500' },
  reasonBlock: { borderRadius: 16, padding: 12, marginTop: 12 },
  reasonLabel: { fontSize: 12, fontWeight: '600' },
  reasonValue: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  footerRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  parentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  parentText: { fontSize: 12, fontWeight: '600' },
  relationBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  relationBadgeText: { fontSize: 11, fontWeight: '700' },
  createdAt: { fontSize: 12, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  classFilterRow: { gap: 8, marginBottom: 12 },
  classFilterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  classFilterChipText: { fontSize: 13, fontWeight: '600' },
});

import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

interface LeaveRequest {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  parentName: string;
  parentRelation: string;
  status: LeaveStatus;
  createdAt: string;
  processedAt?: string;
}

const mockLeaves: LeaveRequest[] = [
  { id: '1', studentName: '张小明', studentId: '20230101', className: '三年级1班', startDate: '3月24日', endDate: '3月25日', days: 2, reason: '家中有事需要回老家，请假两天。', parentName: '张伟', parentRelation: '父亲', status: 'pending', createdAt: '2026-03-22 09:30' },
  { id: '2', studentName: '赵小燕', studentId: '20230104', className: '三年级2班', startDate: '3月25日', endDate: '3月25日', days: 1, reason: '需要去医院做复查。', parentName: '赵丽', parentRelation: '母亲', status: 'pending', createdAt: '2026-03-22 08:15' },
  { id: '3', studentName: '李小红', studentId: '20230102', className: '三年级2班', startDate: '3月18日', endDate: '3月19日', days: 2, reason: '发烧感冒，需要在家休息。', parentName: '李芳', parentRelation: '母亲', status: 'approved', createdAt: '2026-03-17 20:00', processedAt: '2026-03-17 21:15' },
  { id: '4', studentName: '王大力', studentId: '20230103', className: '三年级1班', startDate: '3月15日', endDate: '3月15日', days: 1, reason: '参加校外比赛。', parentName: '王强', parentRelation: '父亲', status: 'approved', createdAt: '2026-03-14 18:30', processedAt: '2026-03-14 19:00' },
  { id: '5', studentName: '刘天宇', studentId: '20230105', className: '三年级1班', startDate: '3月10日', endDate: '3月10日', days: 1, reason: '请假理由不充分。', parentName: '刘明', parentRelation: '父亲', status: 'rejected', createdAt: '2026-03-09 22:00', processedAt: '2026-03-10 07:30' },
];

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
  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaves);

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

  const handleApprove = (leave: LeaveRequest) => {
    Alert.alert(
      '确认批准',
      `确定批准 ${leave.studentName} 的请假申请吗？\n${leave.startDate} - ${leave.endDate} · 共 ${leave.days} 天`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '批准',
          onPress: () => {
            const now = new Date();
            const processedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setLeaves((prev) => prev.map((item) => (item.id === leave.id ? { ...item, status: 'approved', processedAt } : item)));
          },
        },
      ]
    );
  };

  const handleReject = (leave: LeaveRequest) => {
    Alert.alert(
      '确认拒绝',
      `确定拒绝 ${leave.studentName} 的请假申请吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '拒绝',
          style: 'destructive',
          onPress: () => {
            const now = new Date();
            const processedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setLeaves((prev) => prev.map((item) => (item.id === leave.id ? { ...item, status: 'rejected', processedAt } : item)));
          },
        },
      ]
    );
  };

  const renderLeaveCard = (leave: LeaveRequest, pending: boolean) => {
    const avatarColor = getAvatarColor(leave.studentName);
    const processedStatus = leave.status === 'approved'
      ? { label: '已批准', bg: colors.palette.green.bg, text: colors.palette.green.text, icon: 'checkmark-circle' as const }
      : { label: '已拒绝', bg: colors.palette.red.bg, text: colors.palette.red.text, icon: 'close-circle' as const };

    return (
      <View key={leave.id} style={[styles.leaveCard, { backgroundColor: colors.surface }]}> 
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
            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: colors.palette.red.bg }]}
              activeOpacity={0.75}
              onPress={() => handleReject(leave)}
            >
              <Ionicons name="close-circle" size={16} color={colors.palette.red.text} />
              <Text style={[styles.rejectButtonText, { color: colors.palette.red.text }]}>拒绝</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.82}
              onPress={() => handleApprove(leave)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <Text style={styles.approveButtonText}>同意</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const currentList = selectedTab === 'pending' ? pendingLeaves : processedLeaves;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
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
          <Text style={styles.heroSubtitle}>及时查看并处理家长提交的请假申请</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '本周申请', value: weeklyTotal.toString() },
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
        </View>

        <View style={[styles.tabCard, { backgroundColor: colors.surface }]}>
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
        </View>

        {selectedTab === 'processed' && (
          <View style={styles.overviewRow}>
            {[
              { label: '已批准', value: approvedCount.toString(), colorKey: 'green' as const, icon: 'checkmark-circle' as const },
              { label: '已拒绝', value: rejectedCount.toString(), colorKey: 'red' as const, icon: 'close-circle' as const },
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
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {currentList.length > 0 ? (
          <View style={styles.listSection}>{currentList.map((leave) => renderLeaveCard(leave, selectedTab === 'pending'))}</View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}> 
            <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{selectedTab === 'pending' ? '暂无待审批申请' : '暂无已处理记录'}</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{selectedTab === 'pending' ? '家长提交的新申请会实时显示在这里' : '已处理的申请会保存在这里，方便后续查询'}</Text>
          </View>
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
    marginHorizontal: -20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    overflow: 'hidden',
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
  heroDecorLarge: { position: 'absolute', width: 128, height: 128, borderRadius: 64, top: -32, right: -12 },
  heroDecorSmall: { position: 'absolute', width: 76, height: 76, borderRadius: 38, bottom: -20, right: 26 },
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 11, lineHeight: 16, marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', marginTop: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4 },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  tabCard: { borderRadius: 18, padding: 10, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  tabInner: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '700' },
  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  overviewCard: { flex: 1, borderRadius: 18, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  overviewIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  overviewLabel: { fontSize: 11, marginTop: 3 },
  listSection: { gap: 10 },
  leaveCard: { borderRadius: 18, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
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
  rejectButton: { flex: 1, height: 42, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  rejectButtonText: { fontSize: 14, fontWeight: '700' },
  approveButton: { flex: 1, height: 42, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  approveButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
});

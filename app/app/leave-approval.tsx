import { useState } from 'react';
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
  { id: '1', studentName: '张小明', studentId: '20230101', className: '三年级1班', startDate: '3月24日', endDate: '3月25日', days: 2, reason: '家中有事需要回老家，请假两天', parentName: '张伟', parentRelation: '父亲', status: 'pending', createdAt: '2026-03-22 09:30' },
  { id: '2', studentName: '赵小燕', studentId: '20230104', className: '三年级2班', startDate: '3月25日', endDate: '3月25日', days: 1, reason: '需要去医院做体检复查', parentName: '赵丽', parentRelation: '母亲', status: 'pending', createdAt: '2026-03-22 08:15' },
  { id: '3', studentName: '李小红', studentId: '20230102', className: '三年级1班', startDate: '3月18日', endDate: '3月19日', days: 2, reason: '发烧感冒，需要在家休息', parentName: '李芳', parentRelation: '母亲', status: 'approved', createdAt: '2026-03-17 20:00', processedAt: '2026-03-17 21:15' },
  { id: '4', studentName: '王大力', studentId: '20230103', className: '三年级1班', startDate: '3月15日', endDate: '3月15日', days: 1, reason: '参加校外比赛', parentName: '王强', parentRelation: '父亲', status: 'approved', createdAt: '2026-03-14 18:30', processedAt: '2026-03-14 19:00' },
  { id: '5', studentName: '刘天宝', studentId: '20230105', className: '三年级2班', startDate: '3月10日', endDate: '3月10日', days: 1, reason: '无正当理由请假', parentName: '刘明', parentRelation: '父亲', status: 'rejected', createdAt: '2026-03-09 22:00', processedAt: '2026-03-10 07:30' },
];

const avatarColors = ['#4CC590', '#3B82F6', '#F59E0B', '#EC4899', '#7C3AED', '#0891B2'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function LeaveApprovalScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processed'>('pending');
  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaves);

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const processedLeaves = leaves.filter((l) => l.status !== 'pending');
  const pendingCount = pendingLeaves.length;

  const handleApprove = (leave: LeaveRequest) => {
    Alert.alert(
      '确认批准',
      `确定批准 ${leave.studentName} 的请假申请吗？\n请假时间：${leave.startDate} - ${leave.endDate}，共${leave.days}天`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '批准',
          onPress: () => {
            const now = new Date();
            const processedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setLeaves((prev) =>
              prev.map((l) =>
                l.id === leave.id ? { ...l, status: 'approved' as LeaveStatus, processedAt } : l
              )
            );
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
            setLeaves((prev) =>
              prev.map((l) =>
                l.id === leave.id ? { ...l, status: 'rejected' as LeaveStatus, processedAt } : l
              )
            );
          },
        },
      ]
    );
  };

  const renderLeaveCard = (leave: LeaveRequest, isPending: boolean) => {
    const avatarColor = getAvatarColor(leave.studentName);
    const initial = leave.studentName.charAt(0);

    return (
      <View
        key={leave.id}
        style={[
          styles.leaveCard,
          { backgroundColor: colors.surface },
          !isPending && { opacity: 0.88 },
        ]}
      >
        {/* 顶部：学生信息 + 状态 */}
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={[styles.studentName, { color: colors.text }]}>{leave.studentName}</Text>
              <Text style={[styles.className, { color: colors.textTertiary }]}>{leave.className}</Text>
            </View>
          </View>
          {!isPending && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: leave.status === 'approved'
                    ? colors.palette.green.bg
                    : colors.palette.red.bg,
                },
              ]}
            >
              <Ionicons
                name={leave.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
                size={13}
                color={leave.status === 'approved' ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: leave.status === 'approved'
                      ? colors.palette.green.text
                      : colors.palette.red.text,
                  },
                ]}
              >
                {leave.status === 'approved' ? '已批准' : '已拒绝'}
              </Text>
            </View>
          )}
        </View>

        {/* 详情行 */}
        <View style={[styles.detailSection, { borderTopColor: colors.divider }]}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textTertiary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>请假时间</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {leave.startDate} - {leave.endDate}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={15} color={colors.textTertiary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>请假天数</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>共{leave.days}天</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-outline" size={15} color={colors.textTertiary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>请假原因</Text>
            <Text style={[styles.detailValue, { color: colors.text, flex: 1 }]} numberOfLines={2}>
              {leave.reason}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={15} color={colors.textTertiary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>申请人</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{leave.parentName}</Text>
            <View style={[styles.relationBadge, { backgroundColor: colors.palette.blue.bg }]}>
              <Text style={[styles.relationText, { color: colors.palette.blue.text }]}>
                {leave.parentRelation}
              </Text>
            </View>
          </View>
        </View>

        {/* 底部操作区 / 处理时间 */}
        {isPending ? (
          <View style={[styles.actionRow, { borderTopColor: colors.divider }]}>
            <TouchableOpacity
              style={[styles.rejectBtn, { borderColor: colors.error }]}
              activeOpacity={0.7}
              onPress={() => handleReject(leave)}
            >
              <Ionicons name="close-circle" size={16} color={colors.error} />
              <Text style={[styles.rejectBtnText, { color: colors.error }]}>拒绝</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: colors.success }]}
              activeOpacity={0.7}
              onPress={() => handleApprove(leave)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <Text style={styles.approveBtnText}>同意</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.processedFooter, { borderTopColor: colors.divider }]}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.processedTime, { color: colors.textTertiary }]}>
              处理时间: {leave.processedAt}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <Text style={[styles.navTitle, { color: colors.text }]}>请假审批</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab 切换 */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['pending', 'processed'] as const).map((tab) => (
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
                name={tab === 'pending' ? 'hourglass' : 'checkmark-done'}
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
                {tab === 'pending' ? '待审批' : '已处理'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 内容 */}
      {selectedTab === 'pending' ? (
        pendingLeaves.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              暂无待审批的请假申请
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.listSection}>
              {pendingLeaves.map((leave) => renderLeaveCard(leave, true))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )
      ) : (
        processedLeaves.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              暂无已处理的请假记录
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.listSection}>
              {processedLeaves.map((leave) => renderLeaveCard(leave, false))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )
      )}
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
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pendingBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Tab
  tabBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabInner: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 13,
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 14,
  },

  // List
  listSection: {
    paddingHorizontal: 20,
    marginTop: 6,
    gap: 14,
  },

  // Card
  leaveCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  className: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Detail
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    width: 60,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  relationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  relationText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Action
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 0.5,
  },
  rejectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  approveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  // Processed footer
  processedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  processedTime: {
    fontSize: 12,
  },
});

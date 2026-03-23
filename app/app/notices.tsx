import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

type NoticeType = 'normal' | 'holiday' | 'activity' | 'urgent';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  className: string;
  date: string;
  readCount: number;
  totalCount: number;
}

const typeConfig: Record<NoticeType, { label: string; color: string; bg: string; icon: string }> = {
  normal: { label: '普通通知', color: '#3B82F6', bg: '#EFF6FF', icon: 'information-circle' },
  holiday: { label: '放假通知', color: '#22C55E', bg: '#F0FDF4', icon: 'sunny' },
  activity: { label: '活动通知', color: '#8B5CF6', bg: '#F5F3FF', icon: 'flag' },
  urgent: { label: '紧急通知', color: '#EF4444', bg: '#FEF2F2', icon: 'warning' },
};

const mockNotices: Notice[] = [
  { id: '1', title: '关于五一劳动节放假通知', content: '根据学校安排，五一劳动节放假时间为5月1日至5月5日，共5天。5月6日（周二）正常上课。请各位家长注意假期安全，合理安排孩子学习和生活。', type: 'holiday', className: '全部班级', date: '2026-03-20', readCount: 78, totalCount: 86 },
  { id: '2', title: '第八周课堂表现通报', content: '本周各班课堂纪律总体良好，三年级2班在数学课上表现优异，获得"纪律标兵班"称号。希望同学们继续保持。', type: 'normal', className: '三年级2班', date: '2026-03-19', readCount: 35, totalCount: 43 },
  { id: '3', title: '校园春季运动会报名通知', content: '学校定于4月中旬举办春季运动会，请各班班主任组织学生报名。每班每个项目限报3人，接力赛每班1队。报名截止日期为3月28日。', type: 'activity', className: '全部班级', date: '2026-03-18', readCount: 56, totalCount: 86 },
  { id: '4', title: '紧急：明天上午临时停课通知', content: '因教学楼消防检查，明天（3月17日）上午1-3节课临时停课，下午正常上课。请各位家长及时安排。', type: 'urgent', className: '全部班级', date: '2026-03-16', readCount: 82, totalCount: 86 },
];

type FilterType = 'all' | NoticeType;

const filterOptions: { key: FilterType; label: string; color: string; icon: string }[] = [
  { key: 'all', label: '全部', color: '#4CC590', icon: 'apps' },
  { key: 'normal', label: '普通通知', color: '#3B82F6', icon: 'information-circle' },
  { key: 'holiday', label: '放假通知', color: '#22C55E', icon: 'sunny' },
  { key: 'activity', label: '活动通知', color: '#8B5CF6', icon: 'flag' },
  { key: 'urgent', label: '紧急通知', color: '#EF4444', icon: 'warning' },
];

export default function NoticesScreen() {
  const colors = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    type: 'normal' as NoticeType,
    className: '全部班级',
  });

  const filteredNotices = selectedFilter === 'all'
    ? mockNotices
    : mockNotices.filter((n) => n.type === selectedFilter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>通知公告</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 类型筛选 */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterChip,
                  { backgroundColor: isSelected ? opt.color : colors.surfaceSecondary },
                ]}
                onPress={() => setSelectedFilter(opt.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={14}
                  color={isSelected ? '#FFF' : opt.color}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFF' : opt.color },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 通知列表 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.listSection}>
          {filteredNotices.map((notice) => {
            const config = typeConfig[notice.type];
            return (
              <View key={notice.id} style={[styles.noticeCard, { backgroundColor: colors.surface }]}>
                {/* 顶部：类型图标 + 类型标签 + 日期 */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTopLeft}>
                    <View style={[styles.typeIconCircle, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon as any} size={16} color={config.color} />
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.dateText, { color: colors.textTertiary }]}>{notice.date}</Text>
                </View>

                {/* 标题 */}
                <Text style={[styles.noticeTitle, { color: colors.text }]}>{notice.title}</Text>

                {/* 内容预览 */}
                <Text
                  style={[styles.noticeContent, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {notice.content}
                </Text>

                {/* 底部：目标班级 + 已读统计 */}
                <View style={[styles.cardBottomRow, { borderTopColor: colors.divider }]}>
                  <View style={[styles.classBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="school-outline" size={12} color={colors.textTertiary} />
                    <Text style={[styles.classBadgeText, { color: colors.textSecondary }]}>{notice.className}</Text>
                  </View>
                  <View style={styles.readStats}>
                    <Ionicons name="eye-outline" size={13} color={colors.textTertiary} />
                    <Text style={[styles.readStatsText, { color: colors.textTertiary }]}>
                      已读 {notice.readCount}/{notice.totalCount}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 发布通知浮动按钮 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* 发布通知弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>发布通知</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* 标题输入 */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知标题</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入通知标题"
                  placeholderTextColor={colors.textTertiary}
                  value={newNotice.title}
                  onChangeText={(t) => setNewNotice({ ...newNotice, title: t })}
                />
              </View>

              {/* 内容输入 */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知内容</Text>
                <TextInput
                  style={[styles.formTextarea, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                  placeholder="请输入通知内容"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={newNotice.content}
                  onChangeText={(t) => setNewNotice({ ...newNotice, content: t })}
                />
              </View>

              {/* 通知类型 */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知类型</Text>
                <View style={styles.chipRow}>
                  {(Object.keys(typeConfig) as NoticeType[]).map((type) => {
                    const config = typeConfig[type];
                    const isSelected = newNotice.type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? config.bg : colors.surfaceSecondary,
                            borderColor: isSelected ? config.color : colors.border,
                          },
                        ]}
                        onPress={() => setNewNotice({ ...newNotice, type })}
                      >
                        <Ionicons name={config.icon as any} size={13} color={isSelected ? config.color : colors.textTertiary} />
                        <Text style={[styles.chipText, { color: isSelected ? config.color : colors.textSecondary }]}>
                          {config.label.replace('通知', '')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 目标班级 */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>目标班级</Text>
                <View style={styles.chipRow}>
                  {['全部班级', '三年级1班', '三年级2班'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: newNotice.className === c ? colors.primaryLight : colors.surfaceSecondary,
                          borderColor: newNotice.className === c ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setNewNotice({ ...newNotice, className: c })}
                    >
                      <Text style={[styles.chipText, { color: newNotice.className === c ? colors.primary : colors.textSecondary }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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

  // Filter
  filterContainer: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // List
  listSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 12,
  },

  // Notice card
  noticeCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  noticeContent: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  readStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readStatsText: {
    fontSize: 12,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CC590',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    outlineStyle: 'none',
  } as any,
  formTextarea: {
    height: 120,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 14,
    borderWidth: 1,
    outlineStyle: 'none',
  } as any,
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});

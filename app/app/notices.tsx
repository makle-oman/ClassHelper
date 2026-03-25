import { useMemo, useState } from 'react';
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

const typeConfig: Record<NoticeType, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  normal: { label: '普通通知', color: '#3B82F6', bg: '#EFF6FF', icon: 'information-circle' },
  holiday: { label: '放假通知', color: '#22C55E', bg: '#F0FDF4', icon: 'sunny' },
  activity: { label: '活动通知', color: '#8B5CF6', bg: '#F5F3FF', icon: 'flag' },
  urgent: { label: '紧急通知', color: '#EF4444', bg: '#FEF2F2', icon: 'warning' },
};

const mockNotices: Notice[] = [
  { id: '1', title: '关于五一劳动节放假通知', content: '根据学校安排，五一劳动节放假时间为5月1日至5月5日，4月28日正常上课。请家长提前安排接送并关注假期安全。', type: 'holiday', className: '全部班级', date: '2026-03-20', readCount: 78, totalCount: 86 },
  { id: '2', title: '第八周课堂表现通报', content: '本周各班课堂纪律总体良好，三年级2班在数学课堂表现突出，获得本周课堂表现优秀班级。', type: 'normal', className: '三年级2班', date: '2026-03-19', readCount: 35, totalCount: 43 },
  { id: '3', title: '校园春季运动会报名通知', content: '学校定于4月中旬举办春季运动会，请各班组织学生报名。项目报名将于3月28日截止，请尽快确认。', type: 'activity', className: '全部班级', date: '2026-03-18', readCount: 56, totalCount: 86 },
  { id: '4', title: '紧急：明天上午临时停课通知', content: '因教学楼消防检查，明天上午1-3节课临时停课，下午正常上课。请家长及时知悉并做好时间安排。', type: 'urgent', className: '全部班级', date: '2026-03-16', readCount: 82, totalCount: 86 },
];

type FilterType = 'all' | NoticeType;

const filterOptions: { key: FilterType; label: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: '全部', color: '#4CC590', icon: 'apps' },
  { key: 'normal', label: '普通', color: '#3B82F6', icon: 'information-circle' },
  { key: 'holiday', label: '放假', color: '#22C55E', icon: 'sunny' },
  { key: 'activity', label: '活动', color: '#8B5CF6', icon: 'flag' },
  { key: 'urgent', label: '紧急', color: '#EF4444', icon: 'warning' },
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

  const filteredNotices = selectedFilter === 'all' ? mockNotices : mockNotices.filter((item) => item.type === selectedFilter);
  const urgentCount = mockNotices.filter((item) => item.type === 'urgent').length;
  const weeklyCount = mockNotices.length;
  const averageReadRate = useMemo(() => {
    const rate = mockNotices.reduce((sum, item) => sum + item.readCount / item.totalCount, 0) / mockNotices.length;
    return `${Math.round(rate * 100)}%`;
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

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
            <Text style={styles.heroPageTitle}>通知公告</Text>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.78}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEyebrow}>通知总览</Text>
          <Text style={styles.heroTitle}>{selectedFilter === 'all' ? '本周通知中心' : `${filterOptions.find((item) => item.key === selectedFilter)?.label}通知`}</Text>
          <Text style={styles.heroSubtitle}>管理各类通知，查看家长阅读进度</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '本周通知', value: weeklyCount.toString() },
              { label: '紧急通知', value: urgentCount.toString() },
              { label: '平均已读', value: averageReadRate },
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

        <View style={[styles.filterCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>通知筛选</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>快速切换通知类型</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filterOptions.map((option) => {
              const selected = selectedFilter === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected ? option.color : colors.surfaceSecondary,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedFilter(option.key)}
                >
                  <Ionicons name={option.icon} size={14} color={selected ? '#FFF' : option.color} />
                  <Text style={[styles.filterChipText, { color: selected ? '#FFF' : option.color }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>通知列表</Text>
            <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>查看通知详情、类型和家长阅读情况</Text>
          </View>
          <TouchableOpacity
            style={[styles.publishButton, { backgroundColor: colors.primaryLight }]}
            activeOpacity={0.75}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.publishButtonText, { color: colors.primary }]}>发布通知</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredNotices.length > 0 ? (
          <View style={styles.listSection}>
            {filteredNotices.map((notice) => {
              const config = typeConfig[notice.type];
              const readRate = Math.round((notice.readCount / notice.totalCount) * 100);

              return (
                <View key={notice.id} style={[styles.noticeCard, { backgroundColor: colors.surface }]}> 
                  <View style={styles.noticeHeader}>
                    <View style={styles.noticeHeaderLeft}>
                      <View style={[styles.noticeIcon, { backgroundColor: config.bg }]}> 
                        <Ionicons name={config.icon} size={16} color={config.color} />
                      </View>
                      <View style={[styles.noticeTypeBadge, { backgroundColor: config.bg }]}> 
                        <Text style={[styles.noticeTypeBadgeText, { color: config.color }]}>{config.label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.noticeDate, { color: colors.textTertiary }]}>{notice.date}</Text>
                  </View>

                  <Text style={[styles.noticeTitle, { color: colors.text }]}>{notice.title}</Text>
                  <Text style={[styles.noticeContent, { color: colors.textSecondary }]} numberOfLines={3}>{notice.content}</Text>

                  <View style={styles.noticeMetaRow}>
                    <View style={[styles.noticeMetaChip, { backgroundColor: colors.surfaceSecondary }]}> 
                      <Ionicons name="school-outline" size={12} color={colors.textTertiary} />
                      <Text style={[styles.noticeMetaChipText, { color: colors.textSecondary }]}>{notice.className}</Text>
                    </View>
                    <View style={[styles.noticeMetaChip, { backgroundColor: colors.surfaceSecondary }]}> 
                      <Ionicons name="eye-outline" size={12} color={colors.textTertiary} />
                      <Text style={[styles.noticeMetaChipText, { color: colors.textSecondary }]}>{notice.readCount}/{notice.totalCount} 已读</Text>
                    </View>
                  </View>

                  <View style={[styles.progressBlock, { borderTopColor: colors.divider }]}> 
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>阅读进度</Text>
                      <Text style={[styles.progressValue, { color: colors.primary }]}>{readRate}%</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}> 
                      <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${readRate}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}> 
            <Ionicons name="documents-outline" size={30} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>当前筛选下暂无通知</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>可以切换筛选类型，或点击右下角继续发布新的通知公告。</Text>
          </View>
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>发布通知</Text>
                <Text style={[styles.modalHint, { color: colors.textTertiary }]}>编辑通知内容并发送给家长</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知标题</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="请输入通知标题"
                  placeholderTextColor={colors.textTertiary}
                  value={newNotice.title}
                  onChangeText={(value) => setNewNotice((prev) => ({ ...prev, title: value }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知内容</Text>
                <TextInput
                  style={[styles.formTextArea, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="请输入通知内容"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  value={newNotice.content}
                  onChangeText={(value) => setNewNotice((prev) => ({ ...prev, content: value }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知类型</Text>
                <View style={styles.chipWrap}>
                  {(Object.keys(typeConfig) as NoticeType[]).map((type) => {
                    const config = typeConfig[type];
                    const selected = newNotice.type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: selected ? config.bg : colors.surfaceSecondary,
                            borderColor: selected ? config.color : colors.border,
                          },
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setNewNotice((prev) => ({ ...prev, type }))}
                      >
                        <Ionicons name={config.icon} size={13} color={selected ? config.color : colors.textTertiary} />
                        <Text style={[styles.optionChipText, { color: selected ? config.color : colors.textSecondary }]}>{config.label.replace('通知', '')}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>目标班级</Text>
                <View style={styles.chipWrap}>
                  {['全部班级', '三年级1班', '三年级2班'].map((className) => {
                    const selected = newNotice.className === className;
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
                        onPress={() => setNewNotice((prev) => ({ ...prev, className }))}
                      >
                        <Text style={[styles.optionChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{className}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
                <Text style={styles.modalConfirmText}>发布通知</Text>
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
  topSection: { paddingHorizontal: 20, zIndex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 96 },
  heroCard: {
    marginHorizontal: -20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
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
  heroActionButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
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
  filterCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12, marginTop: 4 },
  filterRow: { gap: 8, paddingTop: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  publishButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  publishButtonText: { fontSize: 13, fontWeight: '700' },
  listSection: { gap: 10 },
  noticeCard: {
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  noticeTypeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  noticeTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  noticeDate: { fontSize: 12 },
  noticeTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  noticeContent: { fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  noticeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  noticeMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  noticeMetaChipText: { fontSize: 12, fontWeight: '500' },
  progressBlock: { marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 999 },
  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#4CC590', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHint: { fontSize: 12, marginTop: 4 },
  modalBody: { paddingHorizontal: 20, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  formInput: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  formTextArea: { height: 110, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, fontSize: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  optionChipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  modalCancelButton: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalConfirmButton: { flex: 1.35, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { PrimaryHeroSection, AppCard, AppChip, AppSectionHeader } from '../src/components/ui';
import { classApi, noticeApi } from '../src/services/api';
import type { ClassInfo } from '../src/services/api/class';
import type { NoticeInfo } from '../src/services/api/notice';
import { showFeedback } from '../src/services/feedback';

type NoticeType = 'normal' | 'holiday' | 'activity' | 'urgent';

const typeConfig: Record<NoticeType, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  normal: { label: '普通通知', color: '#3B82F6', bg: '#EFF6FF', icon: 'information-circle' },
  holiday: { label: '放假通知', color: '#22C55E', bg: '#F0FDF4', icon: 'sunny' },
  activity: { label: '活动通知', color: '#8B5CF6', bg: '#F5F3FF', icon: 'flag' },
  urgent: { label: '紧急通知', color: '#EF4444', bg: '#FEF2F2', icon: 'warning' },
};

/** Backend type string <-> frontend key */
const backendTypeToFrontend: Record<string, NoticeType> = {
  '普通通知': 'normal',
  '放假通知': 'holiday',
  '活动通知': 'activity',
  '紧急通知': 'urgent',
};

const frontendTypeToBackend: Record<NoticeType, string> = {
  normal: '普通通知',
  holiday: '放假通知',
  activity: '活动通知',
  urgent: '紧急通知',
};

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
    selectedClassId: null as number | null,
  });

  // API data state
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [notices, setNotices] = useState<NoticeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingNotice, setViewingNotice] = useState<(NoticeInfo & { frontendType: NoticeType }) | null>(null);
  const [editingNotice, setEditingNotice] = useState<{ id: number; title: string; content: string; type: NoticeType } | null>(null);

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

  // Load notices when selected class changes
  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await noticeApi.list(selectedClassId ?? undefined);
      setNotices(data);
    } catch {
      showFeedback({ title: '加载通知列表失败', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Map backend notices to frontend view data
  const mappedNotices = useMemo(() => notices.map((n) => ({
    ...n,
    frontendType: backendTypeToFrontend[n.type] ?? ('normal' as NoticeType),
  })), [notices]);

  const filteredNotices = selectedFilter === 'all' ? mappedNotices : mappedNotices.filter((item) => item.frontendType === selectedFilter);
  const urgentCount = mappedNotices.filter((item) => item.frontendType === 'urgent').length;
  const weeklyCount = mappedNotices.length;
  const averageReadRate = '—';

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
        <PrimaryHeroSection paddingBottom={10} style={styles.heroCard}>
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
        </PrimaryHeroSection>

        <AppCard radius={18} padding="sm" style={styles.filterCardSpacing}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>通知筛选</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>快速切换通知类型</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filterOptions.map((option) => {
              const selected = selectedFilter === option.key;
              return (
                <AppChip
                  key={option.key}
                  iconName={option.icon}
                  label={option.label}
                  selected={selected}
                  onPress={() => setSelectedFilter(option.key)}
                  style={selected ? { backgroundColor: option.color, borderColor: option.color } : undefined}
                  textStyle={selected ? { color: '#FFF' } : { color: option.color }}
                />
              );
            })}
          </ScrollView>
        </AppCard>

        <AppSectionHeader
          title="通知列表"
          actionLabel="发布通知"
          onActionPress={() => setShowCreateModal(true)}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotices.length > 0 ? (
          <View style={styles.listSection}>
            {filteredNotices.map((notice) => {
              const config = typeConfig[notice.frontendType];
              const dateStr = notice.created_at ? notice.created_at.slice(0, 10) : '';
              const className = classes.find((c) => c.id === notice.class_id)?.name ?? '全部班级';

              return (
                <TouchableOpacity key={notice.id} activeOpacity={0.75} onPress={() => setViewingNotice(notice)}>
                <AppCard radius={18} padding="sm">
                  <View style={styles.noticeHeader}>
                    <View style={styles.noticeHeaderLeft}>
                      <View style={[styles.noticeIcon, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={16} color={config.color} />
                      </View>
                      <View style={[styles.noticeTypeBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.noticeTypeBadgeText, { color: config.color }]}>{config.label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.noticeDate, { color: colors.textTertiary }]}>{dateStr}</Text>
                  </View>

                  <Text style={[styles.noticeTitle, { color: colors.text }]}>{notice.title}</Text>
                  <Text style={[styles.noticeContent, { color: colors.textSecondary }]} numberOfLines={3}>{notice.content}</Text>

                  <View style={styles.noticeMetaRow}>
                    <View style={[styles.noticeMetaChip, { backgroundColor: colors.surfaceSecondary }]}>
                      <Ionicons name="school-outline" size={12} color={colors.textTertiary} />
                      <Text style={[styles.noticeMetaChipText, { color: colors.textSecondary }]}>{className}</Text>
                    </View>
                  </View>
                </AppCard>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <AppCard radius={20} padding="lg" style={styles.emptyCardContent}>
            <Ionicons name="documents-outline" size={30} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>当前筛选下暂无通知</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>可以切换筛选类型，或点击右下角继续发布新的通知公告。</Text>
          </AppCard>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.82}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* 通知详情弹窗 */}
      <Modal visible={!!viewingNotice} transparent animationType="fade" onRequestClose={() => setViewingNotice(null)}>
        <View style={styles.modalOverlay}>
          <AppCard radius={24} padding="none">
            {viewingNotice && (() => {
              const config = typeConfig[viewingNotice.frontendType];
              const dateStr = viewingNotice.created_at ? viewingNotice.created_at.slice(0, 10) : '';
              const className = classes.find((c) => c.id === viewingNotice.class_id)?.name ?? '全部班级';
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.noticeIcon, { backgroundColor: config.bg }]}>
                          <Ionicons name={config.icon} size={16} color={config.color} />
                        </View>
                        <View style={[styles.noticeTypeBadge, { backgroundColor: config.bg }]}>
                          <Text style={[styles.noticeTypeBadgeText, { color: config.color }]}>{config.label}</Text>
                        </View>
                      </View>
                      <Text style={[styles.noticeTitle, { color: colors.text, marginTop: 12 }]}>{viewingNotice.title}</Text>
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{className}</Text>
                        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{dateStr}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setViewingNotice(null)}>
                      <Ionicons name="close" size={22} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalBody}>
                    <ScrollView style={{ maxHeight: 300 }}>
                      <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>{viewingNotice.content}</Text>
                    </ScrollView>
                  </View>
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.modalCancelButton, { borderColor: colors.error }]}
                      activeOpacity={0.75}
                      onPress={async () => {
                        try {
                          await noticeApi.remove(viewingNotice.id);
                          showFeedback({ title: '通知已删除', tone: 'success' });
                          setViewingNotice(null);
                          loadNotices();
                        } catch {
                          showFeedback({ title: '删除失败', tone: 'error' });
                        }
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.error }}>删除</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                      activeOpacity={0.82}
                      onPress={() => {
                        setEditingNotice({
                          id: viewingNotice.id,
                          title: viewingNotice.title,
                          content: viewingNotice.content,
                          type: viewingNotice.frontendType,
                        });
                        setViewingNotice(null);
                      }}
                    >
                      <Text style={styles.modalConfirmText}>编辑</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </AppCard>
        </View>
      </Modal>

      {/* 编辑通知弹窗 */}
      <Modal visible={!!editingNotice} transparent animationType="fade" onRequestClose={() => setEditingNotice(null)}>
        <View style={styles.modalOverlay}>
          <AppCard radius={24} padding="none">
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>编辑通知</Text>
                <Text style={[styles.modalHint, { color: colors.textTertiary }]}>修改通知内容后保存</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingNotice(null)}>
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
                  value={editingNotice?.title ?? ''}
                  onChangeText={(value) => setEditingNotice((prev) => prev ? { ...prev, title: value } : prev)}
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
                  value={editingNotice?.content ?? ''}
                  onChangeText={(value) => setEditingNotice((prev) => prev ? { ...prev, content: value } : prev)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>通知类型</Text>
                <View style={styles.chipWrap}>
                  {(Object.keys(typeConfig) as NoticeType[]).map((type) => {
                    const config = typeConfig[type];
                    const selected = editingNotice?.type === type;
                    return (
                      <AppChip
                        key={type}
                        iconName={config.icon}
                        label={config.label.replace('通知', '')}
                        selected={selected}
                        onPress={() => setEditingNotice((prev) => prev ? { ...prev, type } : prev)}
                        style={selected ? { backgroundColor: config.bg, borderColor: config.color } : undefined}
                        textStyle={{ color: selected ? config.color : colors.textSecondary }}
                      />
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                activeOpacity={0.75}
                onPress={() => setEditingNotice(null)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.82}
                onPress={async () => {
                  if (!editingNotice || !editingNotice.title.trim() || !editingNotice.content.trim()) {
                    showFeedback({ title: '请填写完整信息', tone: 'warning' });
                    return;
                  }
                  try {
                    await noticeApi.update({
                      id: editingNotice.id,
                      title: editingNotice.title.trim(),
                      content: editingNotice.content.trim(),
                      type: frontendTypeToBackend[editingNotice.type],
                    });
                    showFeedback({ title: '通知更新成功', tone: 'success' });
                    setEditingNotice(null);
                    loadNotices();
                  } catch {
                    showFeedback({ title: '更新失败', tone: 'error' });
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        </View>
      </Modal>

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <AppCard radius={24} padding="none">
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
                      <AppChip
                        key={type}
                        iconName={config.icon}
                        label={config.label.replace('通知', '')}
                        selected={selected}
                        onPress={() => setNewNotice((prev) => ({ ...prev, type }))}
                        style={selected ? { backgroundColor: config.bg, borderColor: config.color } : undefined}
                        textStyle={{ color: selected ? config.color : colors.textSecondary }}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>目标班级</Text>
                <View style={styles.chipWrap}>
                  {classes.map((cls) => {
                    const selected = newNotice.selectedClassId === cls.id;
                    return (
                      <AppChip
                        key={cls.id}
                        label={cls.name}
                        selected={selected}
                        onPress={() => setNewNotice((prev) => ({ ...prev, selectedClassId: cls.id }))}
                        style={selected ? { backgroundColor: colors.primaryLight, borderColor: colors.primary } : undefined}
                        textStyle={{ color: selected ? colors.primary : colors.textSecondary }}
                      />
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
                onPress={async () => {
                  const targetClassId = newNotice.selectedClassId ?? (classes.length > 0 ? classes[0].id : null);
                  if (!newNotice.title.trim() || !newNotice.content.trim() || targetClassId === null) {
                    showFeedback({ title: '请填写完整通知信息', tone: 'warning' });
                    return;
                  }
                  try {
                    await noticeApi.create({
                      title: newNotice.title.trim(),
                      content: newNotice.content.trim(),
                      type: frontendTypeToBackend[newNotice.type],
                      class_id: targetClassId,
                    });
                    showFeedback({ title: '通知发布成功', tone: 'success' });
                    setShowCreateModal(false);
                    setNewNotice({ title: '', content: '', type: 'normal', selectedClassId: null });
                    loadNotices();
                  } catch {
                    showFeedback({ title: '发布通知失败', tone: 'error' });
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>发布通知</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 14, zIndex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 0, paddingBottom: 96 },
  heroCard: {
    marginHorizontal: -14,
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
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', marginTop: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4 },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  filterCardSpacing: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12, marginTop: 4 },
  filterRow: { gap: 8, paddingTop: 10 },
  listSection: { gap: 10 },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  noticeTypeBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  noticeTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  noticeDate: { fontSize: 12 },
  noticeTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  noticeContent: { fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  noticeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  noticeMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  noticeMetaChipText: { fontSize: 12, fontWeight: '500' },
  progressBlock: { marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 999 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyCardContent: { alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#4CC590', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHint: { fontSize: 12, marginTop: 4 },
  modalBody: { paddingHorizontal: 14, paddingVertical: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  formInput: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  formTextArea: { height: 110, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, fontSize: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 20, paddingTop: 4 },
  modalCancelButton: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalConfirmButton: { flex: 1.35, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

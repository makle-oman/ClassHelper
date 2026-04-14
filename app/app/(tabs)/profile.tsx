import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/theme';
import { classApi, leaveApi, clearAuth, authApi, teacherApi, saveAuth, getToken, type TeacherInfo } from '../../src/services/api';
import { PrimaryHeroSection, AppCard } from '../../src/components/ui';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  subtitle?: string;
  colorKey: keyof typeof import('../../src/theme/colors').lightColors.palette;
  badge?: string;
}

const menuGroups: MenuItem[][] = [
  [
    { icon: 'school', label: '班级管理', subtitle: '查看和编辑班级', colorKey: 'blue' },
    { icon: 'book', label: '作业管理', subtitle: '布置作业、查看完成情况', colorKey: 'green' },
    { icon: 'megaphone', label: '通知公告', subtitle: '给家长发通知', colorKey: 'orange' },
    { icon: 'hand-left', label: '请假审批', subtitle: '审批学生请假申请', colorKey: 'red' },
  ],
  [
    { icon: 'settings', label: '设置', subtitle: '提醒、外观和反馈', colorKey: 'blue' },
  ],
];

export default function ProfileScreen() {
  const colors = useTheme();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);

  useFocusEffect(
    useCallback(() => {
      teacherApi.getProfile().then(async (t) => {
        setTeacher(t);
        const token = await getToken();
        if (token && t) await saveAuth(token, t);
      }).catch(() => {});
      classApi.list().then(async (classList) => {
        setClasses(classList);
        try {
          let total = 0;
          for (const cls of classList) {
            const leaves = await leaveApi.list(cls.id, '待审批');
            total += leaves.length;
          }
          setPendingLeaves(total);
        } catch {}
      }).catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <PrimaryHeroSection paddingTop={20} paddingBottom={28}>
          <View style={styles.profileContent}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{teacher?.name?.slice(0, 1) || '师'}</Text>
              </View>
              <View style={[styles.editAvatarBtn, { borderColor: colors.primary }]}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{teacher?.name || '老师'}</Text>
              <View style={styles.profileMetaRow}>
                <Ionicons name="call-outline" size={13} color="rgba(255,255,255,0.6)" />
                <Text style={styles.profilePhone}>{teacher?.phone ? teacher.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''}</Text>
              </View>
              <View style={styles.profileTags}>
                {(teacher?.subject ? [teacher.subject] : []).map((tag) => (
                  <View key={tag} style={styles.profileTag}>
                    <Text style={styles.profileTagText}>{tag}</Text>
                  </View>
                ))}
                {teacher?.teaching_years != null && (
                  <View style={styles.profileTag}>
                    <Text style={styles.profileTagText}>教龄 {teacher.teaching_years} 年</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/profile-edit')}>
              <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </PrimaryHeroSection>

        {/* 数据统计 */}
        <View style={styles.statsRow}>
          {[
            { label: '管理班级', value: classes.length.toString(), icon: 'school-outline' as IoniconsName },
            { label: '学生总数', value: classes.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0).toString(), icon: 'people-outline' as IoniconsName },
            { label: '科目', value: teacher?.subject || '--', icon: 'document-text-outline' as IoniconsName },
            { label: '学校', value: teacher?.school || '--', icon: 'ribbon-outline' as IoniconsName },
          ].map((item) => (
            <View key={item.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* 菜单列表 */}
        {menuGroups.map((group, gi) => (
          <AppCard key={gi} padding="none" radius={16} style={styles.menuGroup}>
            {group.map((item, i) => {
              const palette = colors.palette[item.colorKey];
              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.label === '设置') router.push('/settings');
                    if (item.label === '班级管理') router.push('/class-manage');
                    if (item.label === '作业管理') router.push('/homework');
                    if (item.label === '通知公告') router.push('/notices');
                    if (item.label === '请假审批') router.push('/leave-approval');
                  }}
                >
                  <View
                    style={[
                      styles.menuItem,
                      i < group.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                    ]}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: palette.bg }]}>
                      <Ionicons name={item.icon} size={20} color={palette.text} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                      {item.subtitle && (
                        <Text style={[styles.menuSubtitle, { color: colors.textTertiary }]}>{item.subtitle}</Text>
                      )}
                    </View>
                    <View style={styles.menuRight}>
                      {item.label === '请假审批' && pendingLeaves > 0 && (
                        <View style={[styles.menuBadge, { backgroundColor: colors.error }]}>
                          <Text style={styles.menuBadgeText}>{pendingLeaves}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </AppCard>
        ))}

        {/* 退出登录 */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert('退出登录', '确定要退出当前账号吗？', [
              { text: '取消', style: 'cancel' },
              {
                text: '退出',
                style: 'destructive',
                onPress: async () => {
                  try { await authApi.logout(); } catch {}
                  await clearAuth();
                  router.replace('/(auth)/login' as any);
                },
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>退出登录</Text>
        </TouchableOpacity>

        {/* 版本号 */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>ClassHelper v1.0.0</Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  profileTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  profileTag: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  profileTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  editProfileBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 10,
    marginTop: -14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  menuGroup: {
    marginHorizontal: 20,
    marginTop: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
});

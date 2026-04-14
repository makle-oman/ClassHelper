import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/theme';
import { getTeacher, classApi, courseApi, leaveApi, homeworkApi, noticeApi, type TeacherInfo } from '../../src/services/api';
import { PrimaryHeroSection } from '../../src/components/ui';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickAction {
  icon: IoniconsName;
  label: string;
  colorKey: keyof typeof import('../../src/theme/colors').lightColors.palette;
  route?: string;
}

const quickActions: QuickAction[] = [
  { icon: 'people', label: '学生管理', colorKey: 'blue', route: '/(tabs)/students' },
  { icon: 'checkbox', label: '考勤打卡', colorKey: 'green', route: '/attendance' },
  { icon: 'document-text', label: '布置作业', colorKey: 'orange', route: '/homework' },
  { icon: 'megaphone', label: '发通知', colorKey: 'red', route: '/notices' },
  { icon: 'stats-chart', label: '成绩录入', colorKey: 'purple', route: '/(tabs)/scores' },
  { icon: 'calendar', label: '课程表', colorKey: 'cyan', route: '/(tabs)/schedule' },
];

const periodTimeMap: Record<number, { label: string; time: string }> = {
  0: { label: '早读', time: '07:40 - 08:00' },
  1: { label: '第1节', time: '08:00 - 08:40' },
  2: { label: '第2节', time: '08:50 - 09:30' },
  3: { label: '第3节', time: '10:00 - 10:40' },
  4: { label: '第4节', time: '10:50 - 11:30' },
  5: { label: '午休', time: '12:00 - 14:00' },
  6: { label: '第5节', time: '14:00 - 14:40' },
  7: { label: '第6节', time: '14:50 - 15:30' },
  8: { label: '课后', time: '15:40 - 16:20' },
};

const courseColorMap: Record<string, string> = {
  '语文': '#5B9FE8',
  '数学': '#E8845B',
  '英语': '#9B6FE8',
  '体育': '#4CC590',
};

export default function HomeScreen() {
  const colors = useTheme();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [todayCourses, setTodayCourses] = useState<{ period: string; time: string; subject: string; class: string; isMine: boolean }[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [todoItems, setTodoItems] = useState<{ text: string; time: string; icon: IoniconsName; colorKey: 'orange' | 'red' | 'blue' | 'green'; urgent: boolean; route: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTeacher().then(setTeacher);
      classApi.list().then(async (classList) => {
        setClasses(classList);

        // 并行加载：今日课程 + 待办数据
        const [coursesResult, leavesResult, hwResult, noticesResult] = await Promise.allSettled([
          // 1. 今日课程（只需调用一次）
          courseApi.myToday(),
          // 2. 各班请假
          Promise.all(classList.map((cls: any) => leaveApi.list(cls.id, '待审批').catch(() => []))),
          // 3. 各班作业
          Promise.all(classList.map((cls: any) => homeworkApi.list(cls.id).catch(() => ({ list: [] })))),
          // 4. 各班通知
          Promise.all(classList.map((cls: any) => noticeApi.list(cls.id).catch(() => []))),
        ]);

        // 处理今日课程
        if (coursesResult.status === 'fulfilled') {
          setTodayCourses(coursesResult.value.map((c: any) => {
            const pm = periodTimeMap[c.period] || { label: `第${c.period}节`, time: '' };
            return {
              period: pm.label,
              time: pm.time,
              subject: c.subject,
              class: c.classEntity?.name || '',
              isMine: true,
            };
          }));
        }

        // 处理待办
        const todos: typeof todoItems = [];

        // 待审批请假
        if (leavesResult.status === 'fulfilled') {
          const total = leavesResult.value.reduce((sum: number, arr: any[]) => sum + arr.length, 0);
          setPendingLeaves(total);
          if (total > 0) {
            todos.push({ text: `${total}条请假申请待审批`, time: '待处理', icon: 'hand-left', colorKey: 'red', urgent: true, route: '/leave-approval' });
          }
        }

        // 未完成作业
        if (hwResult.status === 'fulfilled') {
          const now = new Date().toISOString().split('T')[0];
          hwResult.value.forEach((result: any, i: number) => {
            const hwList = result.list || [];
            const active = hwList.filter((hw: any) => hw.deadline >= now);
            if (active.length > 0) {
              todos.push({ text: `${classList[i].name} 有${active.length}项作业待跟进`, time: '进行中', icon: 'document-text', colorKey: 'orange', urgent: false, route: '/homework' });
            }
          });
        }

        // 最新通知
        if (noticesResult.status === 'fulfilled') {
          for (const notices of noticesResult.value) {
            if ((notices as any[]).length > 0) {
              const latest = (notices as any[])[0];
              todos.push({ text: `${latest.title}`, time: latest.created_at ? new Date(latest.created_at).toLocaleDateString() : '最近', icon: 'megaphone', colorKey: 'blue', urgent: false, route: '/notices' });
              break;
            }
          }
        }

        setTodoItems(todos);
      }).catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 顶部问候 */}
        <PrimaryHeroSection style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingText}>
                {new Date().getHours() < 12 ? '上午好 ☀️' : new Date().getHours() < 18 ? '下午好 🌤️' : '晚上好 🌙'}
              </Text>
              <Text style={styles.teacherName}>{teacher?.name || '老师'}</Text>
            </View>
            <TouchableOpacity style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{teacher?.name?.slice(0, 1) || '师'}</Text>
              </View>
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>

          {/* 数据概览 */}
          <View style={styles.statsBar}>
            {[
              { label: '管理班级', value: classes.length.toString() },
              { label: '学生总数', value: classes.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0).toString() },
              { label: '今日课程', value: `${todayCourses.length}节` },
              { label: '待审批', value: pendingLeaves > 0 ? `${pendingLeaves}条` : '无' },
            ].map((item, i) => (
              <View key={item.label} style={[styles.statItem, i < 3 && styles.statItemBorder]}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </PrimaryHeroSection>

        {/* 快捷操作 */}
        <View style={styles.section}>
          <View style={[styles.quickActionsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => {
                const palette = colors.palette[action.colorKey];
                return (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.actionItem}
                    activeOpacity={0.6}
                    onPress={() => action.route && router.push(action.route as any)}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: palette.bg }]}>
                      <Ionicons name={action.icon} size={20} color={palette.text} />
                    </View>
                    <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 今日课程 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionTitleDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>今日课程</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{todayCourses.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/schedule' as any)}>
              <Text style={[styles.seeAll, { color: colors.textTertiary }]}>查看全部</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coursesScroll}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH * 0.7 + 12}
          >
            {todayCourses.map((course, i) => {
              const color = courseColorMap[course.subject] || colors.primary;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.courseCard, { width: SCREEN_WIDTH * 0.7 }]}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/schedule' as any)}
                >
                  {/* 顶部彩色条 */}
                  <View style={[styles.courseCardTop, { backgroundColor: color }]}>
                    <View style={[styles.courseCardTopDecor, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    <View style={styles.courseCardTopContent}>
                      <View>
                        <Text style={styles.courseSubjectText}>{course.subject}</Text>
                        <Text style={styles.coursePeriodText}>{course.period}</Text>
                      </View>
                      {course.isMine && (
                        <View style={styles.myCourseBadge}>
                          <View style={styles.myCourseDot} />
                          <Text style={styles.myCourseText}>我的课</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {/* 底部信息 */}
                  <View style={[styles.courseCardBottom, { backgroundColor: colors.surface }]}>
                    <View style={styles.courseInfoRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.courseInfoText, { color: colors.textSecondary }]}>{course.time}</Text>
                    </View>
                    <View style={styles.courseInfoRow}>
                      <Ionicons name="school-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.courseInfoText, { color: colors.textSecondary }]}>{course.class}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 待办提醒 */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionTitleDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>待办提醒</Text>
              {pendingLeaves > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.error }]}>{pendingLeaves}</Text>
              </View>
              )}
            </View>
          </View>

          <View style={[styles.todoListCard, { backgroundColor: colors.surface }]}>
            {todoItems.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={32} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 8 }}>暂无待办事项</Text>
              </View>
            ) : todoItems.map((item, i, arr) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.todoItem,
                  i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                ]}
                activeOpacity={0.6}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.todoIconBox, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                  <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                </View>
                <View style={styles.todoContent}>
                  <Text style={[styles.todoText, { color: colors.text }]} numberOfLines={1}>{item.text}</Text>
                  <Text style={[styles.todoTime, { color: colors.textTertiary }]}>{item.time}</Text>
                </View>
                {item.urgent && (
                  <View style={[styles.urgentDot, { backgroundColor: colors.error }]} />
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // === Header ===
  headerSection: {
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  greetingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  teacherName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'rgba(76, 197, 144, 0.8)',
  },
  statsBar: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },

  // === Section ===
  section: {
    marginTop: 18,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 13,
  },

  // === Quick Actions ===
  quickActionsCard: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    marginTop: 8,
  },

  // === Course Cards ===
  coursesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  courseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  courseCardTop: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  courseCardTopDecor: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -20,
    right: -10,
  },
  courseCardTopContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseSubjectText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coursePeriodText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  myCourseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  myCourseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#68FFB8',
  },
  myCourseText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  courseCardBottom: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  courseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseInfoText: {
    fontSize: 13,
  },

  // === Todo ===
  todoListCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  todoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todoTime: {
    fontSize: 11,
    marginTop: 3,
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

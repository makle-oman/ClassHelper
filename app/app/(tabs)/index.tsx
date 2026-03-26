import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/theme';
import { getTeacher, classApi, type TeacherInfo } from '../../src/services/api';

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

const todayCourses = [
  { period: '第1节', time: '08:00 - 08:40', subject: '语文', class: '三年级2班', isMine: true },
  { period: '第3节', time: '10:00 - 10:40', subject: '数学', class: '三年级2班', isMine: true },
  { period: '第5节', time: '14:00 - 14:40', subject: '语文', class: '三年级1班', isMine: true },
  { period: '第7节', time: '15:40 - 16:20', subject: '体育', class: '三年级1班', isMine: false },
];

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

  useFocusEffect(
    useCallback(() => {
      getTeacher().then(setTeacher);
      classApi.list().then(setClasses).catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 顶部问候 */}
        <View style={[styles.headerSection, { backgroundColor: colors.primary }]}>
          <View style={[styles.headerDecor1, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
          <View style={[styles.headerDecor2, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
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
              { label: '今日课程', value: '4节' },
              { label: '出勤率', value: '98%' },
            ].map((item, i) => (
              <View key={item.label} style={[styles.statItem, i < 3 && styles.statItemBorder]}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

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
              <View style={[styles.countBadge, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.error }]}>3</Text>
              </View>
            </View>
          </View>

          <View style={[styles.todoListCard, { backgroundColor: colors.surface }]}>
            {[
              { text: '三年级2班 数学作业还有5人未交', time: '2小时前', icon: 'document-text' as IoniconsName, colorKey: 'orange' as const, urgent: false, route: '/homework' },
              { text: '张小明请假申请待审批（家长已提交）', time: '30分钟前', icon: 'hand-left' as IoniconsName, colorKey: 'red' as const, urgent: true, route: '/leave-approval' },
              { text: '下周一有教研活动，记得准备发言材料', time: '今天', icon: 'calendar' as IoniconsName, colorKey: 'blue' as const, urgent: false, route: '/notices' },
            ].map((item, i, arr) => (
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
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
  },
  headerDecor2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -20,
    left: -30,
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

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { PrimaryHeroSection, AppCard, AppChip, AppButton, AppSectionHeader } from '../src/components/ui';
import { classApi, attendanceApi, studentApi } from '../src/services/api';
import { showFeedback } from '../src/services/feedback';

type AttendanceStatus = 'present' | 'late' | 'early' | 'leave' | 'absent';

interface StudentAttendance {
  id: string;
  name: string;
  studentNo: string;
  gender: '男' | '女';
  status: AttendanceStatus;
}

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  present: { label: '出勤', color: '#22C55E', icon: 'checkmark-circle' },
  late: { label: '迟到', color: '#F97316', icon: 'time' },
  early: { label: '早退', color: '#F59E0B', icon: 'exit' },
  leave: { label: '请假', color: '#3B82F6', icon: 'document-text' },
  absent: { label: '缺席', color: '#EF4444', icon: 'close-circle' },
};

/** Map frontend English status to backend Chinese status */
const statusToChinese: Record<AttendanceStatus, string> = {
  present: '出勤',
  late: '迟到',
  early: '早退',
  leave: '请假',
  absent: '缺席',
};

/** Map backend Chinese status to frontend English status */
const statusToEnglish: Record<string, AttendanceStatus> = {
  '出勤': 'present',
  '迟到': 'late',
  '早退': 'early',
  '请假': 'leave',
  '缺席': 'absent',
};

interface ClassOption {
  id: number;
  name: string;
  student_count: number;
}

interface MonthlyStatItem {
  date: string;
  weekday: string;
  total: number;
  present: number;
  rate: number;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface StudentAttendanceStats {
  id: string;
  name: string;
  gender: '男' | '女';
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  rate: number;
}

/** Format a Date to YYYY-MM-DD for API calls */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS[date.getDay()];
  return `${y}年${m}月${d}日 ${w}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AttendanceScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'record' | 'stats'>('record');
  const [currentDate, setDate] = useState(new Date());
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [statsView, setStatsView] = useState<'daily' | 'student'>('daily');

  // Real data state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatItem[]>([]);
  const [studentStats, setStudentStats] = useState<StudentAttendanceStats[]>([]);
  const [classStatsData, setClassStatsData] = useState<{ attendance_rate: number; late: number; absent: number } | null>(null);

  const today = new Date();

  const selectedClass = classes.find((c) => c.id === selectedClassId)?.name ?? '';

  // Load classes on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await classApi.list();
        if (cancelled) return;
        setClasses(list.map((c) => ({ id: c.id, name: c.name, student_count: c.student_count })));
        if (list.length > 0 && selectedClassId === null) {
          setSelectedClassId(list[0].id);
        }
      } catch {
        // Error feedback is handled by request()
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load students + existing attendance when class or date changes
  useEffect(() => {
    if (selectedClassId === null) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [studentList, attendanceRecords] = await Promise.all([
          studentApi.list(selectedClassId),
          attendanceApi.list(selectedClassId, toDateString(currentDate)),
        ]);
        if (cancelled) return;

        // Build a lookup of existing attendance by student_id
        const attendanceMap = new Map<number, AttendanceStatus>();
        attendanceRecords.forEach((r) => {
          attendanceMap.set(r.student_id, statusToEnglish[r.status] ?? 'present');
        });

        // Map students to StudentAttendance, merging existing attendance data
        const mapped: StudentAttendance[] = studentList.map((s) => ({
          id: String(s.id),
          name: s.name,
          studentNo: s.student_no,
          gender: s.gender,
          status: attendanceMap.get(s.id) ?? 'present',
        }));
        setStudents(mapped);
      } catch {
        // Error feedback is handled by request()
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClassId, currentDate]);

  // Load stats when tab is 'stats' and class changes
  useEffect(() => {
    if (selectedTab !== 'stats' || selectedClassId === null) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Get current month date range for daily stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Load class stats for the month (one call per day in the month up to today)
        // We use classStats for each day in the current month
        const daysInMonth: Date[] = [];
        const endDay = now.getDate();
        for (let d = endDay; d >= 1 && daysInMonth.length < 30; d--) {
          daysInMonth.push(new Date(now.getFullYear(), now.getMonth(), d));
        }

        // Fetch class stats for each day (limit to last 7 for performance)
        const recentDays = daysInMonth.slice(0, 7);
        const dailyResults = await Promise.all(
          recentDays.map(async (day) => {
            try {
              const stats = await attendanceApi.classStats(selectedClassId, toDateString(day));
              const total = stats.student_count;
              const present = stats['出勤'] ?? 0;
              const rate = stats.attendance_rate ?? (total > 0 ? (present / total) * 100 : 0);
              const mm = String(day.getMonth() + 1).padStart(2, '0');
              const dd = String(day.getDate()).padStart(2, '0');
              return {
                date: `${mm}-${dd}`,
                weekday: WEEKDAYS[day.getDay()],
                total,
                present,
                rate: Math.round(rate * 10) / 10,
              };
            } catch {
              return null;
            }
          }),
        );
        if (cancelled) return;

        setMonthlyStats(dailyResults.filter((r): r is MonthlyStatItem => r !== null));

        // Fetch today's class stats for summary counts (late, absent, rate)
        try {
          const todayStats = await attendanceApi.classStats(selectedClassId, toDateString(now));
          if (!cancelled) {
            setClassStatsData({
              attendance_rate: todayStats.attendance_rate ?? 0,
              late: todayStats['迟到'] ?? 0,
              absent: todayStats['缺席'] ?? 0,
            });
          }
        } catch {
          // Fallback: compute average rate from daily results
          const validDays = dailyResults.filter((r): r is MonthlyStatItem => r !== null);
          if (validDays.length > 0 && !cancelled) {
            const avgRate = validDays.reduce((sum, d) => sum + d.rate, 0) / validDays.length;
            setClassStatsData({
              attendance_rate: Math.round(avgRate * 10) / 10,
              late: 0,
              absent: 0,
            });
          }
        }

        // Load per-student stats
        if (statsView === 'student') {
          await loadStudentStats(selectedClassId, monthStart, monthEnd, cancelled);
        }
      } catch {
        // Error feedback is handled by request()
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTab, selectedClassId]);

  // Load student stats when switching to student view
  useEffect(() => {
    if (selectedTab !== 'stats' || statsView !== 'student' || selectedClassId === null) return;
    let cancelled = false;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    loadStudentStats(selectedClassId, monthStart, monthEnd, cancelled);
    return () => { cancelled = true; };
  }, [statsView]);

  async function loadStudentStats(classId: number, monthStart: Date, monthEnd: Date, cancelled: boolean) {
    try {
      const studentList = await studentApi.list(classId);
      if (cancelled) return;

      const statsResults = await Promise.all(
        studentList.map(async (s) => {
          try {
            const stats = await attendanceApi.studentStats(s.id, toDateString(monthStart), toDateString(monthEnd));
            const totalDays = stats.total;
            const presentDays = stats['出勤'] ?? 0;
            const lateDays = stats['迟到'] ?? 0;
            const absentDays = stats['缺席'] ?? 0;
            const leaveDays = stats['请假'] ?? 0;
            return {
              id: String(s.id),
              name: s.name,
              gender: s.gender,
              totalDays,
              presentDays,
              lateDays,
              absentDays,
              leaveDays,
              rate: stats.attendance_rate ?? (totalDays > 0 ? (presentDays / totalDays) * 100 : 0),
            } as StudentAttendanceStats;
          } catch {
            return {
              id: String(s.id),
              name: s.name,
              gender: s.gender,
              totalDays: 0,
              presentDays: 0,
              lateDays: 0,
              absentDays: 0,
              leaveDays: 0,
              rate: 0,
            } as StudentAttendanceStats;
          }
        }),
      );
      if (!cancelled) setStudentStats(statsResults);
    } catch {
      // Error feedback is handled by request()
    }
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setDate(next);
  };

  const goToday = () => setDate(new Date());

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const abnormalCount = students.length - presentCount;
  const markedCount = students.length;
  const currentRate = students.length > 0 ? ((presentCount / students.length) * 100).toFixed(1) : '0.0';

  const handleSave = async () => {
    if (selectedClassId === null) return;
    setSaving(true);
    try {
      await attendanceApi.batchSave({
        class_id: selectedClassId,
        date: toDateString(currentDate),
        items: students.map((s) => ({
          student_id: Number(s.id),
          status: statusToChinese[s.status],
        })),
      });
      showFeedback({ title: `已保存 ${formatDate(currentDate)} 的考勤记录`, tone: 'success' });
    } catch {
      // Error feedback is handled by request()
    } finally {
      setSaving(false);
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 95) return colors.success;
    if (rate >= 90) return colors.warning;
    return colors.error;
  };

  const monthlyLate = classStatsData?.late ?? 0;
  const monthlyAbsent = classStatsData?.absent ?? 0;
  const monthlyRate = classStatsData?.attendance_rate ?? 0;
  const topStudentRate = studentStats.length > 0 ? Math.max(...studentStats.map((item) => item.rate)) : 0;
  const averageStudentRate = studentStats.length > 0
    ? (studentStats.reduce((sum, item) => sum + item.rate, 0) / studentStats.length).toFixed(1)
    : '0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <PrimaryHeroSection paddingBottom={10}>
        <View style={styles.heroTopBar}>
          <TouchableOpacity style={styles.heroBackButton} onPress={handleBack} activeOpacity={0.78}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroPageTitle}>考勤打卡</Text>
          <View style={styles.heroTopSpacer} />
        </View>
        <Text style={styles.heroEyebrow}>{selectedTab === 'record' ? '今日考勤' : '考勤统计'}</Text>
        <TouchableOpacity style={styles.classPickerBtn} activeOpacity={0.7} onPress={() => setClassPickerOpen(true)}>
          <Text style={styles.heroTitle}>{selectedClass}</Text>
          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.heroStatsRow}>
          {(selectedTab === 'record'
            ? [
                { label: '当前出勤率', value: `${currentRate}%` },
                { label: '已出勤', value: presentCount.toString() },
                { label: '异常人数', value: abnormalCount.toString() },
              ]
            : [
                { label: statsView === 'daily' ? '本月出勤率' : '班级平均', value: `${statsView === 'daily' ? monthlyRate : averageStudentRate}%` },
                { label: statsView === 'daily' ? '本月迟到' : '全勤人数', value: `${statsView === 'daily' ? monthlyLate : studentStats.filter((item) => item.rate === 100).length}` },
                { label: statsView === 'daily' ? '本月缺席' : '最高出勤率', value: `${statsView === 'daily' ? monthlyAbsent : topStudentRate}${statsView === 'daily' ? '' : '%'}` },
              ]).map((item, index) => (
            <View
              key={`${item.label}-${index}`}
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

      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['record', 'stats'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, selectedTab === tab && { backgroundColor: colors.surface }]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'record' ? 'clipboard' : 'bar-chart'}
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
                {tab === 'record' ? '考勤记录' : '考勤统计'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedTab === 'record' ? (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
            <AppCard radius={14} padding="none" style={{ marginHorizontal: 20, marginTop: 8 }}>
              <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => changeDate(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(currentDate)}</Text>
                <TouchableOpacity onPress={() => changeDate(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.todayBtn,
                    {
                      backgroundColor: isSameDay(currentDate, today) ? colors.surfaceSecondary : colors.primaryLight,
                      borderColor: isSameDay(currentDate, today) ? colors.border : colors.primary,
                    },
                  ]}
                  onPress={goToday}
                  disabled={isSameDay(currentDate, today)}
                >
                  <Text
                    style={[
                      styles.todayBtnText,
                      { color: isSameDay(currentDate, today) ? colors.textTertiary : colors.primary },
                    ]}
                  >
                    今天
                  </Text>
                </TouchableOpacity>
              </View>
            </AppCard>

            <AppChip
              iconName="school-outline"
              label={selectedClass}
              selected
              onPress={() => setClassPickerOpen(true)}
              style={styles.classPickerToolbarBtn}
            />

            <View style={styles.batchBar}>
              <AppButton
                label="全部出勤"
                leftIconName="checkmark-circle"
                tone="success"
                onPress={markAllPresent}
                fullWidth={false}
                size="md"
                style={styles.batchBtn}
                textStyle={styles.batchBtnText}
              />
              <Text style={[styles.batchSummary, { color: colors.textSecondary }]}>出勤 {presentCount} / 异常 {abnormalCount}</Text>
            </View>

            <View style={styles.listSection}>
              {loading && (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textTertiary, marginTop: 8, fontSize: 13 }}>加载中...</Text>
                </View>
              )}
              {!loading && students.length === 0 && (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 13 }}>暂无学生数据</Text>
                </View>
              )}
              {!loading && students.map((student) => (
                <AppCard key={student.id} radius={14} padding="sm">
                  <View style={styles.studentLeft}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: student.gender === '男' ? colors.infoLight : '#FDF2F8' },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: student.gender === '男' ? colors.info : '#EC4899' }]}>{student.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                      <Text style={[styles.studentNo, { color: colors.textTertiary }]}>{student.studentNo}</Text>
                    </View>
                  </View>
                  <View style={styles.statusRow}>
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map((key) => {
                      const cfg = statusConfig[key];
                      const isActive = student.status === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: isActive ? cfg.color : colors.surfaceSecondary,
                              borderColor: isActive ? cfg.color : colors.border,
                            },
                          ]}
                          onPress={() => setStatus(student.id, key)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.statusPillText, { color: isActive ? '#FFF' : colors.textTertiary }]}>{cfg.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </AppCard>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Text style={[styles.bottomInfo, { color: colors.textSecondary }]}>已标记 {markedCount}/{students.length}</Text>
            <AppButton
              label={saving ? '保存中...' : '保存考勤'}
              leftIconName="save"
              tone="success"
              onPress={handleSave}
              fullWidth={false}
              size="md"
              style={styles.saveBtn}
              disabled={saving || loading || students.length === 0}
            />
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <AppChip
            iconName="school-outline"
            label={selectedClass}
            selected
            onPress={() => setClassPickerOpen(true)}
            style={{ alignSelf: 'flex-start', marginHorizontal: 14, marginTop: 10 }}
          />

          <View style={[styles.statsSwitchWrap, { backgroundColor: colors.surface }]}>
            <View style={[styles.statsSwitchInner, { backgroundColor: colors.surfaceSecondary }]}>
              {([
                { key: 'daily', label: '按日查看', icon: 'calendar-outline' },
                { key: 'student', label: '按学生查看', icon: 'people-outline' },
              ] as const).map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.statsSwitchItem, statsView === item.key && { backgroundColor: colors.surface }]}
                  onPress={() => setStatsView(item.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={15} color={statsView === item.key ? colors.primary : colors.textTertiary} />
                  <Text
                    style={[
                      styles.statsSwitchText,
                      { color: statsView === item.key ? colors.primary : colors.textTertiary },
                      statsView === item.key && { fontWeight: '700' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.overviewRow}>
            {(statsView === 'daily'
              ? [
                  { label: '本月出勤率', value: `${monthlyRate}%`, icon: 'checkmark-circle' as const, colorKey: 'green' as const },
                  { label: '本月迟到', value: monthlyLate.toString(), icon: 'time' as const, colorKey: 'orange' as const },
                  { label: '本月缺席', value: monthlyAbsent.toString(), icon: 'close-circle' as const, colorKey: 'red' as const },
                ]
              : [
                  { label: '班级平均出勤率', value: `${averageStudentRate}%`, icon: 'stats-chart' as const, colorKey: 'green' as const },
                  { label: '全勤学生', value: studentStats.filter((item) => item.rate === 100).length.toString(), icon: 'ribbon' as const, colorKey: 'blue' as const },
                  { label: '最高出勤率', value: `${topStudentRate}%`, icon: 'trophy' as const, colorKey: 'orange' as const },
                ]).map((item) => (
              <AppCard key={item.label} radius={14} padding="sm" style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={[styles.overviewIconBox, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                  <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                </View>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.overviewLabel, { color: colors.textTertiary }]}>{item.label}</Text>
              </AppCard>
            ))}
          </View>

          {statsView === 'daily' ? (
            <View style={styles.statsSection}>
              <AppSectionHeader title="本月每日考勤" />
              <AppCard radius={14} padding="none" style={{ overflow: 'hidden' }}>
                {monthlyStats.map((item, index) => {
                  const rateColor = getRateColor(item.rate);
                  return (
                    <View
                      key={item.date}
                      style={[
                        styles.statsRow,
                        index < monthlyStats.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                      ]}
                    >
                      <View style={styles.statsDateCol}>
                        <Text style={[styles.statsDate, { color: colors.text }]}>{item.date}</Text>
                        <Text style={[styles.statsWeekday, { color: colors.textTertiary }]}>{item.weekday}</Text>
                      </View>
                      <View style={styles.statsBarCol}>
                        <View style={[styles.statsBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
                          <View style={[styles.statsBarFill, { width: `${item.rate}%`, backgroundColor: rateColor }]} />
                        </View>
                      </View>
                      <View style={styles.statsCountCol}>
                        <Text style={[styles.statsRate, { color: rateColor }]}>{item.rate}%</Text>
                        <Text style={[styles.statsCount, { color: colors.textTertiary }]}>{item.present}/{item.total}</Text>
                      </View>
                    </View>
                  );
                })}
              </AppCard>
            </View>
          ) : (
            <View style={styles.statsSection}>
              <AppSectionHeader title="本月学生出勤率" />
              <AppCard radius={14} padding="none" style={{ overflow: 'hidden' }}>
                {studentStats.map((item, index) => {
                  const rateColor = getRateColor(item.rate);
                  const accentColor = item.gender === '男' ? colors.info : '#EC4899';
                  const accentBg = item.gender === '男' ? colors.infoLight : '#FDF2F8';
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.studentStatsRow,
                        index < studentStats.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                      ]}
                    >
                      <View style={styles.studentStatsHeader}>
                        <View style={styles.studentStatsIdentity}>
                          <View style={[styles.studentStatsAvatar, { backgroundColor: accentBg }]}>
                            <Text style={[styles.studentStatsAvatarText, { color: accentColor }]}>{item.name[0]}</Text>
                          </View>
                          <View>
                            <Text style={[styles.studentStatsName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.studentStatsMeta, { color: colors.textTertiary }]}>出勤 {item.presentDays} / 总天数 {item.totalDays}</Text>
                          </View>
                        </View>
                        <View style={[styles.studentRateBadge, { backgroundColor: rateColor + '15' }]}>
                          <Text style={[styles.studentRateBadgeText, { color: rateColor }]}>{item.rate}%</Text>
                        </View>
                      </View>

                      <View style={[styles.studentStatsTrack, { backgroundColor: colors.surfaceSecondary }]}>
                        <View style={[styles.studentStatsFill, { width: `${item.rate}%`, backgroundColor: rateColor }]} />
                      </View>

                      <View style={styles.studentStatsMetaRow}>
                        {[
                          { label: '迟到', value: item.lateDays, color: colors.warning },
                          { label: '请假', value: item.leaveDays, color: colors.info },
                          { label: '缺席', value: item.absentDays, color: colors.error },
                        ].map((stat) => (
                          <View key={stat.label} style={[styles.studentStatsMiniCard, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.studentStatsMiniValue, { color: stat.color }]}>{stat.value}</Text>
                            <Text style={[styles.studentStatsMiniLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </AppCard>
            </View>
          )}
        </ScrollView>
      )}

      {/* 班级选择弹窗 */}
      <Modal visible={classPickerOpen} transparent animationType="slide" onRequestClose={() => setClassPickerOpen(false)}>
        <TouchableOpacity style={styles.classPkOverlay} activeOpacity={1} onPress={() => setClassPickerOpen(false)}>
          <View style={[styles.classPkContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.classPkHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.classPkTitle, { color: colors.text }]}>选择班级</Text>
            <View style={styles.classPkList}>
              {classes.map((cls) => {
                const isActive = selectedClassId === cls.id;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[
                      styles.classPkItem,
                      {
                        backgroundColor: isActive ? colors.primaryLight : colors.surfaceSecondary,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedClassId(cls.id);
                      setClassPickerOpen(false);
                    }}
                  >
                    <Ionicons name="school-outline" size={18} color={isActive ? colors.primary : colors.textTertiary} />
                    <Text style={[styles.classPkItemText, { color: isActive ? colors.primary : colors.text }]}>{cls.name}</Text>
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  heroPageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTopSpacer: {
    width: 34,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.68)',
    letterSpacing: 0.3,
  },
  heroTitle: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 4,
    paddingBottom: 2,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    marginTop: 2,
    fontSize: 10,
    color: 'rgba(255,255,255,0.72)',
  },
  tabBar: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 },
  tabInner: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 10 },
  tabText: { fontSize: 13 },
  statsSwitchWrap: { marginHorizontal: 20, marginTop: 10, borderRadius: 14, padding: 4 },
  statsSwitchInner: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  statsSwitchItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 10 },
  statsSwitchText: { fontSize: 12 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  classPickerToolbarBtn: {
    alignSelf: 'flex-start',
    marginLeft: 14,
    marginTop: 10,
  },
  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  batchBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: undefined,
  },
  batchBtnText: {
    fontSize: 12,
  },
  batchSummary: {
    fontSize: 13,
    fontWeight: '500',
  },
  listSection: { paddingHorizontal: 14, marginTop: 6, gap: 8 },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentNo: {
    fontSize: 11,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 5,
  },
  statusPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  bottomInfo: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    width: undefined,
  },
  overviewRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 10, marginTop: 10 },
  overviewIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 18, fontWeight: '800' },
  overviewLabel: { fontSize: 10 },
  statsSection: { paddingHorizontal: 14, marginTop: 16 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsDateCol: {
    width: 60,
  },
  statsDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsWeekday: {
    fontSize: 10,
    marginTop: 1,
  },
  statsBarCol: {
    flex: 1,
    marginHorizontal: 10,
  },
  statsBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statsBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsCountCol: {
    width: 52,
    alignItems: 'flex-end',
  },
  statsRate: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsCount: {
    fontSize: 10,
    marginTop: 1,
  },
  studentStatsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  studentStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  studentStatsIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  studentStatsAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentStatsAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentStatsName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentStatsMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  studentRateBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  studentRateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentStatsTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  studentStatsFill: {
    height: '100%',
    borderRadius: 999,
  },
  studentStatsMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  studentStatsMiniCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentStatsMiniValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  studentStatsMiniLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  classPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  classPkOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  classPkContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 14 },
  classPkHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  classPkTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  classPkList: { gap: 10 },
  classPkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  classPkItemText: { flex: 1, fontSize: 15, fontWeight: '700' },
});

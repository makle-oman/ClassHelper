import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../src/theme';

const weekdays = ['周一', '周二', '周三', '周四', '周五'];

interface PeriodConfig {
  key: string;
  label: string;
  time: string;
  type: 'special' | 'normal';
}

const periods: PeriodConfig[] = [
  { key: 'morning', label: '早读', time: '07:40', type: 'special' },
  { key: '1', label: '第1节', time: '08:00', type: 'normal' },
  { key: '2', label: '第2节', time: '08:50', type: 'normal' },
  { key: '3', label: '第3节', time: '10:00', type: 'normal' },
  { key: '4', label: '第4节', time: '10:50', type: 'normal' },
  { key: 'noon', label: '午阅', time: '12:30', type: 'special' },
  { key: '5', label: '第5节', time: '14:00', type: 'normal' },
  { key: '6', label: '第6节', time: '14:50', type: 'normal' },
  { key: 'after', label: '课后服务', time: '16:00', type: 'special' },
];

interface CourseInfo {
  subject: string;
  weeks?: string;
  isMine?: boolean; // 是否是当前老师的课
}

// 每门课程分配颜色索引
const subjectColorMap: Record<string, number> = {
  '语文': 0,
  '数学': 1,
  '英语': 2,
  '体育': 3,
  '音乐': 4,
  '美术': 5,
  '科学': 6,
  '道法': 7,
};

// 模拟课程数据
const mockSchedule: Record<string, Record<string, CourseInfo>> = {
  '周一': {
    'morning': { subject: '语文', weeks: '1-18周', isMine: true },
    '1': { subject: '语文', weeks: '1-18周', isMine: true },
    '2': { subject: '数学', weeks: '1-18周', isMine: true },
    '3': { subject: '英语', weeks: '1-16周' },
    '4': { subject: '体育', weeks: '1-18周' },
    'noon': { subject: '阅读', weeks: '1-18周' },
    '5': { subject: '音乐', weeks: '1-18周' },
    '6': { subject: '科学', weeks: '1-18周' },
    'after': { subject: '语文', weeks: '1-18周', isMine: true },
  },
  '周二': {
    'morning': { subject: '英语', weeks: '1-18周' },
    '1': { subject: '数学', weeks: '1-18周', isMine: true },
    '2': { subject: '语文', weeks: '1-18周', isMine: true },
    '3': { subject: '美术', weeks: '1-16周' },
    '4': { subject: '语文', weeks: '1-18周', isMine: true },
    'noon': { subject: '阅读', weeks: '1-18周' },
    '5': { subject: '道法', weeks: '1-18周' },
    '6': { subject: '体育', weeks: '1-18周' },
    'after': { subject: '数学', weeks: '1-18周', isMine: true },
  },
  '周三': {
    'morning': { subject: '语文', weeks: '1-18周', isMine: true },
    '1': { subject: '英语', weeks: '1-18周' },
    '2': { subject: '语文', weeks: '1-18周', isMine: true },
    '3': { subject: '数学', weeks: '1-18周', isMine: true },
    '4': { subject: '科学', weeks: '1-16周' },
    'noon': { subject: '阅读', weeks: '1-18周' },
    '5': { subject: '美术', weeks: '1-18周' },
    '6': { subject: '音乐', weeks: '1-18周' },
    'after': { subject: '英语', weeks: '1-18周' },
  },
  '周四': {
    'morning': { subject: '数学', weeks: '1-18周', isMine: true },
    '1': { subject: '语文', weeks: '1-18周', isMine: true },
    '2': { subject: '数学', weeks: '1-18周', isMine: true },
    '3': { subject: '体育', weeks: '1-18周' },
    '4': { subject: '英语', weeks: '1-16周' },
    'noon': { subject: '阅读', weeks: '1-18周' },
    '5': { subject: '语文', weeks: '1-18周', isMine: true },
    '6': { subject: '道法', weeks: '1-18周' },
    'after': { subject: '数学', weeks: '1-18周', isMine: true },
  },
  '周五': {
    'morning': { subject: '英语', weeks: '1-18周' },
    '1': { subject: '数学', weeks: '1-18周', isMine: true },
    '2': { subject: '语文', weeks: '1-18周', isMine: true },
    '3': { subject: '科学', weeks: '1-18周' },
    '4': { subject: '语文', weeks: '1-16周', isMine: true },
    'noon': { subject: '阅读', weeks: '1-18周' },
    '5': { subject: '体育', weeks: '1-18周' },
    '6': { subject: '英语', weeks: '1-18周' },
    'after': { subject: '语文', weeks: '1-18周', isMine: true },
  },
};

// 假期数据：标记哪些日期放假
const holidays: Record<string, string> = {
  // key: "周几-第几周", value: 假期名称
  // 模拟五一假期：第10周 周三开始放到周五
  '周三-10': '五一',
  '周四-10': '五一',
  '周五-10': '五一',
  // 模拟端午：第14周 周四、周五
  '周四-14': '端午',
  '周五-14': '端午',
};

const CELL_WIDTH = 72;
const TIME_COL_WIDTH = 56;

export default function ScheduleScreen() {
  const colors = useTheme();
  const [currentWeek, setCurrentWeek] = useState(8);
  const totalWeeks = 18;

  // 计算本周是否有假期
  const weekHolidays = useMemo(() => {
    const result: Record<string, string> = {};
    weekdays.forEach((day) => {
      const key = `${day}-${currentWeek}`;
      if (holidays[key]) {
        result[day] = holidays[key];
      }
    });
    return result;
  }, [currentWeek]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 周选择器 */}
      <View style={[styles.weekSelector, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.weekText, { color: colors.text }]}>
          第 <Text style={{ color: colors.primary, fontWeight: '800' }}>{currentWeek}</Text> 周
          <Text style={[styles.weekTotal, { color: colors.textTertiary }]}> / {totalWeeks}周</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 课程表表格 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* 表头 - 星期 */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.timeHeaderCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.timeHeaderText, { color: colors.textTertiary }]}>节次</Text>
              </View>
              {weekdays.map((day, i) => {
                const isHoliday = !!weekHolidays[day];
                const isToday = new Date().getDay() === i + 1;
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayHeaderCell,
                      {
                        backgroundColor: isHoliday ? colors.holiday.bg : isToday ? colors.primary + '10' : colors.surface,
                        borderColor: isHoliday ? colors.holiday.border : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayHeaderText,
                        {
                          color: isHoliday ? colors.textTertiary : isToday ? colors.primary : colors.text,
                          fontWeight: isToday ? '800' : '600',
                        },
                      ]}
                    >
                      {day}
                    </Text>
                    {isToday && <View style={[styles.todayIndicator, { backgroundColor: colors.primary }]} />}
                    {isHoliday && (
                      <Text style={[styles.holidayLabel, { color: colors.error }]}>{weekHolidays[day]}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* 课程格子 */}
            {periods.map((period, pi) => {
              const isSpecial = period.type === 'special';
              // 在午阅前加分隔（午休）
              const showLunchBreak = period.key === 'noon';
              const showAfternoonBreak = period.key === 'after';

              return (
                <View key={period.key}>
                  {/* 午休 / 课后分隔 */}
                  {(showLunchBreak || showAfternoonBreak) && (
                    <View style={[styles.breakRow, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.breakText, { color: colors.textTertiary }]}>
                        {showLunchBreak ? '午 休' : ''}
                      </Text>
                    </View>
                  )}

                  <View style={styles.tableRow}>
                    {/* 时间列 */}
                    <View
                      style={[
                        styles.timeCell,
                        {
                          backgroundColor: isSpecial ? colors.surfaceSecondary : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.periodLabel, { color: isSpecial ? colors.textTertiary : colors.text, fontSize: isSpecial ? 10 : 11 }]}>
                        {period.label}
                      </Text>
                      <Text style={[styles.periodTime, { color: colors.textTertiary }]}>{period.time}</Text>
                    </View>

                    {/* 每天的课程 */}
                    {weekdays.map((day) => {
                      const isHoliday = !!weekHolidays[day];
                      const course = mockSchedule[day]?.[period.key];
                      const isToday = new Date().getDay() === weekdays.indexOf(day) + 1;

                      if (isHoliday) {
                        return (
                          <View
                            key={day}
                            style={[
                              styles.courseCell,
                              {
                                backgroundColor: colors.holiday.bg,
                                borderColor: colors.holiday.border,
                              },
                            ]}
                          >
                            {pi === Math.floor(periods.length / 2) && (
                              <Ionicons name="sunny-outline" size={16} color={colors.holiday.text} />
                            )}
                            {pi === Math.floor(periods.length / 2) + 1 && (
                              <Text style={[styles.holidayCellText, { color: colors.holiday.text }]}>
                                {weekHolidays[day]}
                              </Text>
                            )}
                          </View>
                        );
                      }

                      if (!course) {
                        return (
                          <View
                            key={day}
                            style={[
                              styles.courseCell,
                              {
                                backgroundColor: isToday ? colors.primary + '05' : colors.surface,
                                borderColor: colors.border,
                              },
                            ]}
                          />
                        );
                      }

                      const colorIndex = subjectColorMap[course.subject] ?? 0;
                      const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];

                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.courseCell,
                            {
                              backgroundColor: courseColor.bg,
                              borderColor: colors.border,
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          {course.isMine && <View style={styles.mineDot} />}
                          <Text style={[styles.courseSubject, { color: courseColor.text }]} numberOfLines={1}>
                            {course.subject}
                          </Text>
                          {course.weeks && !isSpecial && (
                            <Text style={[styles.courseWeeks, { color: courseColor.text + '80' }]} numberOfLines={1}>
                              {course.weeks}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* 图例 */}
        <View style={[styles.legend, { backgroundColor: colors.surface }]}>
          <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>科目图例</Text>
          <View style={styles.legendItems}>
            {Object.entries(subjectColorMap).map(([subject, colorIndex]) => {
              const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
              return (
                <View key={subject} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: courseColor.bg, borderColor: courseColor.text }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>{subject}</Text>
                </View>
              );
            })}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.holiday.bg, borderColor: colors.holiday.text }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>假期</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E0F7EA', borderColor: '#4CC590', borderWidth: 1.5 }]}>
                <View style={styles.legendMineDot} />
              </View>
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>我的课程</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  semesterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  semesterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  weekText: {
    fontSize: 15,
    fontWeight: '600',
  },
  weekTotal: {
    fontSize: 13,
    fontWeight: '400',
  },
  tableHeaderRow: {
    flexDirection: 'row',
  },
  timeHeaderCell: {
    width: TIME_COL_WIDTH,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  timeHeaderText: {
    fontSize: 11,
  },
  dayHeaderCell: {
    width: CELL_WIDTH,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  dayHeaderText: {
    fontSize: 13,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  holidayLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  breakRow: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 4,
  },
  tableRow: {
    flexDirection: 'row',
  },
  timeCell: {
    width: TIME_COL_WIDTH,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    gap: 2,
  },
  periodLabel: {
    fontWeight: '600',
  },
  periodTime: {
    fontSize: 9,
  },
  courseCell: {
    width: CELL_WIDTH,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    paddingHorizontal: 4,
  },
  courseSubject: {
    fontSize: 13,
    fontWeight: '700',
  },
  courseWeeks: {
    fontSize: 9,
    marginTop: 1,
  },
  holidayCellText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
  },
  legendMineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4CC590',
  },
  mineDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CC590',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});

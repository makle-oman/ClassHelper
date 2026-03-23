import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

type AttendanceStatus = 'present' | 'late' | 'early' | 'leave' | 'absent';

interface StudentAttendance {
  id: string;
  name: string;
  studentNo: string;
  gender: '\u7537' | '\u5973';
  status: AttendanceStatus;
}

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: string }> = {
  present: { label: '\u51FA\u52E4', color: '#22C55E', icon: 'checkmark-circle' },
  late: { label: '\u8FDF\u5230', color: '#F97316', icon: 'time' },
  early: { label: '\u65E9\u9000', color: '#F59E0B', icon: 'exit' },
  leave: { label: '\u8BF7\u5047', color: '#3B82F6', icon: 'document-text' },
  absent: { label: '\u7F3A\u5E2D', color: '#EF4444', icon: 'close-circle' },
};

const initialStudents: StudentAttendance[] = [
  { id: '1', name: '\u5F20\u5C0F\u660E', studentNo: '20230101', gender: '\u7537', status: 'present' },
  { id: '2', name: '\u674E\u5C0F\u7EA2', studentNo: '20230102', gender: '\u5973', status: 'present' },
  { id: '3', name: '\u738B\u5927\u529B', studentNo: '20230103', gender: '\u7537', status: 'present' },
  { id: '4', name: '\u8D75\u5C0F\u71D5', studentNo: '20230104', gender: '\u5973', status: 'present' },
  { id: '5', name: '\u5218\u5929\u5B9D', studentNo: '20230105', gender: '\u7537', status: 'present' },
  { id: '6', name: '\u9648\u7F8E\u4E3D', studentNo: '20230106', gender: '\u5973', status: 'present' },
  { id: '7', name: '\u5B59\u6D69\u7136', studentNo: '20230107', gender: '\u7537', status: 'present' },
  { id: '8', name: '\u5468\u5C0F\u5A77', studentNo: '20230108', gender: '\u5973', status: 'present' },
];

const mockMonthlyStats = [
  { date: '03-22', weekday: '\u5468\u65E5', total: 43, present: 43, rate: 100 },
  { date: '03-21', weekday: '\u5468\u516D', total: 43, present: 42, rate: 97.7 },
  { date: '03-20', weekday: '\u5468\u4E94', total: 43, present: 41, rate: 95.3 },
  { date: '03-19', weekday: '\u5468\u56DB', total: 43, present: 43, rate: 100 },
  { date: '03-18', weekday: '\u5468\u4E09', total: 43, present: 40, rate: 93.0 },
  { date: '03-17', weekday: '\u5468\u4E8C', total: 43, present: 42, rate: 97.7 },
  { date: '03-16', weekday: '\u5468\u4E00', total: 43, present: 43, rate: 100 },
];

const WEEKDAYS = ['\u5468\u65E5', '\u5468\u4E00', '\u5468\u4E8C', '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS[date.getDay()];
  return `${y}\u5E74${m}\u6708${d}\u65E5 ${w}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AttendanceScreen() {
  const colors = useTheme();
  const [selectedTab, setSelectedTab] = useState<'record' | 'stats'>('record');
  const [currentDate, setDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState('\u4E09\u5E74\u7EA71\u73ED');
  const [students, setStudents] = useState<StudentAttendance[]>(initialStudents);

  const today = new Date();

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setDate(next);
  };

  const goToday = () => setDate(new Date());

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' as AttendanceStatus })));
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const abnormalCount = students.length - presentCount;
  const markedCount = students.length;

  const handleSave = () => {
    Alert.alert('\u4FDD\u5B58\u6210\u529F', `\u5DF2\u4FDD\u5B58${formatDate(currentDate)}\u7684\u8003\u52E4\u8BB0\u5F55`);
  };

  const getRateColor = (rate: number) => {
    if (rate >= 95) return colors.success;
    if (rate >= 90) return colors.warning;
    return colors.error;
  };

  const monthlyLate = 3;
  const monthlyAbsent = 2;
  const monthlyRate = 97.2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* \u9876\u90E8\u5BFC\u822A */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{'\u8003\u52E4\u6253\u5361'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab \u5207\u6362 */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <View style={[styles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['record', 'stats'] as const).map((tab) => (
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
                {tab === 'record' ? '\u8003\u52E4\u8BB0\u5F55' : '\u8003\u52E4\u7EDF\u8BA1'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedTab === 'record' ? (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
            {/* \u65E5\u671F\u9009\u62E9\u5668 */}
            <View style={[styles.dateSelector, { backgroundColor: colors.surface }]}>
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
                  {'\u4ECA\u5929'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* \u73ED\u7EA7\u9009\u62E9 */}
            <View style={styles.classSelector}>
              {['\u4E09\u5E74\u7EA71\u73ED', '\u4E09\u5E74\u7EA72\u73ED'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedClass === c ? colors.primaryLight : colors.surfaceSecondary,
                      borderColor: selectedClass === c ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedClass(c)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selectedClass === c ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* \u6279\u91CF\u64CD\u4F5C\u680F */}
            <View style={styles.batchBar}>
              <TouchableOpacity
                style={[styles.batchBtn, { backgroundColor: colors.success }]}
                onPress={markAllPresent}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                <Text style={styles.batchBtnText}>{'\u5168\u90E8\u51FA\u52E4'}</Text>
              </TouchableOpacity>
              <Text style={[styles.batchSummary, { color: colors.textSecondary }]}>
                {'\u51FA\u52E4'} {presentCount} / {'\u5F02\u5E38'} {abnormalCount}
              </Text>
            </View>

            {/* \u5B66\u751F\u8003\u52E4\u5217\u8868 */}
            <View style={styles.listSection}>
              {students.map((student) => (
                <View key={student.id} style={[styles.studentCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.studentLeft}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: student.gender === '\u7537' ? colors.infoLight : '#FDF2F8' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: student.gender === '\u7537' ? colors.info : '#EC4899' },
                        ]}
                      >
                        {student.name[0]}
                      </Text>
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
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: isActive ? '#FFF' : colors.textTertiary },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* \u5E95\u90E8\u64CD\u4F5C\u680F */}
          <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Text style={[styles.bottomInfo, { color: colors.textSecondary }]}>
              {'\u5DF2\u6807\u8BB0'} {markedCount}/{students.length}
            </Text>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.success }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons name="save" size={16} color="#FFF" />
              <Text style={styles.saveBtnText}>{'\u4FDD\u5B58\u8003\u52E4'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* \u73ED\u7EA7\u9009\u62E9 */}
          <View style={styles.classSelector}>
            {['\u4E09\u5E74\u7EA71\u73ED', '\u4E09\u5E74\u7EA72\u73ED'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedClass === c ? colors.primaryLight : colors.surfaceSecondary,
                    borderColor: selectedClass === c ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedClass(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedClass === c ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* \u6982\u89C8\u7EDF\u8BA1 */}
          <View style={styles.overviewRow}>
            {[
              { label: '\u672C\u6708\u51FA\u52E4\u7387', value: `${monthlyRate}%`, icon: 'checkmark-circle' as const, colorKey: 'green' as const },
              { label: '\u672C\u6708\u8FDF\u5230', value: monthlyLate.toString(), icon: 'time' as const, colorKey: 'orange' as const },
              { label: '\u672C\u6708\u7F3A\u5E2D', value: monthlyAbsent.toString(), icon: 'close-circle' as const, colorKey: 'red' as const },
            ].map((item) => (
              <View key={item.label} style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.overviewIconBox, { backgroundColor: colors.palette[item.colorKey].bg }]}>
                  <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                </View>
                <Text style={[styles.overviewValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.overviewLabel, { color: colors.textTertiary }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* \u6BCF\u65E5\u8003\u52E4\u5217\u8868 */}
          <View style={styles.statsSection}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>{'\u672C\u6708\u6BCF\u65E5\u8003\u52E4'}</Text>
            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
              {mockMonthlyStats.map((item, index) => {
                const rateColor = getRateColor(item.rate);
                return (
                  <View
                    key={item.date}
                    style={[
                      styles.statsRow,
                      index < mockMonthlyStats.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                    ]}
                  >
                    <View style={styles.statsDateCol}>
                      <Text style={[styles.statsDate, { color: colors.text }]}>{item.date}</Text>
                      <Text style={[styles.statsWeekday, { color: colors.textTertiary }]}>{item.weekday}</Text>
                    </View>
                    <View style={styles.statsBarCol}>
                      <View style={[styles.statsBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
                        <View
                          style={[
                            styles.statsBarFill,
                            { width: `${item.rate}%`, backgroundColor: rateColor },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.statsCountCol}>
                      <Text style={[styles.statsRate, { color: rateColor }]}>{item.rate}%</Text>
                      <Text style={[styles.statsCount, { color: colors.textTertiary }]}>
                        {item.present}/{item.total}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav bar
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

  // Tab
  tabBar: { paddingHorizontal: 20, paddingVertical: 10 },
  tabInner: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  tabText: { fontSize: 13 },

  // Date selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Class selector
  classSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Batch bar
  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  batchBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batchSummary: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Student list
  listSection: { paddingHorizontal: 20, marginTop: 8, gap: 8 },
  studentCard: {
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
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
    gap: 6,
  },
  statusPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  bottomInfo: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Overview cards
  overviewRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12 },
  overviewCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  overviewIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 20, fontWeight: '800' },
  overviewLabel: { fontSize: 10 },

  // Stats section
  statsSection: { paddingHorizontal: 20, marginTop: 18 },
  statsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statsCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
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
});

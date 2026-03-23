import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TIME_COL_WIDTH = 46;
const CELL_WIDTH = (SCREEN_WIDTH - TIME_COL_WIDTH) / 5;

const weekdays = ['周一', '周二', '周三', '周四', '周五'];

// 模拟当前登录老师信息
const currentTeacher = { name: '王老师', subject: '数学' };

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
  { key: 'after', label: '课后', time: '16:00', type: 'special' },
];

// 节次标签到 key 的映射（用于 Excel 导入匹配）
const periodLabelToKey: Record<string, string> = {};
periods.forEach((p) => {
  periodLabelToKey[p.label] = p.key;
  // 兼容简写
  if (p.label.startsWith('第')) periodLabelToKey[p.label.replace('节', '')] = p.key;
});
periodLabelToKey['早读'] = 'morning';
periodLabelToKey['午阅'] = 'noon';
periodLabelToKey['午读'] = 'noon';
periodLabelToKey['课后'] = 'after';
periodLabelToKey['课后服务'] = 'after';

interface CourseInfo {
  subject: string;
  weeks?: string;
  isMine?: boolean;
}

const subjects = ['语文', '数学', '英语', '体育', '音乐', '美术', '科学', '道法'];

const subjectColorMap: Record<string, number> = {
  '语文': 0, '数学': 1, '英语': 2, '体育': 3,
  '音乐': 4, '美术': 5, '科学': 6, '道法': 7,
};

interface ClassInfo {
  id: string;
  name: string;
  schedule: Record<string, Record<string, CourseInfo>>;
}

const initialClasses: ClassInfo[] = [
  {
    id: '1',
    name: '三年级1班',
    schedule: {
      '周一': {
        'morning': { subject: '语文', weeks: '1-18周', isMine: false },
        '1': { subject: '语文', weeks: '1-18周', isMine: false },
        '2': { subject: '数学', weeks: '1-18周', isMine: true },
        '3': { subject: '英语', weeks: '1-16周' },
        '4': { subject: '体育', weeks: '1-18周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '音乐', weeks: '1-18周' },
        '6': { subject: '科学', weeks: '1-18周' },
        'after': { subject: '语文', weeks: '1-18周' },
      },
      '周二': {
        'morning': { subject: '英语', weeks: '1-18周' },
        '1': { subject: '数学', weeks: '1-18周', isMine: true },
        '2': { subject: '语文', weeks: '1-18周' },
        '3': { subject: '美术', weeks: '1-16周' },
        '4': { subject: '语文', weeks: '1-18周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '道法', weeks: '1-18周' },
        '6': { subject: '体育', weeks: '1-18周' },
        'after': { subject: '数学', weeks: '1-18周', isMine: true },
      },
      '周三': {
        'morning': { subject: '语文', weeks: '1-18周' },
        '1': { subject: '英语', weeks: '1-18周' },
        '2': { subject: '语文', weeks: '1-18周' },
        '3': { subject: '数学', weeks: '1-18周', isMine: true },
        '4': { subject: '科学', weeks: '1-16周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '美术', weeks: '1-18周' },
        '6': { subject: '音乐', weeks: '1-18周' },
        'after': { subject: '英语', weeks: '1-18周' },
      },
      '周四': {
        'morning': { subject: '数学', weeks: '1-18周', isMine: true },
        '1': { subject: '语文', weeks: '1-18周' },
        '2': { subject: '数学', weeks: '1-18周', isMine: true },
        '3': { subject: '体育', weeks: '1-18周' },
        '4': { subject: '英语', weeks: '1-16周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '语文', weeks: '1-18周' },
        '6': { subject: '道法', weeks: '1-18周' },
        'after': { subject: '数学', weeks: '1-18周', isMine: true },
      },
      '周五': {
        'morning': { subject: '英语', weeks: '1-18周' },
        '1': { subject: '数学', weeks: '1-18周', isMine: true },
        '2': { subject: '语文', weeks: '1-18周' },
        '3': { subject: '科学', weeks: '1-18周' },
        '4': { subject: '语文', weeks: '1-16周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '体育', weeks: '1-18周' },
        '6': { subject: '英语', weeks: '1-18周' },
        'after': { subject: '语文', weeks: '1-18周' },
      },
    },
  },
  {
    id: '2',
    name: '三年级2班',
    schedule: {
      '周一': {
        'morning': { subject: '数学', weeks: '1-18周', isMine: true },
        '1': { subject: '数学', weeks: '1-18周', isMine: true },
        '2': { subject: '语文', weeks: '1-18周' },
        '3': { subject: '体育', weeks: '1-16周' },
        '4': { subject: '英语', weeks: '1-18周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '科学', weeks: '1-18周' },
        '6': { subject: '美术', weeks: '1-18周' },
        'after': { subject: '数学', weeks: '1-18周', isMine: true },
      },
      '周二': {
        'morning': { subject: '语文', weeks: '1-18周' },
        '1': { subject: '英语', weeks: '1-18周' },
        '2': { subject: '数学', weeks: '1-18周', isMine: true },
        '3': { subject: '语文', weeks: '1-16周' },
        '4': { subject: '音乐', weeks: '1-18周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '体育', weeks: '1-18周' },
        '6': { subject: '语文', weeks: '1-18周' },
        'after': { subject: '英语', weeks: '1-18周' },
      },
      '周三': {
        'morning': { subject: '英语', weeks: '1-18周' },
        '1': { subject: '数学', weeks: '1-18周', isMine: true },
        '2': { subject: '体育', weeks: '1-18周' },
        '3': { subject: '语文', weeks: '1-18周' },
        '4': { subject: '数学', weeks: '1-16周', isMine: true },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '道法', weeks: '1-18周' },
        '6': { subject: '科学', weeks: '1-18周' },
        'after': { subject: '语文', weeks: '1-18周' },
      },
      '周四': {
        'morning': { subject: '语文', weeks: '1-18周' },
        '1': { subject: '美术', weeks: '1-18周' },
        '2': { subject: '英语', weeks: '1-18周' },
        '3': { subject: '数学', weeks: '1-18周', isMine: true },
        '4': { subject: '语文', weeks: '1-16周' },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '数学', weeks: '1-18周', isMine: true },
        '6': { subject: '体育', weeks: '1-18周' },
        'after': { subject: '英语', weeks: '1-18周' },
      },
      '周五': {
        'morning': { subject: '数学', weeks: '1-18周', isMine: true },
        '1': { subject: '语文', weeks: '1-18周' },
        '2': { subject: '英语', weeks: '1-18周' },
        '3': { subject: '音乐', weeks: '1-18周' },
        '4': { subject: '数学', weeks: '1-16周', isMine: true },
        'noon': { subject: '阅读', weeks: '1-18周' },
        '5': { subject: '语文', weeks: '1-18周' },
        '6': { subject: '道法', weeks: '1-18周' },
        'after': { subject: '数学', weeks: '1-18周', isMine: true },
      },
    },
  },
];

// 假期
const holidays: Record<string, string> = {
  '周三-10': '五一', '周四-10': '五一', '周五-10': '五一',
  '周四-14': '端午', '周五-14': '端午',
};

export default function ScheduleScreen() {
  const colors = useTheme();
  const [viewMode, setViewMode] = useState<'schedule' | 'calendar'>('schedule');
  const [currentWeek, setCurrentWeek] = useState(8);
  const totalWeeks = 18;
  const [selectedClassId, setSelectedClassId] = useState(initialClasses[0].id);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 可变课程数据
  const [classesData, setClassesData] = useState<ClassInfo[]>(initialClasses);

  // 编辑面板状态
  const [editingCell, setEditingCell] = useState<{ day: string; periodKey: string } | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // 查看详情弹窗（非编辑模式下点击）
  const [selectedCourse, setSelectedCourse] = useState<{ course: CourseInfo; day: string; period: PeriodConfig } | null>(null);

  // 导入预览
  const [importPreview, setImportPreview] = useState<Record<string, Record<string, CourseInfo>> | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetClassId, setImportTargetClassId] = useState(selectedClassId);

  const currentClass = classesData.find((c) => c.id === selectedClassId)!;
  const schedule = currentClass.schedule;

  const weekHolidays = useMemo(() => {
    const result: Record<string, string> = {};
    weekdays.forEach((day) => {
      const key = `${day}-${currentWeek}`;
      if (holidays[key]) result[day] = holidays[key];
    });
    return result;
  }, [currentWeek]);

  // 编辑：设置某个格子的科目
  const setCellSubject = useCallback((day: string, periodKey: string, subject: string) => {
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== selectedClassId) return cls;
        const newSchedule = { ...cls.schedule };
        if (!newSchedule[day]) newSchedule[day] = {};
        newSchedule[day] = {
          ...newSchedule[day],
          [periodKey]: {
            subject,
            weeks: '1-18周',
            isMine: subject === currentTeacher.subject,
          },
        };
        return { ...cls, schedule: newSchedule };
      }),
    );
  }, [selectedClassId]);

  // 编辑：删除某个格子
  const deleteCellCourse = useCallback((day: string, periodKey: string) => {
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== selectedClassId) return cls;
        const newSchedule = { ...cls.schedule };
        if (newSchedule[day]) {
          const newDay = { ...newSchedule[day] };
          delete newDay[periodKey];
          newSchedule[day] = newDay;
        }
        return { ...cls, schedule: newSchedule };
      }),
    );
  }, [selectedClassId]);

  // 格子点击处理
  const handleCellPress = (day: string, period: PeriodConfig, course?: CourseInfo) => {
    if (isEditing) {
      setEditingCell({ day, periodKey: period.key });
      setShowSubjectPicker(true);
    } else if (course) {
      setSelectedCourse({ course, day, period });
    }
  };

  // 科目选择回调
  const handleSubjectSelect = (subject: string) => {
    if (editingCell) {
      setCellSubject(editingCell.day, editingCell.periodKey, subject);
      setShowSubjectPicker(false);
      setEditingCell(null);
    }
  };

  // 删除课程
  const handleDeleteCourse = () => {
    if (editingCell) {
      deleteCellCourse(editingCell.day, editingCell.periodKey);
      setShowSubjectPicker(false);
      setEditingCell(null);
    }
  };

  // Excel 导入
  const handleImportExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      let binary: string;

      if (Platform.OS === 'web') {
        // Web: fetch blob
        const response = await fetch(file.uri);
        const blob = await response.blob();
        binary = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsBinaryString(blob);
        });
      } else {
        // Native: read via FileSystem
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64' as any,
        });
        binary = atob(base64);
      }

      const workbook = XLSX.read(binary, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      if (data.length < 2) {
        Alert.alert('导入失败', '表格数据为空或格式不正确');
        return;
      }

      // 解析表头：找到周一到周五对应的列索引
      const headerRow = data[0];
      const dayColumnMap: Record<string, number> = {};
      headerRow.forEach((cell, colIndex) => {
        const cellStr = String(cell || '').trim();
        if (weekdays.includes(cellStr)) {
          dayColumnMap[cellStr] = colIndex;
        }
      });

      if (Object.keys(dayColumnMap).length === 0) {
        Alert.alert('导入失败', '未在第一行找到"周一"~"周五"列头，请检查 Excel 格式');
        return;
      }

      // 解析课程数据
      const parsed: Record<string, Record<string, CourseInfo>> = {};
      weekdays.forEach((d) => (parsed[d] = {}));

      for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
        const row = data[rowIdx];
        if (!row || !row[0]) continue;

        const periodLabel = String(row[0]).trim();
        const periodKey = periodLabelToKey[periodLabel];
        if (!periodKey) continue; // 跳过无法识别的行（如"午休"文字行）

        for (const [day, colIdx] of Object.entries(dayColumnMap)) {
          const cellValue = String(row[colIdx] || '').trim();
          if (!cellValue) continue;

          parsed[day][periodKey] = {
            subject: cellValue,
            weeks: '1-18周',
            isMine: cellValue === currentTeacher.subject,
          };
        }
      }

      // 检查是否解析到课程
      const totalCourses = Object.values(parsed).reduce(
        (sum, dayData) => sum + Object.keys(dayData).length,
        0,
      );

      if (totalCourses === 0) {
        Alert.alert('导入失败', '未解析到任何课程数据，请检查 Excel 内容');
        return;
      }

      setImportPreview(parsed);
      setImportTargetClassId(selectedClassId);
      setShowImportModal(true);
    } catch (err: any) {
      Alert.alert('导入出错', err?.message || '读取文件失败');
    }
  };

  // 确认导入
  const handleConfirmImport = () => {
    if (!importPreview) return;
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== importTargetClassId) return cls;
        return { ...cls, schedule: importPreview };
      }),
    );
    setShowImportModal(false);
    setImportPreview(null);
    setSelectedClassId(importTargetClassId);
    Alert.alert('导入成功', `已将课程表导入到 ${classesData.find((c) => c.id === importTargetClassId)?.name}，${currentTeacher.subject}课已自动标记为"我的课程"`);
  };

  // 统计导入预览中"我的课"数量
  const myCoursesCount = useMemo(() => {
    if (!importPreview) return 0;
    return Object.values(importPreview).reduce(
      (sum, dayData) => sum + Object.values(dayData).filter((c) => c.isMine).length,
      0,
    );
  }, [importPreview]);

  const handleLegendPress = (subject: string) => {
    setFilterSubject((prev) => (prev === subject ? null : subject));
  };

  // 编辑模式下当前格子的课程
  const editingCellCourse = editingCell ? schedule[editingCell.day]?.[editingCell.periodKey] : null;
  const editingPeriod = editingCell ? periods.find((p) => p.key === editingCell.periodKey) : null;

  // 校历事件数据
  // 当前学期信息
  const semesterStart = '2026-02-17';
  const semesterEnd = '2026-06-30';

  const calendarEvents: Record<string, { type: 'holiday' | 'exam' | 'event'; label: string }> = {
    '2026-02-17': { type: 'event', label: '开学日' },
    '2026-03-15': { type: 'exam', label: '期中考试' },
    '2026-03-16': { type: 'exam', label: '期中考试' },
    '2026-03-17': { type: 'exam', label: '期中考试' },
    '2026-04-05': { type: 'holiday', label: '清明节' },
    '2026-04-06': { type: 'holiday', label: '清明节' },
    '2026-04-07': { type: 'holiday', label: '清明节' },
    '2026-05-01': { type: 'holiday', label: '五一劳动节' },
    '2026-05-02': { type: 'holiday', label: '五一劳动节' },
    '2026-05-03': { type: 'holiday', label: '五一劳动节' },
    '2026-05-31': { type: 'holiday', label: '端午节' },
    '2026-06-01': { type: 'holiday', label: '端午节' },
    '2026-06-22': { type: 'exam', label: '期末考试' },
    '2026-06-23': { type: 'exam', label: '期末考试' },
    '2026-06-24': { type: 'exam', label: '期末考试' },
    '2026-06-30': { type: 'event', label: '结课日' },
  };

  const [calMonth, setCalMonth] = useState(3);
  const [calYear, setCalYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 视图切换 */}
      <View style={[calStyles.tabBar, { backgroundColor: colors.surface }]}>
        <View style={[calStyles.tabInner, { backgroundColor: colors.surfaceSecondary }]}>
          {(['schedule', 'calendar'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[calStyles.tabItem, viewMode === tab && { backgroundColor: colors.surface }]}
              onPress={() => setViewMode(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'schedule' ? 'grid' : 'calendar'}
                size={15}
                color={viewMode === tab ? colors.primary : colors.textTertiary}
              />
              <Text style={[calStyles.tabText, { color: viewMode === tab ? colors.primary : colors.textTertiary }, viewMode === tab && { fontWeight: '700' }]}>
                {tab === 'schedule' ? '课程表' : '校历'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {viewMode === 'schedule' && (<>
      {/* 顶部栏 */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* 班级 + 编辑按钮 */}
        <View style={styles.topRow}>
          <View style={styles.classSelector}>
            {classesData.map((cls) => {
              const isActive = cls.id === selectedClassId;
              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classTab,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedClassId(cls.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.classTabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.topActions}>
            {isEditing && (
              <TouchableOpacity style={[styles.importBtn, { borderColor: colors.primary }]} onPress={handleImportExcel} activeOpacity={0.7}>
                <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
                <Text style={[styles.importBtnText, { color: colors.primary }]}>导入</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: isEditing ? colors.primary : colors.surfaceSecondary }]}
              onPress={() => { setIsEditing(!isEditing); setFilterSubject(null); }}
              activeOpacity={0.7}
            >
              <Ionicons name={isEditing ? 'checkmark' : 'create-outline'} size={14} color={isEditing ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.editBtnText, { color: isEditing ? '#FFFFFF' : colors.textSecondary }]}>
                {isEditing ? '完成' : '编辑'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 周选择器 */}
        <View style={styles.weekSelector}>
          <TouchableOpacity onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.weekText, { color: colors.text }]}>
            第 <Text style={{ color: colors.primary, fontWeight: '800' }}>{currentWeek}</Text> 周
            <Text style={[styles.weekTotal, { color: colors.textTertiary }]}> / {totalWeeks}</Text>
          </Text>
          <TouchableOpacity onPress={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 课程表 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          {/* 表头 */}
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
                    style={[styles.dayHeaderText, {
                      color: isHoliday ? colors.textTertiary : isToday ? colors.primary : colors.text,
                      fontWeight: isToday ? '800' : '600',
                    }]}
                  >
                    {day}
                  </Text>
                  {isToday && <View style={[styles.todayIndicator, { backgroundColor: colors.primary }]} />}
                  {isHoliday && <Text style={[styles.holidayLabel, { color: colors.error }]}>{weekHolidays[day]}</Text>}
                </View>
              );
            })}
          </View>

          {/* 课程格子 */}
          {periods.map((period, pi) => {
            const isSpecial = period.type === 'special';
            const showLunchBreak = period.key === 'noon';
            const showAfternoonBreak = period.key === 'after';

            return (
              <View key={period.key}>
                {(showLunchBreak || showAfternoonBreak) && (
                  <View style={[styles.breakRow, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.breakText, { color: colors.textTertiary }]}>
                      {showLunchBreak ? '午 休' : ''}
                    </Text>
                  </View>
                )}

                <View style={styles.tableRow}>
                  <View
                    style={[styles.timeCell, {
                      backgroundColor: isSpecial ? colors.surfaceSecondary : colors.surface,
                      borderColor: colors.border,
                    }]}
                  >
                    <Text style={[styles.periodLabel, { color: isSpecial ? colors.textTertiary : colors.text, fontSize: isSpecial ? 9 : 10 }]}>
                      {period.label}
                    </Text>
                    <Text style={[styles.periodTime, { color: colors.textTertiary }]}>{period.time}</Text>
                  </View>

                  {weekdays.map((day) => {
                    const isHoliday = !!weekHolidays[day];
                    const course = schedule[day]?.[period.key];
                    const isToday = new Date().getDay() === weekdays.indexOf(day) + 1;

                    if (isHoliday) {
                      return (
                        <View key={day} style={[styles.courseCell, { backgroundColor: colors.holiday.bg, borderColor: colors.holiday.border }]}>
                          {pi === Math.floor(periods.length / 2) && <Ionicons name="sunny-outline" size={14} color={colors.holiday.text} />}
                          {pi === Math.floor(periods.length / 2) + 1 && (
                            <Text style={[styles.holidayCellText, { color: colors.holiday.text }]}>{weekHolidays[day]}</Text>
                          )}
                        </View>
                      );
                    }

                    // 空格子
                    if (!course) {
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.courseCell,
                            {
                              backgroundColor: isToday ? colors.primary + '05' : colors.surface,
                              borderColor: isEditing ? colors.primary + '40' : colors.border,
                              borderStyle: isEditing ? 'dashed' as any : 'solid' as any,
                            },
                          ]}
                          activeOpacity={isEditing ? 0.6 : 1}
                          onPress={() => isEditing && handleCellPress(day, period)}
                        >
                          {isEditing && <Ionicons name="add" size={16} color={colors.primary + '50'} />}
                        </TouchableOpacity>
                      );
                    }

                    const colorIndex = subjectColorMap[course.subject] ?? 0;
                    const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
                    const isFiltered = filterSubject !== null && (
                      filterSubject === '我的课程' ? !course.isMine : course.subject !== filterSubject
                    );

                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.courseCell,
                          {
                            backgroundColor: isFiltered ? colors.surfaceSecondary : courseColor.bg,
                            borderColor: isEditing ? courseColor.text + '40' : colors.border,
                            opacity: isFiltered ? 0.4 : 1,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleCellPress(day, period, course)}
                      >
                        {course.isMine && !isFiltered && <View style={styles.mineDot} />}
                        {isEditing && (
                          <View style={styles.editIndicator}>
                            <Ionicons name="create-outline" size={8} color={courseColor.text + '60'} />
                          </View>
                        )}
                        <Text style={[styles.courseSubject, { color: isFiltered ? colors.textTertiary : courseColor.text }]} numberOfLines={1}>
                          {course.subject}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {/* 图例 */}
        {!isEditing && (
          <View style={[styles.legend, { backgroundColor: colors.surface }]}>
            <View style={styles.legendHeader}>
              <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>点击科目筛选</Text>
              {filterSubject && (
                <TouchableOpacity onPress={() => setFilterSubject(null)}>
                  <Text style={[styles.clearFilter, { color: colors.primary }]}>清除筛选</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.legendItems}>
              {Object.entries(subjectColorMap).map(([subject, colorIndex]) => {
                const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
                const isActive = filterSubject === subject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.legendChip, {
                      backgroundColor: isActive ? courseColor.bg : 'transparent',
                      borderColor: isActive ? courseColor.text : 'transparent',
                    }]}
                    onPress={() => handleLegendPress(subject)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.legendDot, { backgroundColor: courseColor.bg, borderColor: courseColor.text }]} />
                    <Text style={[styles.legendText, { color: isActive ? courseColor.text : colors.textSecondary, fontWeight: isActive ? '700' : '400' }]}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.legendChip, {
                  backgroundColor: filterSubject === '我的课程' ? '#E0F7EA' : 'transparent',
                  borderColor: filterSubject === '我的课程' ? '#4CC590' : 'transparent',
                }]}
                onPress={() => setFilterSubject((prev) => (prev === '我的课程' ? null : '我的课程'))}
                activeOpacity={0.6}
              >
                <View style={[styles.legendDot, { backgroundColor: '#E0F7EA', borderColor: '#4CC590', borderWidth: 1.5 }]}>
                  <View style={styles.legendMineDot} />
                </View>
                <Text style={[styles.legendText, { color: filterSubject === '我的课程' ? '#4CC590' : colors.textSecondary, fontWeight: filterSubject === '我的课程' ? '700' : '400' }]}>
                  我的课程
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 编辑模式提示 */}
        {isEditing && (
          <View style={[styles.editHint, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.editHintText, { color: colors.primary }]}>
              点击格子选择/更换科目，{currentTeacher.subject}课将自动标记为"我的课程"
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      </>)}

      {viewMode === 'calendar' && (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 学期信息条 */}
        <View style={[calStyles.semesterBar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="school-outline" size={14} color={colors.primary} />
          <Text style={[calStyles.semesterBarText, { color: colors.primary }]}>
            2025-2026学年第二学期（{semesterStart.slice(5)} ~ {semesterEnd.slice(5)}）
          </Text>
        </View>

        {/* 月份切换 */}
        <View style={calStyles.monthHeader}>
          <TouchableOpacity onPress={() => { if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} activeOpacity={0.6}>
            <View style={calStyles.monthTitleRow}>
              <Text style={[calStyles.monthTitle, { color: colors.text }]}>{calYear}年{calMonth}月</Text>
              <Ionicons name="caret-down" size={12} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 星期标题 */}
        <View style={calStyles.weekRow}>
          {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
            <Text key={d} style={[calStyles.weekLabel, { color: colors.textTertiary }]}>{d}</Text>
          ))}
        </View>

        {/* 日期网格 */}
        <View style={calStyles.daysGrid}>
          {(() => {
            const firstDay = new Date(calYear, calMonth - 1, 1);
            const daysInMonth = new Date(calYear, calMonth, 0).getDate();
            // getDay() 返回 0=周日, 需要转换为 周一=0
            let startOffset = firstDay.getDay() - 1;
            if (startOffset < 0) startOffset = 6;

            const cells = [];
            // 空白填充
            for (let i = 0; i < startOffset; i++) {
              cells.push(<View key={`empty-${i}`} style={calStyles.dayCell} />);
            }
            // 日期
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const event = calendarEvents[dateStr];
              const isToday = dateStr === '2026-03-23';
              const inSemester = dateStr >= semesterStart && dateStr <= semesterEnd;

              cells.push(
                <TouchableOpacity
                  key={day}
                  style={calStyles.dayCell}
                  activeOpacity={event ? 0.6 : 1}
                  onPress={() => { if (event) Alert.alert(event.label, `${calYear}年${calMonth}月${day}日`); }}
                >
                  <View style={[
                    calStyles.dayNumber,
                    isToday && { backgroundColor: colors.primary },
                    event?.type === 'holiday' && !isToday && { backgroundColor: colors.errorLight },
                  ]}>
                    <Text style={[
                      calStyles.dayText,
                      { color: inSemester ? colors.text : colors.textTertiary },
                      !inSemester && { opacity: 0.4 },
                      isToday && { color: '#FFF', opacity: 1 },
                      event?.type === 'holiday' && !isToday && { color: colors.error, opacity: 1 },
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {event && (
                    <View style={[
                      calStyles.eventDot,
                      { backgroundColor: event.type === 'holiday' ? colors.error : event.type === 'exam' ? colors.info : colors.success },
                    ]} />
                  )}
                </TouchableOpacity>
              );
            }
            return cells;
          })()}
        </View>

        {/* 本月事件列表 */}
        <View style={calStyles.eventSection}>
          <Text style={[calStyles.eventSectionTitle, { color: colors.textSecondary }]}>本月事件</Text>
          {(() => {
            const monthEvents = Object.entries(calendarEvents)
              .filter(([date]) => date.startsWith(`${calYear}-${String(calMonth).padStart(2, '0')}`))
              .reduce((acc, [date, event]) => {
                const existing = acc.find(e => e.label === event.label);
                if (existing) {
                  existing.endDate = date;
                } else {
                  acc.push({ ...event, startDate: date, endDate: date });
                }
                return acc;
              }, [] as { type: string; label: string; startDate: string; endDate: string }[]);

            if (monthEvents.length === 0) {
              return <Text style={[calStyles.noEvents, { color: colors.textTertiary }]}>本月暂无特殊事件</Text>;
            }

            return monthEvents.map((event, i) => (
              <View key={i} style={[calStyles.eventItem, { backgroundColor: colors.surface }]}>
                <View style={[
                  calStyles.eventTypeDot,
                  { backgroundColor: event.type === 'holiday' ? colors.error : event.type === 'exam' ? colors.info : colors.success },
                ]} />
                <View style={calStyles.eventInfo}>
                  <Text style={[calStyles.eventLabel, { color: colors.text }]}>{event.label}</Text>
                  <Text style={[calStyles.eventDate, { color: colors.textTertiary }]}>
                    {event.startDate.slice(5)}{event.startDate !== event.endDate ? ` ~ ${event.endDate.slice(5)}` : ''}
                  </Text>
                </View>
                <View style={[
                  calStyles.eventTypeBadge,
                  { backgroundColor: event.type === 'holiday' ? colors.errorLight : event.type === 'exam' ? colors.infoLight : colors.successLight },
                ]}>
                  <Text style={[
                    calStyles.eventTypeText,
                    { color: event.type === 'holiday' ? colors.error : event.type === 'exam' ? colors.info : colors.success },
                  ]}>
                    {event.type === 'holiday' ? '假期' : event.type === 'exam' ? '考试' : '校事'}
                  </Text>
                </View>
              </View>
            ));
          })()}
        </View>

        {/* 图例 */}
        <View style={calStyles.legend}>
          {[
            { color: colors.primary, label: '今天' },
            { color: colors.error, label: '假期' },
            { color: colors.info, label: '考试' },
            { color: colors.success, label: '校事' },
          ].map((item) => (
            <View key={item.label} style={calStyles.legendItem}>
              <View style={[calStyles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[calStyles.legendText, { color: colors.textTertiary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      )}

      {/* 月份选择器 */}
      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={calStyles.pickerOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
          <View style={[calStyles.pickerContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            {/* 年份切换 */}
            <View style={calStyles.pickerYearRow}>
              <TouchableOpacity onPress={() => setCalYear(calYear - 1)}>
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[calStyles.pickerYearText, { color: colors.text }]}>{calYear}年</Text>
              <TouchableOpacity onPress={() => setCalYear(calYear + 1)}>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            {/* 月份网格 */}
            <View style={calStyles.pickerGrid}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isCurrentMonth = m === calMonth && calYear === calYear;
                const monthStr = `${calYear}-${String(m).padStart(2, '0')}`;
                const semStartMonth = semesterStart.slice(0, 7);
                const semEndMonth = semesterEnd.slice(0, 7);
                const inSemester = monthStr >= semStartMonth && monthStr <= semEndMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      calStyles.pickerMonth,
                      isCurrentMonth && { backgroundColor: colors.primary },
                      !isCurrentMonth && inSemester && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => { setCalMonth(m); setShowMonthPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      calStyles.pickerMonthText,
                      { color: inSemester ? colors.text : colors.textTertiary },
                      !inSemester && { opacity: 0.5 },
                      isCurrentMonth && { color: '#FFF', opacity: 1, fontWeight: '700' },
                    ]}>
                      {m}月
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* === 科目选择面板（编辑模式）=== */}
      <Modal visible={showSubjectPicker} transparent animationType="slide" onRequestClose={() => { setShowSubjectPicker(false); setEditingCell(null); }}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => { setShowSubjectPicker(false); setEditingCell(null); }}>
          <View style={[styles.sheetContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            {/* 拖拽指示条 */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* 标题 */}
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {editingCell ? `${editingCell.day} · ${editingPeriod?.label}` : '选择科目'}
            </Text>
            {editingCellCourse && (
              <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
                当前：{editingCellCourse.subject}
              </Text>
            )}

            {/* 科目网格 */}
            <View style={styles.subjectGrid}>
              {subjects.map((subject) => {
                const colorIndex = subjectColorMap[subject] ?? 0;
                const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
                const isMySubject = subject === currentTeacher.subject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.subjectBtn, { backgroundColor: courseColor.bg, borderColor: courseColor.text + '30' }]}
                    onPress={() => handleSubjectSelect(subject)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.subjectBtnText, { color: courseColor.text }]}>{subject}</Text>
                    {isMySubject && (
                      <View style={[styles.mySubjectTag, { backgroundColor: courseColor.text + '15' }]}>
                        <Text style={[styles.mySubjectTagText, { color: courseColor.text }]}>我的</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 删除按钮（仅已有课程时显示） */}
            {editingCellCourse && (
              <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.errorLight }]} onPress={handleDeleteCourse} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.deleteBtnText, { color: colors.error }]}>删除此课程</Text>
              </TouchableOpacity>
            )}

            {/* 取消 */}
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => { setShowSubjectPicker(false); setEditingCell(null); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* === 查看详情弹窗（非编辑模式）=== */}
      <Modal visible={!!selectedCourse} transparent animationType="fade" onRequestClose={() => setSelectedCourse(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedCourse(null)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selectedCourse && (() => {
              const colorIndex = subjectColorMap[selectedCourse.course.subject] ?? 0;
              const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
              return (
                <>
                  <View style={[styles.modalHeader, { backgroundColor: courseColor.bg }]}>
                    <Text style={[styles.modalSubject, { color: courseColor.text }]}>{selectedCourse.course.subject}</Text>
                    {selectedCourse.course.isMine && (
                      <View style={[styles.modalMineBadge, { backgroundColor: courseColor.text + '20' }]}>
                        <Text style={[styles.modalMineText, { color: courseColor.text }]}>我的课</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.modalBody}>
                    <View style={styles.modalRow}>
                      <Ionicons name="school-outline" size={16} color={colors.textTertiary} />
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{currentClass.name}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{selectedCourse.day} · {selectedCourse.period.label}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{selectedCourse.period.time}</Text>
                    </View>
                    {selectedCourse.course.weeks && (
                      <View style={styles.modalRow}>
                        <Ionicons name="repeat-outline" size={16} color={colors.textTertiary} />
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{selectedCourse.course.weeks}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedCourse(null)}>
                    <Text style={styles.modalCloseBtnText}>关闭</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* === 导入预览弹窗 === */}
      <Modal visible={showImportModal} transparent animationType="slide" onRequestClose={() => setShowImportModal(false)}>
        <View style={[styles.importModalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            {/* 头部 */}
            <View style={[styles.importHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={[styles.importCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <Text style={[styles.importTitle, { color: colors.text }]}>导入预览</Text>
              <TouchableOpacity onPress={handleConfirmImport}>
                <Text style={[styles.importConfirmText, { color: colors.primary }]}>确认导入</Text>
              </TouchableOpacity>
            </View>

            {/* 班级选择 */}
            <View style={[styles.importClassRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.importClassLabel, { color: colors.textSecondary }]}>导入到：</Text>
              {classesData.map((cls) => {
                const isActive = cls.id === importTargetClassId;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.classTab, {
                      backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                      borderColor: isActive ? colors.primary : colors.border,
                    }]}
                    onPress={() => setImportTargetClassId(cls.id)}
                  >
                    <Text style={[styles.classTabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 自动标记提示 */}
            <View style={[styles.importHint, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.importHintText, { color: colors.primary }]}>
                已自动识别 {myCoursesCount} 节{currentTeacher.subject}课为"我的课程"
              </Text>
            </View>

            {/* 预览表格 */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {importPreview && (
                <View>
                  {/* 表头 */}
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.timeHeaderCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.timeHeaderText, { color: colors.textTertiary }]}>节次</Text>
                    </View>
                    {weekdays.map((day) => (
                      <View key={day} style={[styles.dayHeaderCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.dayHeaderText, { color: colors.text }]}>{day}</Text>
                      </View>
                    ))}
                  </View>

                  {/* 课程格子 */}
                  {periods.map((period) => {
                    const isSpecial = period.type === 'special';
                    const showLunchBreak = period.key === 'noon';
                    const showAfternoonBreak = period.key === 'after';

                    return (
                      <View key={period.key}>
                        {(showLunchBreak || showAfternoonBreak) && (
                          <View style={[styles.breakRow, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.breakText, { color: colors.textTertiary }]}>
                              {showLunchBreak ? '午 休' : ''}
                            </Text>
                          </View>
                        )}
                        <View style={styles.tableRow}>
                          <View style={[styles.timeCell, {
                            backgroundColor: isSpecial ? colors.surfaceSecondary : colors.surface,
                            borderColor: colors.border,
                          }]}>
                            <Text style={[styles.periodLabel, { color: isSpecial ? colors.textTertiary : colors.text, fontSize: isSpecial ? 9 : 10 }]}>
                              {period.label}
                            </Text>
                          </View>
                          {weekdays.map((day) => {
                            const course = importPreview[day]?.[period.key];
                            if (!course) {
                              return <View key={day} style={[styles.courseCell, { backgroundColor: colors.surface, borderColor: colors.border }]} />;
                            }
                            const colorIndex = subjectColorMap[course.subject] ?? 0;
                            const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
                            return (
                              <View key={day} style={[styles.courseCell, { backgroundColor: courseColor.bg, borderColor: colors.border }]}>
                                {course.isMine && <View style={styles.mineDot} />}
                                <Text style={[styles.courseSubject, { color: courseColor.text }]} numberOfLines={1}>{course.subject}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // === Top Bar ===
  topBar: { paddingTop: 6, paddingBottom: 8, borderBottomWidth: 0.5 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8 },
  classSelector: { flexDirection: 'row', gap: 8 },
  classTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  classTabText: { fontSize: 12, fontWeight: '600' },
  topActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  importBtnText: { fontSize: 12, fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 12, fontWeight: '600' },
  weekSelector: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  weekText: { fontSize: 14, fontWeight: '600' },
  weekTotal: { fontSize: 12, fontWeight: '400' },
  // === Table ===
  tableHeaderRow: { flexDirection: 'row' },
  timeHeaderCell: { width: TIME_COL_WIDTH, height: 38, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5 },
  timeHeaderText: { fontSize: 10 },
  dayHeaderCell: { width: CELL_WIDTH, height: 38, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5 },
  dayHeaderText: { fontSize: 12 },
  todayIndicator: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  holidayLabel: { fontSize: 8, fontWeight: '600', marginTop: 1 },
  breakRow: { height: 16, justifyContent: 'center', alignItems: 'center' },
  breakText: { fontSize: 9, fontWeight: '500', letterSpacing: 4 },
  tableRow: { flexDirection: 'row' },
  timeCell: { width: TIME_COL_WIDTH, height: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, gap: 1 },
  periodLabel: { fontWeight: '600' },
  periodTime: { fontSize: 8 },
  courseCell: { width: CELL_WIDTH, height: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, paddingHorizontal: 2 },
  courseSubject: { fontSize: 12, fontWeight: '700' },
  holidayCellText: { fontSize: 12, fontWeight: '600' },
  // === Legend ===
  legend: { marginHorizontal: 12, marginTop: 12, padding: 12, borderRadius: 14 },
  legendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  legendTitle: { fontSize: 12, fontWeight: '600' },
  clearFilter: { fontSize: 12, fontWeight: '600' },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  legendText: { fontSize: 11 },
  legendMineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4CC590' },
  mineDot: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CC590', borderWidth: 1, borderColor: '#FFFFFF' },
  editIndicator: { position: 'absolute', bottom: 2, left: 2 },
  // === Edit Hint ===
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 12, padding: 12, borderRadius: 10 },
  editHintText: { fontSize: 12, flex: 1 },
  // === Subject Picker Sheet ===
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheetContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 20 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  sheetSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 4 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18, marginBottom: 16 },
  subjectBtn: {
    width: (SCREEN_WIDTH - 40 - 30) / 4, // 4列
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBtnText: { fontSize: 15, fontWeight: '700' },
  mySubjectTag: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  mySubjectTagText: { fontSize: 9, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, marginBottom: 10 },
  deleteBtnText: { fontSize: 14, fontWeight: '600' },
  cancelBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '500' },
  // === Detail Modal ===
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  modalSubject: { fontSize: 22, fontWeight: '800' },
  modalMineBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalMineText: { fontSize: 12, fontWeight: '600' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalLabel: { fontSize: 14 },
  modalCloseBtn: { marginHorizontal: 20, marginBottom: 20, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalCloseBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  // === Import Modal ===
  importModalContainer: { flex: 1 },
  importHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  importCancelText: { fontSize: 15 },
  importTitle: { fontSize: 17, fontWeight: '700' },
  importConfirmText: { fontSize: 15, fontWeight: '700' },
  importClassRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  importClassLabel: { fontSize: 13 },
  importHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 10, marginBottom: 6, padding: 10, borderRadius: 10 },
  importHintText: { fontSize: 12, flex: 1 },
});

const calStyles = StyleSheet.create({
  tabBar: { paddingHorizontal: 20, paddingVertical: 8 },
  tabInner: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  tabText: { fontSize: 13 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row', paddingHorizontal: 10 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', paddingBottom: 8 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4, minHeight: 48 },
  dayNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '500' },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  eventSection: { paddingHorizontal: 20, marginTop: 20 },
  eventSectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  noEvents: { fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  eventItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  eventTypeDot: { width: 8, height: 8, borderRadius: 4 },
  eventInfo: { flex: 1 },
  eventLabel: { fontSize: 14, fontWeight: '600' },
  eventDate: { fontSize: 12, marginTop: 2 },
  eventTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eventTypeText: { fontSize: 10, fontWeight: '600' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 11 },
  // Semester bar
  semesterBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  semesterBarText: { fontSize: 12, fontWeight: '600' },
  // Month title clickable
  monthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Month picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  pickerContent: { width: '100%', maxWidth: 300, borderRadius: 20, padding: 20 },
  pickerYearRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerYearText: { fontSize: 18, fontWeight: '700' },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pickerMonth: { width: '25%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  pickerMonthText: { fontSize: 14, fontWeight: '500' },
});

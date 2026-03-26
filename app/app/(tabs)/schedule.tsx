import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform, Animated, Easing, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';

const TIME_COL_WIDTH = 36;

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

const SEMESTER_START = '2026-02-17';
const SEMESTER_END = '2026-06-30';

function getWeekNumberInSemester(date: Date, SEMESTER_START: string, totalWeeks: number) {
  const start = new Date(`${SEMESTER_START}T00:00:00`);
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((current.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return 1;

  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), totalWeeks);
}

export default function ScheduleScreen() {
  const colors = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  // viewMode removed - calendar integrated into schedule header
  const [currentWeek, setCurrentWeek] = useState(8);
  const totalWeeks = 18;
  const [selectedClassId, setSelectedClassId] = useState(initialClasses[0].id);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 可变课程数据
  const [classesData, setClassesData] = useState<ClassInfo[]>(initialClasses);

  // 编辑面板状态
  const [editingCell, setEditingCell] = useState<{ day: string; periodKey: string } | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(28)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetBackdropOpacity = useRef(new Animated.Value(0)).current;

  // 查看详情弹窗（非编辑模式下点击）
  const [selectedCourse, setSelectedCourse] = useState<{ course: CourseInfo; day: string; period: PeriodConfig } | null>(null);

  // 导入预览
  const [importPreview, setImportPreview] = useState<Record<string, Record<string, CourseInfo>> | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetClassId, setImportTargetClassId] = useState(selectedClassId);
  const cellWidth = useMemo(() => {
    const safeWidth = Math.max(windowWidth, 320);
    // 每列左右各1px间距，5列共10px，再减节次列
    return Math.floor((safeWidth - TIME_COL_WIDTH - 10) / 5);
  }, [windowWidth]);
  const tableWidth = useMemo(() => TIME_COL_WIDTH + (cellWidth + 2) * weekdays.length, [cellWidth]);
  const subjectButtonWidth = useMemo(() => {
    const safeWidth = Math.max(windowWidth, 320);
    return Math.max(68, (safeWidth - 40 - 30) / 4);
  }, [windowWidth]);

  const currentClass = classesData.find((c) => c.id === selectedClassId)!;
  const schedule = currentClass.schedule;
  const myCourseCount = Object.values(schedule).reduce(
    (sum, dayData) => sum + Object.values(dayData).filter((course) => course.isMine).length,
    0,
  );
  const todayWeekIndex = new Date().getDay() - 1;
  const todayScheduleCount = todayWeekIndex >= 0 && todayWeekIndex < weekdays.length
    ? Object.keys(schedule[weekdays[todayWeekIndex]] || {}).length
    : 0;

  const weekHolidays = useMemo(() => {
    const result: Record<string, string> = {};
    weekdays.forEach((day) => {
      const key = `${day}-${currentWeek}`;
      if (holidays[key]) result[day] = holidays[key];
    });
    return result;
  }, [currentWeek]);

  // 计算当前周每天的实际日期
  const weekDates = useMemo(() => {
    const semStart = new Date(`${SEMESTER_START}T00:00:00`);
    const mondayOffset = (currentWeek - 1) * 7;
    return weekdays.map((_, i) => {
      const d = new Date(semStart);
      d.setDate(d.getDate() + mondayOffset + i);
      return d;
    });
  }, [currentWeek]);

  const todayDate = new Date();
  const todayDateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

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
      closeSubjectPicker();
    }
  };

  // 删除课程
  const handleDeleteCourse = () => {
    if (editingCell) {
      deleteCellCourse(editingCell.day, editingCell.periodKey);
      closeSubjectPicker();
    }
  };

  const closeSubjectPicker = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 28,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(sheetBackdropOpacity, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSubjectPickerVisible(false);
      setShowSubjectPicker(false);
      setEditingCell(null);
    });
  }, [sheetBackdropOpacity, sheetOpacity, sheetTranslateY]);

  useEffect(() => {
    if (!showSubjectPicker) return;

    setSubjectPickerVisible(true);
    sheetTranslateY.setValue(28);
    sheetOpacity.setValue(0);
    sheetBackdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetBackdropOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSubjectPicker, sheetBackdropOpacity, sheetOpacity, sheetTranslateY]);

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

  const currentSemesterWeek = useMemo(
    () => getWeekNumberInSemester(new Date(), SEMESTER_START, totalWeeks),
    [totalWeeks],
  );
  const isViewingCurrentWeek = currentWeek === currentSemesterWeek;
  const todayWeekday = new Date().getDay();
  const canLocateToday = todayWeekday >= 1 && todayWeekday <= 5;
  const scheduleHeroMetrics = useMemo(
    () => [
      { label: '我的课程', value: `${myCourseCount} 节` },
      { label: '今日课程', value: `${todayScheduleCount} 节` },
    ],
    [myCourseCount, todayScheduleCount],
  );

  const handleLocateToday = () => {
    setCurrentWeek(currentSemesterWeek);

    if (!canLocateToday) {
      Alert.alert('已定位到本周', `今天是周末，已切换到第${currentSemesterWeek}周课程表`);
    }
  };

  // 编辑模式下当前格子的课程
  const editingCellCourse = editingCell ? schedule[editingCell.day]?.[editingCell.periodKey] : null;
  const editingPeriod = editingCell ? periods.find((p) => p.key === editingCell.periodKey) : null;

  // 校历事件数据
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

  // 当前周的校历事件（去重合并连续天数）
  const weekCalendarEvents = useMemo(() => {
    const events: { type: 'holiday' | 'exam' | 'event'; label: string; dates: string[]; dayNames: string[] }[] = [];
    const seen = new Map<string, number>();

    weekDates.forEach((d, i) => {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const ev = calendarEvents[dateStr];
      if (!ev) return;

      const key = `${ev.type}-${ev.label}`;
      if (seen.has(key)) {
        const idx = seen.get(key)!;
        events[idx].dates.push(dateStr);
        events[idx].dayNames.push(weekdays[i]);
      } else {
        seen.set(key, events.length);
        events.push({ ...ev, dates: [dateStr], dayNames: [weekdays[i]] });
      }
    });
    return events;
  }, [weekDates, calendarEvents]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.scheduleHeroCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.scheduleHeroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
        <View style={[styles.scheduleHeroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
        <View style={styles.scheduleHeroHeader}>
          <View style={styles.scheduleHeroMain}>
            <View style={styles.scheduleHeroEyebrowWrap}>
              <Ionicons name="grid-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.scheduleHeroEyebrow}>课程表总览</Text>
            </View>
            <Text style={styles.scheduleHeroTitle}>{currentClass.name}</Text>
            <Text style={styles.scheduleHeroMeta}>{SEMESTER_START} - {SEMESTER_END}</Text>
          </View>
          <View style={styles.scheduleHeroWeekBadge}>
            <Text style={styles.scheduleHeroWeekBadgeLabel}>本周</Text>
            <Text style={styles.scheduleHeroWeekBadgeValue}>第 {currentWeek} 周</Text>
          </View>
        </View>
        <View style={styles.scheduleHeroStatsRow}>
          {scheduleHeroMetrics.map((item) => (
            <View key={item.label} style={styles.scheduleHeroMetricChip}>
              <Text style={styles.scheduleHeroMetricLabel}>{item.label}</Text>
              <Text style={styles.scheduleHeroMetricValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 顶部栏 */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* 班级 + 编辑按钮 */}
        <View style={styles.topRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.classSelectorScroll}
            contentContainerStyle={styles.classSelector}
          >
            <TouchableOpacity
              style={[
                styles.classTab,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setClassPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="school-outline" size={13} color="#FFFFFF" />
              <Text style={[styles.classTabText, { color: '#FFFFFF' }]}>
                {currentClass.name}
              </Text>
              <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </ScrollView>
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
        <View style={styles.weekControlRow}>
          <View style={[styles.weekSelector, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.weekNavButton} onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.weekTextWrap}>
              <Text style={[styles.weekText, { color: colors.text }]}>
                第 <Text style={{ color: colors.primary, fontWeight: '800' }}>{currentWeek}</Text> 周
                <Text style={[styles.weekTotal, { color: colors.textTertiary }]}> / {totalWeeks}</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.weekNavButton} onPress={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.todayLocateBtn,
              {
                backgroundColor: isViewingCurrentWeek ? colors.surfaceSecondary : colors.primaryLight,
                borderColor: isViewingCurrentWeek ? colors.border : colors.primary,
              },
            ]}
            onPress={handleLocateToday}
            activeOpacity={0.7}
          >
            <Ionicons
              name="locate-outline"
              size={14}
              color={isViewingCurrentWeek ? colors.textTertiary : colors.primary}
            />
            <Text
              style={[
                styles.todayLocateText,
                { color: isViewingCurrentWeek ? colors.textTertiary : colors.primary },
              ]}
            >
              {isViewingCurrentWeek ? '当前周' : '今日定位'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 本周校历事件 */}
      {weekCalendarEvents.length > 0 && (
        <View style={styles.calBanner}>
          {weekCalendarEvents.map((ev, i) => {
            const iconName = ev.type === 'holiday' ? 'sunny-outline' : ev.type === 'exam' ? 'document-text-outline' : 'flag-outline';
            const bgColor = ev.type === 'holiday' ? colors.errorLight : ev.type === 'exam' ? colors.infoLight : colors.primaryLight;
            const textColor = ev.type === 'holiday' ? colors.error : ev.type === 'exam' ? colors.info : colors.primary;
            const dayRange = ev.dayNames.length === 1 ? ev.dayNames[0] : `${ev.dayNames[0]}-${ev.dayNames[ev.dayNames.length - 1]}`;
            return (
              <View key={i} style={[styles.calBannerItem, { backgroundColor: bgColor }]}>
                <Ionicons name={iconName as any} size={14} color={textColor} />
                <Text style={[styles.calBannerText, { color: textColor }]}>
                  {ev.label}
                </Text>
                <Text style={[styles.calBannerDays, { color: textColor }]}>
                  {dayRange}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* 课程表 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* 表头 - 日历融合 */}
          <View style={[styles.tableHeaderRow, { width: tableWidth, backgroundColor: colors.surface }]}>
            <View style={[styles.timeHeaderCell, { backgroundColor: colors.surface }]}>
              <Text style={[styles.timeHeaderText, { color: colors.textTertiary }]}>节次</Text>
            </View>
            {weekdays.map((day, i) => {
              const isHoliday = !!weekHolidays[day];
              const dateObj = weekDates[i];
              const dateNum = dateObj.getDate();
              const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
              const isToday = dateStr === todayDateStr && isViewingCurrentWeek;
              const calEvent = calendarEvents[dateStr];
              const shortDay = day.replace('周', '');
              return (
                <View
                  key={day}
                  style={[styles.dayHeaderCell, { width: cellWidth }]}
                >
                  <Text style={[styles.dayHeaderWeekday, { color: colors.textTertiary }]}>
                    {isHoliday ? `${shortDay}·放假` : shortDay}
                  </Text>
                  <View style={[
                    styles.dayHeaderDateWrap,
                    isToday && { backgroundColor: colors.primary, borderRadius: 14 },
                  ]}>
                    <Text
                      style={[styles.dayHeaderDate, {
                        color: isHoliday ? colors.textTertiary : isToday ? '#FFFFFF' : colors.text,
                        fontWeight: isToday ? '800' : '600',
                      }]}
                    >
                      {dateNum}
                    </Text>
                  </View>
                  {calEvent && (
                    <View style={[styles.headerEventDot, {
                      backgroundColor: calEvent.type === 'holiday' ? colors.error : calEvent.type === 'exam' ? colors.info : colors.success,
                    }]} />
                  )}
                </View>
              );
            })}
          </View>

          {/* 课程格子 */}
          {periods.map((period) => {
            const isSpecial = period.type === 'special';
            const showLunchBreak = period.key === 'noon';
            const showAfternoonBreak = period.key === 'after';

            return (
              <View key={period.key}>
                {(showLunchBreak || showAfternoonBreak) && (
                  <View style={[styles.breakRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.breakText, { color: colors.textTertiary }]}>
                      {showLunchBreak ? '午 休' : ''}
                    </Text>
                  </View>
                )}

                <View style={[styles.tableRow, { width: tableWidth }]}>
                  <View
                    style={[styles.timeCell, {
                      backgroundColor: colors.surface,
                    }]}
                  >
                    <Text style={[styles.periodLabel, {
                      color: isSpecial ? colors.textTertiary : colors.text,
                      fontSize: isSpecial ? 10 : 13,
                      fontWeight: isSpecial ? '600' : '700',
                    }]}>
                      {isSpecial ? period.label : period.key}
                    </Text>
                  </View>

                  {weekdays.map((day) => {
                    const isHoliday = !!weekHolidays[day];
                    const course = schedule[day]?.[period.key];

                    if (isHoliday) {
                      return (
                        <View
                          key={day}
                          style={[styles.courseCell, { width: cellWidth }]}
                        >
                          <Text style={[styles.holidayCellText, { color: colors.textTertiary }]}>休</Text>
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
                            { width: cellWidth },
                            isEditing && { borderColor: colors.primary + '30', borderStyle: 'dashed' as any },
                          ]}
                          activeOpacity={isEditing ? 0.6 : 1}
                          onPress={() => isEditing && handleCellPress(day, period)}
                        >
                          {isEditing && <Ionicons name="add" size={14} color={colors.primary + '40'} />}
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
                          styles.courseCellFilled,
                          { width: cellWidth },
                          {
                            backgroundColor: isFiltered ? colors.surfaceSecondary : courseColor.bg,
                            opacity: isFiltered ? 0.4 : 1,
                          },
                          isEditing && { borderColor: courseColor.text + '30' },
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

      {/* === 科目选择面板（编辑模式）=== */}
      <Modal visible={subjectPickerVisible} transparent animationType="none" onRequestClose={closeSubjectPicker}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeSubjectPicker}>
          <Animated.View pointerEvents="none" style={[styles.sheetBackdrop, { opacity: sheetBackdropOpacity }]} />
          <Animated.View
            style={[
              styles.sheetContent,
              {
                backgroundColor: colors.surface,
                opacity: sheetOpacity,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* 拖拽指示条 */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* 标题 */}
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {editingCell ? `${editingCell.day} · ${editingPeriod?.label}` : '选择科目'}
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
              {editingCellCourse ? '选择新科目即可替换当前课程' : '选择一个科目填入当前格子'}
            </Text>

            <View
              style={[
                styles.sheetSummaryCard,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            >
              <View style={[styles.sheetSummaryIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons
                  name={editingCellCourse ? 'swap-horizontal-outline' : 'add-circle-outline'}
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.sheetSummaryBody}>
                <Text style={[styles.sheetSummaryTitle, { color: colors.text }]}>
                  {editingCellCourse ? `当前课程：${editingCellCourse.subject}` : '当前格子为空'}
                </Text>
                <Text style={[styles.sheetSummaryMeta, { color: colors.textTertiary }]}>
                  {editingCellCourse ? '从下方选择要换成的科目' : '从下方选择一个科目'}
                </Text>
              </View>
            </View>

            {/* 科目网格 */}
            <View style={styles.subjectGrid}>
              {subjects.map((subject) => {
                const colorIndex = subjectColorMap[subject] ?? 0;
                const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
                const isMySubject = subject === currentTeacher.subject;
                const isCurrentSubject = editingCellCourse?.subject === subject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectBtn,
                      {
                        width: subjectButtonWidth,
                        backgroundColor: courseColor.bg,
                        borderColor: isCurrentSubject ? courseColor.text : courseColor.text + '30',
                        shadowColor: courseColor.text,
                        shadowOpacity: isCurrentSubject ? 0.2 : 0.08,
                        elevation: isCurrentSubject ? 4 : 1,
                      },
                    ]}
                    onPress={() => handleSubjectSelect(subject)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subjectBtnHeader}>
                      <View
                        style={[
                          styles.subjectBtnMarker,
                          {
                            backgroundColor: isCurrentSubject ? courseColor.text + '18' : courseColor.text + '10',
                            borderColor: courseColor.text + '28',
                          },
                        ]}
                      >
                        {isCurrentSubject ? (
                          <Ionicons name="checkmark" size={10} color={courseColor.text} />
                        ) : (
                          <View style={[styles.subjectBtnDot, { backgroundColor: courseColor.text }]} />
                        )}
                      </View>
                      {isMySubject && (
                        <View style={[styles.mySubjectTag, { backgroundColor: courseColor.text + '15' }]}>
                          <Text style={[styles.mySubjectTagText, { color: courseColor.text }]}>我的</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.subjectBtnText, { color: courseColor.text }]}>{subject}</Text>
                    <Text
                      style={[
                        styles.subjectBtnMeta,
                        { color: isCurrentSubject ? courseColor.text : colors.textTertiary },
                      ]}
                    >
                      {isCurrentSubject ? '当前科目' : ''}
                      
                    </Text>
                    <View
                      style={[
                        styles.subjectBtnAccent,
                        {
                          backgroundColor: courseColor.text,
                          opacity: isCurrentSubject ? 0.18 : 0.1,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 删除按钮（仅已有课程时显示） */}
            <View style={styles.sheetActions}>
              {editingCellCourse && (
                <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.errorLight }]} onPress={handleDeleteCourse} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.deleteBtnText, { color: colors.error }]}>删除此课程</Text>
                </TouchableOpacity>
              )}

              {/* 取消 */}
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                onPress={closeSubjectPicker}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
                  <View style={[styles.tableHeaderRow, { width: tableWidth }]}>
                    <View style={[styles.timeHeaderCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.timeHeaderText, { color: colors.textTertiary }]}>节次</Text>
                    </View>
                    {weekdays.map((day) => (
                    <View key={day} style={[styles.dayHeaderCell, { width: cellWidth, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.dayHeaderDate, { color: colors.text }]}>{day}</Text>
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
                        <View style={[styles.tableRow, { width: tableWidth }]}>
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
                              return <View key={day} style={[styles.courseCell, { width: cellWidth, backgroundColor: colors.surface, borderColor: colors.border }]} />;
                            }
                            const colorIndex = subjectColorMap[course.subject] ?? 0;
                            const courseColor = colors.courseColors[colorIndex % colors.courseColors.length];
                            return (
                              <View key={day} style={[styles.courseCell, { width: cellWidth, backgroundColor: courseColor.bg, borderColor: colors.border }]}>
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

      {/* 班级选择弹窗 */}
      <Modal visible={classPickerOpen} transparent animationType="slide" onRequestClose={() => setClassPickerOpen(false)}>
        <TouchableOpacity style={styles.classPkOverlay} activeOpacity={1} onPress={() => setClassPickerOpen(false)}>
          <View style={[styles.classPkContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.classPkHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.classPkTitle, { color: colors.text }]}>选择班级</Text>
            <View style={styles.classPkList}>
              {classesData.map((cls) => {
                const isActive = cls.id === selectedClassId;
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
  // === Top Bar ===
  topBar: { paddingTop: 10, paddingBottom: 8, borderBottomWidth: 0.5 },
  scheduleHeroCard: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  scheduleHeroDecorLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
  },
  scheduleHeroDecorSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -20,
    left: -30,
  },
  scheduleHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  scheduleHeroMain: {
    flex: 1,
    minWidth: 0,
  },
  scheduleHeroEyebrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  scheduleHeroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.2,
  },
  scheduleHeroTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scheduleHeroMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.78)',
  },
  scheduleHeroWeekBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  scheduleHeroWeekBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
  },
  scheduleHeroWeekBadgeValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scheduleHeroStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  scheduleHeroMetricChip: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  scheduleHeroMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.76)',
  },
  scheduleHeroMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 6 },
  classSelectorScroll: { flex: 1, marginRight: 10 },
  classSelector: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  classTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  classTabText: { fontSize: 12, fontWeight: '700' },
  topActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  importBtnText: { fontSize: 12, fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  editBtnText: { fontSize: 12, fontWeight: '600' },
  weekControlRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  weekSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  weekNavButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekTextWrap: { flex: 1, alignItems: 'center' },
  weekText: { fontSize: 14, fontWeight: '700' },
  weekTotal: { fontSize: 11, fontWeight: '500' },
  todayLocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayLocateText: { fontSize: 11, fontWeight: '700' },
  // === Table ===
  tableContainer: { },
  tableHeaderRow: { flexDirection: 'row', marginBottom: 2 },
  timeHeaderCell: { width: TIME_COL_WIDTH, height: 44, justifyContent: 'center', alignItems: 'center' },
  timeHeaderText: { fontSize: 9, fontWeight: '500' },
  dayHeaderCell: { justifyContent: 'center', alignItems: 'center', paddingVertical: 4, marginHorizontal: 1 },
  dayHeaderWeekday: { fontSize: 10, fontWeight: '500' },
  dayHeaderDateWrap: { width: 26, height: 26, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dayHeaderDate: { fontSize: 14 },
  headerEventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  breakRow: { height: 14, justifyContent: 'center', alignItems: 'center', marginVertical: 1 },
  breakText: { fontSize: 8, fontWeight: '600', letterSpacing: 4, opacity: 0.5 },
  tableRow: { flexDirection: 'row', marginBottom: 2 },
  timeCell: { width: TIME_COL_WIDTH, height: 36, justifyContent: 'center', alignItems: 'center' },
  periodLabel: { fontWeight: '700' },
  courseCell: { height: 36, justifyContent: 'center', alignItems: 'center', marginHorizontal: 1, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  courseCellFilled: { borderWidth: 0 },
  courseSubject: { fontSize: 11, fontWeight: '700' },
  holidayCellText: { fontSize: 11, fontWeight: '500' },
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
  mineDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CC590', borderWidth: 1, borderColor: '#FFFFFF' },
  editIndicator: { position: 'absolute', bottom: 2, left: 2 },
  // === Edit Hint ===
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 12, padding: 12, borderRadius: 10 },
  editHintText: { fontSize: 12, flex: 1 },
  // === Calendar Banner ===
  calBanner: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  calBannerItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
  calBannerText: { fontSize: 12, fontWeight: '700' },
  calBannerDays: { fontSize: 11, fontWeight: '500', opacity: 0.8 },
  // === Subject Picker Sheet ===
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, paddingHorizontal: 14, paddingTop: 2 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  sheetSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 0 },
  sheetSummaryCard: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetSummaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSummaryBody: { flex: 1 },
  sheetSummaryTitle: { fontSize: 13, fontWeight: '700' },
  sheetSummaryMeta: { fontSize: 10, marginTop: 2 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  subjectBtn: {
    height: 72,
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 9,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  subjectBtnHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  subjectBtnMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBtnDot: { width: 5, height: 5, borderRadius: 2.5 },
  subjectBtnText: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  subjectBtnMeta: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  subjectBtnAccent: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 7,
    height: 3,
    borderRadius: 999,
  },
  mySubjectTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  mySubjectTagText: { fontSize: 8, fontWeight: '700' },
  sheetActions: { gap: 10, marginTop: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
  deleteBtnText: { fontSize: 14, fontWeight: '600' },
  cancelBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  // === Detail Modal ===
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 18 },
  modalSubject: { fontSize: 22, fontWeight: '800' },
  modalMineBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8 },
  modalMineText: { fontSize: 12, fontWeight: '600' },
  modalBody: { paddingHorizontal: 14, paddingVertical: 16, gap: 14 },
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
  // Class picker modal
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


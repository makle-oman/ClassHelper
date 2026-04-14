import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform, Animated, Easing, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { PrimaryHeroSection, AppCard, AppButton } from '../../src/components/ui';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import { classApi, semesterApi, courseApi, getTeacher, type TeacherInfo } from '../../src/services/api';
import { showFeedback } from '../../src/services/feedback';

const TIME_COL_WIDTH = 36;

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

// 前端 periodKey → 后端 period 编号
const PERIOD_KEY_TO_NUM: Record<string, number> = {
  'morning': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  'noon': 5, '5': 6, '6': 7, 'after': 8,
};
const PERIOD_NUM_TO_KEY: Record<number, string> = {};
Object.entries(PERIOD_KEY_TO_NUM).forEach(([k, v]) => { PERIOD_NUM_TO_KEY[v] = k; });

// 前端 weekday 中文 → 后端 weekday 编号
const WEEKDAY_LABEL_TO_NUM: Record<string, number> = {
  '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5,
};
const WEEKDAY_NUM_TO_LABEL: Record<number, string> = {};
Object.entries(WEEKDAY_LABEL_TO_NUM).forEach(([k, v]) => { WEEKDAY_NUM_TO_LABEL[v] = k; });

/** 将后端课程列表转换为前端 schedule 结构 */
function mapCoursesToSchedule(
  courses: { weekday: number; period: number; subject: string; teacher_id: number }[],
  teacherId: number | null,
): Record<string, Record<string, CourseInfo>> {
  const schedule: Record<string, Record<string, CourseInfo>> = {};
  weekdays.forEach((d) => (schedule[d] = {}));

  for (const c of courses) {
    const dayLabel = WEEKDAY_NUM_TO_LABEL[c.weekday];
    const periodKey = PERIOD_NUM_TO_KEY[c.period];
    if (!dayLabel || periodKey === undefined) continue;
    if (!schedule[dayLabel]) schedule[dayLabel] = {};
    schedule[dayLabel][periodKey] = {
      subject: c.subject,
      isMine: teacherId != null && c.teacher_id === teacherId,
    };
  }
  return schedule;
}

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

  // API 加载状态
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);

  // 班级 & 学期（从 API 加载）
  const [apiClasses, setApiClasses] = useState<{ id: number; name: string }[]>([]);
  const [semesters, setSemesters] = useState<{ id: number; name: string; start_date: string; end_date: string; weeks_count: number; current_week: number | null; is_active: boolean }[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<number | null>(null);

  const activeSemester = useMemo(() => semesters.find((s) => s.id === activeSemesterId) ?? null, [semesters, activeSemesterId]);
  const semesterStart = activeSemester?.start_date ?? '';
  const semesterEnd = activeSemester?.end_date ?? '';
  const totalWeeks = activeSemester?.weeks_count ?? 18;

  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 可变课程数据
  const [classesData, setClassesData] = useState<ClassInfo[]>([]);

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

  const emptySchedule: Record<string, Record<string, CourseInfo>> = useMemo(() => {
    const s: Record<string, Record<string, CourseInfo>> = {};
    weekdays.forEach((d) => (s[d] = {}));
    return s;
  }, []);
  const currentClass = classesData.find((c) => c.id === selectedClassId);
  const schedule = currentClass?.schedule ?? emptySchedule;
  const myCourseCount = Object.values(schedule).reduce(
    (sum, dayData) => sum + Object.values(dayData).filter((course) => course.isMine).length,
    0,
  );
  const todayWeekIndex = new Date().getDay() - 1;
  const todayScheduleCount = todayWeekIndex >= 0 && todayWeekIndex < weekdays.length
    ? Object.keys(schedule[weekdays[todayWeekIndex]] || {}).length
    : 0;

  const weekHolidays = useMemo<Record<string, string>>(() => ({}), []);

  // 计算当前周每天的实际日期
  const weekDates = useMemo(() => {
    if (!semesterStart) {
      // 学期未加载时用当前周的日期
      const today = new Date();
      const dayOfWeek = today.getDay() || 7; // 1=Mon...7=Sun
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek - 1));
      return weekdays.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    }
    const semStart = new Date(`${semesterStart}T00:00:00`);
    const mondayOffset = (currentWeek - 1) * 7;
    return weekdays.map((_, i) => {
      const d = new Date(semStart);
      d.setDate(d.getDate() + mondayOffset + i);
      return d;
    });
  }, [currentWeek, semesterStart]);

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
            isMine: !!teacherInfo?.subject && subject === teacherInfo.subject,
          },
        };
        return { ...cls, schedule: newSchedule };
      }),
    );
  }, [selectedClassId, teacherInfo]);

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

  // ====== 数据加载 ======

  // 初始加载：班级、学期、教师信息
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [clsList, semList, teacher] = await Promise.all([
          classApi.list(),
          semesterApi.list(),
          getTeacher(),
        ]);

        if (cancelled) return;

        if (teacher) setTeacherInfo(teacher);

        // 设置班级
        const mappedClasses = clsList.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setApiClasses(mappedClasses);
        if (clsList.length > 0 && !selectedClassId) {
          setSelectedClassId(String(clsList[0].id));
        }

        // 设置学期
        setSemesters(semList.map((s: any) => ({
          id: s.id,
          name: s.name,
          start_date: s.start_date,
          end_date: s.end_date,
          weeks_count: s.weeks_count,
          current_week: s.current_week,
          is_active: s.is_active,
        })));

        // 选择活跃学期
        const active = semList.find((s: any) => s.is_active);
        if (active) {
          setActiveSemesterId(active.id);
          // 设置当前周
          if (active.current_week) {
            setCurrentWeek(active.current_week);
          } else if (active.start_date) {
            setCurrentWeek(getWeekNumberInSemester(new Date(), active.start_date, active.weeks_count));
          }
        } else if (semList.length > 0) {
          setActiveSemesterId(semList[0].id);
        }

        // 初始化 classesData 壳（schedule 将由下一个 useEffect 填充）
        if (clsList.length > 0) {
          setClassesData(clsList.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            schedule: weekdays.reduce((acc, d) => { acc[d] = {}; return acc; }, {} as Record<string, Record<string, CourseInfo>>),
          })));
          if (!selectedClassId) {
            setSelectedClassId(String(clsList[0].id));
          }
        }
      } catch (err: any) {
        showFeedback({ title: '加载失败', tone: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 加载课程：当班级或学期变化时
  useEffect(() => {
    if (!selectedClassId || !activeSemesterId) return;
    let cancelled = false;
    (async () => {
      try {
        setCoursesLoading(true);
        const courses = await courseApi.list(activeSemesterId, Number(selectedClassId));
        if (cancelled) return;

        const schedule = mapCoursesToSchedule(courses, teacherInfo?.id ?? null);

        setClassesData((prev) => {
          // 如果班级已存在则更新，否则添加
          const exists = prev.find((c) => c.id === selectedClassId);
          if (exists) {
            return prev.map((c) => c.id === selectedClassId ? { ...c, schedule } : c);
          }
          return [...prev, { id: selectedClassId, name: selectedClassId, schedule }];
        });
      } catch (err: any) {
        showFeedback({ title: '课程加载失败', tone: 'error' });
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClassId, activeSemesterId, teacherInfo]);

  // 保存课程表到后端
  const handleSaveSchedule = useCallback(async () => {
    if (!selectedClassId || !activeSemesterId) return;
    const cls = classesData.find((c) => c.id === selectedClassId);
    if (!cls) return;

    const items: { weekday: number; period: number; subject: string }[] = [];
    for (const [dayLabel, daySchedule] of Object.entries(cls.schedule)) {
      const weekdayNum = WEEKDAY_LABEL_TO_NUM[dayLabel];
      if (!weekdayNum) continue;
      for (const [periodKey, course] of Object.entries(daySchedule)) {
        const periodNum = PERIOD_KEY_TO_NUM[periodKey];
        if (periodNum === undefined) continue;
        items.push({ weekday: weekdayNum, period: periodNum, subject: course.subject });
      }
    }

    try {
      await courseApi.batchCreate({
        class_id: Number(selectedClassId),
        semester_id: activeSemesterId,
        items,
      });
      showFeedback({ title: '课程表已保存', tone: 'success' });
    } catch (err: any) {
      showFeedback({ title: '保存失败', tone: 'error' });
    }
  }, [selectedClassId, activeSemesterId, classesData]);

  // 下载课程表模板
  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        ['节次', '周一', '周二', '周三', '周四', '周五'],
        ['早读', '语文', '英语', '语文', '英语', '语文'],
        ['第1节', '语文', '数学', '英语', '语文', '数学'],
        ['第2节', '数学', '英语', '语文', '数学', '英语'],
        ['第3节', '英语', '语文', '数学', '英语', '语文'],
        ['第4节', '体育', '音乐', '美术', '科学', '道法'],
        ['午阅', '', '', '', '', ''],
        ['第5节', '科学', '美术', '体育', '音乐', '科学'],
        ['第6节', '道法', '体育', '科学', '道法', '美术'],
        ['课后', '数学', '语文', '数学', '体育', '英语'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      ws['!cols'] = [{ wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '课程表');

      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, '课程表模板.xlsx');
        showFeedback({ title: '模板已下载', tone: 'success' });
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.cacheDirectory + '课程表模板.xlsx';
        await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
        try {
          const Sharing = require('expo-sharing');
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('模板已保存', `文件已保存到：${uri}`);
          }
        } catch {
          Alert.alert('模板已保存', `文件已保存到缓存目录，请使用文件管理器查看`);
        }
      }
    } catch (err: any) {
      showFeedback({ title: '生成模板失败', tone: 'error' });
    }
  };

  // 导入入口：选择下载模板或导入文件
  const handleImportEntry = () => {
    Alert.alert(
      'Excel 导入课程表',
      '表头格式：节次 | 周一 ~ 周五\n节次支持：早读、第1节~第6节、午阅、课后\n格子内填写科目名称，空格子表示没课',
      [
        { text: '取消', style: 'cancel' },
        { text: '下载模板', onPress: handleDownloadTemplate },
        { text: '选择文件', onPress: handleImportExcel },
      ],
    );
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
            isMine: !!teacherInfo?.subject && cellValue === teacherInfo.subject,
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
  const handleConfirmImport = async () => {
    if (!importPreview) return;

    // 更新本地状态
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== importTargetClassId) return cls;
        return { ...cls, schedule: importPreview };
      }),
    );
    setShowImportModal(false);
    setImportPreview(null);
    setSelectedClassId(importTargetClassId);

    // 保存到后端
    if (activeSemesterId) {
      const items: { weekday: number; period: number; subject: string }[] = [];
      for (const [dayLabel, daySchedule] of Object.entries(importPreview)) {
        const weekdayNum = WEEKDAY_LABEL_TO_NUM[dayLabel];
        if (!weekdayNum) continue;
        for (const [periodKey, course] of Object.entries(daySchedule)) {
          const periodNum = PERIOD_KEY_TO_NUM[periodKey];
          if (periodNum === undefined) continue;
          items.push({ weekday: weekdayNum, period: periodNum, subject: course.subject });
        }
      }
      try {
        await courseApi.batchCreate({
          class_id: Number(importTargetClassId),
          semester_id: activeSemesterId,
          items,
        });
        showFeedback({ title: '导入并保存成功', tone: 'success' });
      } catch {
        showFeedback({ title: '导入成功但保存到服务器失败', tone: 'warning' });
      }
    } else {
      showFeedback({ title: '导入成功', tone: 'success' });
    }
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
    () => semesterStart ? getWeekNumberInSemester(new Date(), semesterStart, totalWeeks) : 1,
    [totalWeeks, semesterStart],
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

  const calendarEvents: Record<string, { type: 'holiday' | 'exam' | 'event'; label: string }> = {};

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
      <PrimaryHeroSection paddingBottom={10}>
        <View style={styles.scheduleHeroHeader}>
          <View style={styles.scheduleHeroMain}>
            <View style={styles.scheduleHeroEyebrowWrap}>
              <Ionicons name="grid-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.scheduleHeroEyebrow}>课程表总览</Text>
            </View>
            <Text style={styles.scheduleHeroTitle}>{currentClass?.name ?? '加载中...'}</Text>
            <Text style={styles.scheduleHeroMeta}>{semesterStart || '--'} - {semesterEnd || '--'}</Text>
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
      </PrimaryHeroSection>

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
              onPress={() => { if (classesData.length > 1) setClassPickerOpen(true); }}
              activeOpacity={classesData.length > 1 ? 0.7 : 1}
            >
              <Ionicons name="school-outline" size={13} color="#FFFFFF" />
              <Text style={[styles.classTabText, { color: '#FFFFFF' }]}>
                {currentClass?.name ?? '选择班级'}
              </Text>
              {classesData.length > 1 && (
                <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
              )}
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.topActions}>
            {isEditing && (
              <TouchableOpacity style={[styles.importBtn, { borderColor: colors.primary }]} onPress={handleImportEntry} activeOpacity={0.7}>
                <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
                <Text style={[styles.importBtnText, { color: colors.primary }]}>导入</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: isEditing ? colors.primary : colors.surfaceSecondary }]}
              onPress={() => { if (isEditing) { handleSaveSchedule(); } setIsEditing(!isEditing); setFilterSubject(null); }}
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

      {/* 加载指示器 */}
      {(loading || coursesLoading) && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, gap: 8 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{loading ? '加载中...' : '课程加载中...'}</Text>
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
          <AppCard padding="sm" radius={14} style={styles.legend}>
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
          </AppCard>
        )}

        {/* 编辑模式提示 */}
        {isEditing && (
          <View style={[styles.editHint, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.editHintText, { color: colors.primary }]}>
              点击格子选择/更换科目，{teacherInfo?.subject ?? ''}课将自动标记为"我的课程"
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
                const isMySubject = !!teacherInfo?.subject && subject === teacherInfo.subject;
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
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{currentClass?.name ?? ''}</Text>
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
                  <AppButton label="关闭" onPress={() => setSelectedCourse(null)} style={styles.modalCloseBtn} />
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
                已自动识别 {myCoursesCount} 节{teacherInfo?.subject ?? ''}课为"我的课程"
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
  legend: { marginHorizontal: 12, marginTop: 12 },
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
  modalCloseBtn: { marginHorizontal: 20, marginBottom: 20, borderRadius: 10 },
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


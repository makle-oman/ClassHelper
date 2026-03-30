import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { ThemeProvider, useIsDark } from '../src/theme';
import { refreshReminders } from '../src/services/courseReminder';
import { ToastHost } from '../src/components/ToastHost';

// 当前老师今天的课程（后续从API获取，这里先硬编码）
const todayMyCourses = [
  { periodKey: '1', subject: '语文', className: '三年级2班' },
  { periodKey: '2', subject: '数学', className: '三年级2班' },
  { periodKey: '5', subject: '语文', className: '三年级1班' },
  { periodKey: 'after', subject: '语文', className: '三年级1班' },
];

function AppContent() {
  const isDark = useIsDark();

  // 启动时调度今天的课程提醒
  useEffect(() => {
    if (Platform.OS !== 'web') {
      refreshReminders(todayMyCourses);
    }
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="class-manage" />
        <Stack.Screen name="student/[id]" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="homework" />
        <Stack.Screen name="notices" />
        <Stack.Screen name="leave-approval" />
        <Stack.Screen name="semester" />
        <Stack.Screen name="promotion" />
      </Stack>
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

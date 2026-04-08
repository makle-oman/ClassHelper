import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { ThemeProvider, useIsDark } from '../src/theme';
import { refreshReminders } from '../src/services/courseReminder';
import { ToastHost } from '../src/components/ToastHost';
import { courseApi, getToken } from '../src/services/api';

function AppContent() {
  const isDark = useIsDark();

  // 启动时从API获取今日课程并调度提醒
  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const token = await getToken();
        if (!token) return;
        try {
          const courses = await courseApi.myToday();
          const mapped = courses.map(c => ({
            periodKey: c.period.toString(),
            subject: c.subject,
            className: c.classEntity?.name || '',
          }));
          refreshReminders(mapped);
        } catch {}
      })();
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

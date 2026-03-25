import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { House, Calendar, Users, ChartBar, User, type LucideIcon } from 'lucide-react-native';

const tabs: { name: string; title: string; icon: LucideIcon }[] = [
  { name: 'index', title: '首页', icon: House },
  { name: 'schedule', title: '课程表', icon: Calendar },
  { name: 'students', title: '学生', icon: Users },
  { name: 'scores', title: '成绩', icon: ChartBar },
  { name: 'profile', title: '我的', icon: User },
];

export default function TabsLayout() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 4 : 0);
  const tabBarHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingBottom: bottomInset,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => {
              const Icon = tab.icon;
              return <Icon size={20} color={color} strokeWidth={1.8} />;
            },
          }}
        />
      ))}
    </Tabs>
  );
}

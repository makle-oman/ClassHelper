import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IoniconsName; iconOutline: IoniconsName }[] = [
  { name: 'index', title: '首页', icon: 'home', iconOutline: 'home-outline' },
  { name: 'schedule', title: '课程表', icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'students', title: '学生', icon: 'people', iconOutline: 'people-outline' },
  { name: 'scores', title: '成绩', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
  { name: 'profile', title: '我的', icon: 'person', iconOutline: 'person-outline' },
];

const TAB_CONTENT_HEIGHT = 50;

export default function TabsLayout() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 4 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: TAB_CONTENT_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={20}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

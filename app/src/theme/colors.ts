type PaletteEntry = {
  bg: string;
  text: string;
};

type CourseColor = {
  bg: string;
  text: string;
};

type HolidayColors = {
  bg: string;
  text: string;
  border: string;
};

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  border: string;
  borderLight: string;
  divider: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  male: string;
  female: string;
  online: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  statusBar: 'light' | 'dark';
  card: string;
  cardShadow: string;
  courseColors: CourseColor[];
  holiday: HolidayColors;
  palette: {
    blue: PaletteEntry;
    green: PaletteEntry;
    orange: PaletteEntry;
    red: PaletteEntry;
    purple: PaletteEntry;
    cyan: PaletteEntry;
  };
}

export const lightColors: ThemeColors = {
  // 主色调 - 清新绿
  primary: '#4CC590',
  primaryLight: '#E8F8F0',
  primaryDark: '#3AAF7A',
  primaryGradientStart: '#4CC590',
  primaryGradientEnd: '#36B37E',

  // 背景
  background: '#F4F5F9',
  surface: '#FFFFFF',
  surfaceSecondary: '#F7F8FA',
  surfaceElevated: '#FFFFFF',

  // 文字
  text: '#1A1D26',
  textSecondary: '#5F6577',
  textTertiary: '#A0A5B8',
  textOnPrimary: '#FFFFFF',

  // 边框
  border: '#ECEDF1',
  borderLight: '#F2F3F7',
  divider: '#F0F1F5',

  // 语义色
  success: '#22C55E',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // 功能色
  male: '#3B82F6',
  female: '#EC4899',
  online: '#22C55E',

  // Tab Bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#ECEDF1',
  tabBarActive: '#4CC590',
  tabBarInactive: '#A0A5B8',

  // 状态栏
  statusBar: 'dark' as const,

  // 卡片
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.04)',

  // 课程表颜色（更柔和好看的配色）
  courseColors: [
    { bg: '#E8F4FD', text: '#2E86C1' },  // 天蓝 - 语文
    { bg: '#FDEAE4', text: '#D35E44' },  // 珊瑚 - 数学
    { bg: '#EDE7F6', text: '#7E57C2' },  // 薰衣草 - 英语
    { bg: '#E0F2E9', text: '#43A06D' },  // 薄荷 - 体育
    { bg: '#FFF4E0', text: '#D4911E' },  // 琥珀 - 音乐
    { bg: '#FCE4EC', text: '#C2457A' },  // 玫瑰 - 美术
    { bg: '#E0F7F5', text: '#0D9488' },  // 青瓷 - 科学
    { bg: '#F3E8FF', text: '#9333EA' },  // 紫罗兰 - 道法
  ],

  // 假期
  holiday: { bg: '#FFF1F0', text: '#FF6B6B', border: '#FFD4D4' },

  // 渐变色板
  palette: {
    blue: { bg: '#EBF0FF', text: '#3B6FED' },
    green: { bg: '#E8F8F0', text: '#4CC590' },
    orange: { bg: '#FFF7ED', text: '#EA580C' },
    red: { bg: '#FEF2F2', text: '#DC2626' },
    purple: { bg: '#F3F0FF', text: '#7C3AED' },
    cyan: { bg: '#ECFEFF', text: '#0891B2' },
  },
};

export const darkColors: ThemeColors = {
  primary: '#5DD9A3',
  primaryLight: '#1A2E25',
  primaryDark: '#4CC590',
  primaryGradientStart: '#5DD9A3',
  primaryGradientEnd: '#4CC590',

  background: '#0D0F14',
  surface: '#161923',
  surfaceSecondary: '#1C2030',
  surfaceElevated: '#1E2235',

  text: '#E8EAF0',
  textSecondary: '#8B90A5',
  textTertiary: '#5A5F75',
  textOnPrimary: '#FFFFFF',

  border: '#252A3A',
  borderLight: '#1E2235',
  divider: '#1E2235',

  success: '#34D399',
  successLight: '#0D2818',
  warning: '#FBBF24',
  warningLight: '#2A2008',
  error: '#F87171',
  errorLight: '#2A0D0D',
  info: '#60A5FA',
  infoLight: '#0D1A2A',

  male: '#60A5FA',
  female: '#F472B6',
  online: '#34D399',

  tabBar: '#161923',
  tabBarBorder: '#252A3A',
  tabBarActive: '#5DD9A3',
  tabBarInactive: '#5A5F75',

  statusBar: 'light' as const,

  card: '#161923',
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  courseColors: [
    { bg: '#1A2A38', text: '#5BB5E8' },  // 天蓝
    { bg: '#2E1A18', text: '#E88A72' },  // 珊瑚
    { bg: '#221A30', text: '#A78BFA' },  // 薰衣草
    { bg: '#1A2E22', text: '#5DD9A3' },  // 薄荷
    { bg: '#2E2810', text: '#F0C554' },  // 琥珀
    { bg: '#2E1A25', text: '#F472B6' },  // 玫瑰
    { bg: '#1A2E2C', text: '#2DD4BF' },  // 青瓷
    { bg: '#251A35', text: '#C084FC' },  // 紫罗兰
  ],

  holiday: { bg: '#2A1515', text: '#FF6B6B', border: '#3A2020' },

  palette: {
    blue: { bg: '#1E2A4A', text: '#5B8BF5' },
    green: { bg: '#1A2E25', text: '#5DD9A3' },
    orange: { bg: '#2A1A08', text: '#FB923C' },
    red: { bg: '#2A0D0D', text: '#F87171' },
    purple: { bg: '#1E1535', text: '#A78BFA' },
    cyan: { bg: '#0D2A2E', text: '#22D3EE' },
  },
};

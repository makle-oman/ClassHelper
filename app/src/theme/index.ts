import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ThemeColors } from './colors';

export function useTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}

export { lightColors, darkColors, type ThemeColors };

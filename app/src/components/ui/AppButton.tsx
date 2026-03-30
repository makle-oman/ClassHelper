import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
type AppButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
type AppButtonTone = 'primary' | 'success' | 'error' | 'info';
type AppButtonSize = 'md' | 'lg';

interface AppButtonProps {
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  leftIconName?: IoniconsName;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  tone?: AppButtonTone;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
}

function getToneColor(tone: AppButtonTone, colors: ReturnType<typeof useTheme>): string {
  switch (tone) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.error;
    case 'info':
      return colors.info;
    default:
      return colors.primary;
  }
}

function getSoftBackground(tone: AppButtonTone, colors: ReturnType<typeof useTheme>): string {
  switch (tone) {
    case 'success':
      return colors.successLight;
    case 'error':
      return colors.errorLight;
    case 'info':
      return colors.infoLight;
    default:
      return colors.primaryLight;
  }
}

const heightMap: Record<AppButtonSize, number> = {
  md: 44,
  lg: 48,
};

export function AppButton({
  disabled = false,
  fullWidth = true,
  label,
  leftIconName,
  loading = false,
  onPress,
  size = 'lg',
  style,
  textStyle,
  tone = 'primary',
  variant = 'solid',
}: AppButtonProps) {
  const colors = useTheme();
  const accentColor = getToneColor(tone, colors);
  const softBackground = getSoftBackground(tone, colors);
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'solid'
      ? accentColor
      : variant === 'soft'
        ? softBackground
        : 'transparent';
  const borderColor = variant === 'outline' ? accentColor : 'transparent';
  const textColor = variant === 'solid' ? colors.textOnPrimary : accentColor;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          height: heightMap[size],
          opacity: isDisabled ? 0.55 : pressed ? 0.84 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : leftIconName ? (
          <Ionicons name={leftIconName} size={18} color={textColor} />
        ) : null}
        <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});

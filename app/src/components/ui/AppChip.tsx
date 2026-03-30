import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface AppChipProps {
  iconName?: IoniconsName;
  label: string;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppChip({
  iconName,
  label,
  onPress,
  selected = false,
  style,
  textStyle,
}: AppChipProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={14}
          color={selected ? colors.textOnPrimary : colors.textSecondary}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: selected ? colors.textOnPrimary : colors.textSecondary },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});

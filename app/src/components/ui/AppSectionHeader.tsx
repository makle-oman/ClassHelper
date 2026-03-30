import { TouchableOpacity, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface AppSectionHeaderProps {
  actionLabel?: string;
  count?: number;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
}

export function AppSectionHeader({
  actionLabel,
  count,
  onActionPress,
  style,
  title,
}: AppSectionHeaderProps) {
  const colors = useTheme();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {typeof count === 'number' ? (
          <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
          </View>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <TouchableOpacity activeOpacity={0.75} onPress={onActionPress}>
          <Text style={[styles.action, { color: colors.textTertiary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    fontSize: 12,
    fontWeight: '600',
  },
  countBadge: {
    borderRadius: 999,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

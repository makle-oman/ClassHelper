import { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type AppCardVariant = 'surface' | 'secondary' | 'transparent';
type AppCardPadding = 'none' | 'sm' | 'md' | 'lg';

interface AppCardProps extends PropsWithChildren {
  elevated?: boolean;
  padding?: AppCardPadding;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  variant?: AppCardVariant;
}

const paddingMap: Record<AppCardPadding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
};

export function AppCard({
  children,
  elevated = false,
  padding = 'md',
  radius = 20,
  style,
  variant = 'surface',
}: AppCardProps) {
  const colors = useTheme();

  const backgroundColor =
    variant === 'surface'
      ? colors.surface
      : variant === 'secondary'
        ? colors.surfaceSecondary
        : 'transparent';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: variant === 'transparent' ? 'transparent' : colors.border,
          borderRadius: radius,
          padding: paddingMap[padding],
          shadowColor: colors.cardShadow,
        },
        elevated ? styles.elevated : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  elevated: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
});

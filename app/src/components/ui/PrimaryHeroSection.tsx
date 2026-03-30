import { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface PrimaryHeroSectionProps extends PropsWithChildren {
  bottomRadius?: number;
  contentStyle?: StyleProp<ViewStyle>;
  paddingBottom?: number;
  paddingHorizontal?: number;
  paddingTop?: number;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryHeroSection({
  bottomRadius = 24,
  children,
  contentStyle,
  paddingBottom = 24,
  paddingHorizontal = 16,
  paddingTop = 12,
  style,
}: PrimaryHeroSectionProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: colors.primary,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
          paddingBottom,
          paddingHorizontal,
          paddingTop,
        },
        style,
      ]}
    >
      <View style={[styles.decorLarge, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
      <View style={[styles.decorSmall, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  decorLarge: {
    borderRadius: 100,
    height: 200,
    position: 'absolute',
    right: -50,
    top: -80,
    width: 200,
  },
  decorSmall: {
    borderRadius: 60,
    bottom: -20,
    height: 120,
    left: -30,
    position: 'absolute',
    width: 120,
  },
  shell: {
    overflow: 'hidden',
  },
});

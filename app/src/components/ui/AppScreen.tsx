import { type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface AppScreenProps extends PropsWithChildren {
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  keyboardAware?: boolean;
  keyboardOffset?: number;
  scrollable?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
  style?: StyleProp<ViewStyle>;
}

export function AppScreen({
  backgroundColor,
  children,
  contentContainerStyle,
  edges = ['top'],
  keyboardAware = false,
  keyboardOffset = 0,
  scrollable = false,
  scrollViewProps,
  style,
}: AppScreenProps) {
  const colors = useTheme();
  const resolvedBackgroundColor = backgroundColor ?? colors.background;

  const content = scrollable ? (
    <ScrollView
      {...scrollViewProps}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentContainerStyle]}>{children}</View>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: resolvedBackgroundColor }, style]} edges={edges}>
      {wrappedContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

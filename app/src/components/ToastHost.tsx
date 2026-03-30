import { Ionicons } from '@expo/vector-icons';
import {
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeFeedback, type ActiveFeedbackNotice } from '../services/feedback';
import { useTheme } from '../theme';

type ToastToneConfig = {
  accent: string;
  accentSoft: string;
  label: string;
  iconName: ComponentProps<typeof Ionicons>['name'];
};

function runToastExitAnimation({
  entrance,
  noticeId,
  clearTimer,
  setNotice,
}: {
  entrance: Animated.Value;
  noticeId: number;
  clearTimer: () => void;
  setNotice: Dispatch<SetStateAction<ActiveFeedbackNotice | null>>;
}): void {
  clearTimer();

  Animated.timing(entrance, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (!finished) return;
    setNotice((current) => (current?.id !== noticeId ? current : null));
  });
}

function getToastToneConfig(
  tone: ActiveFeedbackNotice['tone'],
  colors: ReturnType<typeof useTheme>,
): ToastToneConfig {
  switch (tone) {
    case 'success':
      return {
        accent: colors.success,
        accentSoft: colors.successLight,
        label: '成功',
        iconName: 'checkmark-circle',
      };
    case 'error':
      return {
        accent: colors.error,
        accentSoft: colors.errorLight,
        label: '错误',
        iconName: 'close-circle',
      };
    case 'warning':
      return {
        accent: colors.warning,
        accentSoft: colors.warningLight,
        label: '注意',
        iconName: 'warning',
      };
    default:
      return {
        accent: colors.info,
        accentSoft: colors.infoLight,
        label: '提示',
        iconName: 'information-circle',
      };
  }
}

export function ToastHost() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<ActiveFeedbackNotice | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (!hideTimerRef.current) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  };

  useEffect(() => subscribeFeedback((next) => setNotice(next)), []);
  useEffect(() => () => clearHideTimer(), []);

  useEffect(() => {
    if (!notice) return;

    clearHideTimer();
    entrance.stopAnimation();
    entrance.setValue(0);
    progress.setValue(1);

    Animated.spring(entrance, {
      toValue: 1,
      damping: 18,
      stiffness: 200,
      mass: 0.9,
      useNativeDriver: true,
    }).start();

    // 倒计时进度条
    Animated.timing(progress, {
      toValue: 0,
      duration: notice.durationMs,
      useNativeDriver: false,
    }).start();

    hideTimerRef.current = setTimeout(() => {
      runToastExitAnimation({
        entrance,
        noticeId: notice.id,
        clearTimer: clearHideTimer,
        setNotice,
      });
    }, notice.durationMs);

    return () => clearHideTimer();
  }, [entrance, progress, notice]);

  const toastTone = useMemo(() => {
    if (!notice) return null;
    return getToastToneConfig(notice.tone, colors);
  }, [colors, notice]);

  if (!notice || !toastTone) return null;

  const isGenericTitle =
    notice.title.trim() === toastTone.label ||
    notice.title.trim() === '提示' ||
    notice.title.trim() === '成功' ||
    notice.title.trim() === '失败' ||
    notice.title.trim() === '注意';
  const headline = notice.message && isGenericTitle ? notice.message : notice.title;
  const detail = notice.message && !isGenericTitle ? notice.message : undefined;

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });
  const scale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        { top: (Platform.OS === 'web' ? 16 : 8) + insets.top },
      ]}
    >
      <Animated.View
        style={[
          styles.toastShell,
          {
            opacity: entrance,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={headline}
          onPress={() =>
            runToastExitAnimation({
              entrance,
              noticeId: notice.id,
              clearTimer: clearHideTimer,
              setNotice,
            })
          }
          style={[
            styles.toast,
            {
              backgroundColor: colors.surfaceElevated,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {/* 左侧色条 */}
          <View style={[styles.accentBar, { backgroundColor: toastTone.accent }]} />

          <View style={styles.contentRow}>
            <View style={[styles.iconWrap, { backgroundColor: toastTone.accentSoft }]}>
              <Ionicons name={toastTone.iconName} size={18} color={toastTone.accent} />
            </View>

            <View style={styles.copyBlock}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={detail ? 1 : 2}>
                {headline}
              </Text>
              {detail ? (
                <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                  {detail}
                </Text>
              ) : null}
            </View>

            <Ionicons name="close" size={16} color={colors.textTertiary} style={styles.closeIcon} />
          </View>

          {/* 底部进度条 */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: toastTone.accent,
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 999,
  },
  toastShell: {
    width: '100%',
    maxWidth: 420,
  },
  toast: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  message: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  closeIcon: {
    padding: 4,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
});

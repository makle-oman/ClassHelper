import { type ComponentProps, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  containerStyle?: StyleProp<ViewStyle>;
  errorText?: string;
  helperText?: string;
  iconName?: IoniconsName;
  inputStyle?: StyleProp<TextStyle>;
  label?: string;
}

export function AppInput({
  containerStyle,
  editable = true,
  errorText,
  helperText,
  iconName,
  inputStyle,
  label,
  secureTextEntry = false,
  ...textInputProps
}: AppInputProps) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const showSecureToggle = secureTextEntry;
  const resolvedBorderColor = errorText
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;
  const iconColor = focused ? colors.primary : colors.textTertiary;

  return (
    <View style={containerStyle}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}

      <View
        style={[
          styles.shell,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: resolvedBorderColor,
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        {iconName ? <Ionicons name={iconName} size={18} color={iconColor} /> : null}

        <TextInput
          {...textInputProps}
          editable={editable}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={showSecureToggle ? !passwordVisible : secureTextEntry}
          style={[styles.input, { color: colors.text }, inputStyle]}
          onFocus={(event) => {
            setFocused(true);
            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            textInputProps.onBlur?.(event);
          }}
        />

        {showSecureToggle ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setPasswordVisible((current) => !current)}
            style={styles.toggle}
          >
            <Ionicons
              name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.textTertiary}
            />
          </Pressable>
        ) : null}
      </View>

      {errorText ? (
        <Text style={[styles.helper, { color: colors.error }]}>{errorText}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: colors.textTertiary }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  helper: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  shell: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  toggle: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
});

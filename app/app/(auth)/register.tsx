import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';

export default function RegisterScreen() {
  const colors = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleRegister = () => {
    // TODO: 调用注册接口
    router.replace('/(tabs)');
  };

  const renderInput = (
    icon: React.ComponentProps<typeof Ionicons>['name'],
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    field: string,
    options?: {
      keyboardType?: 'phone-pad' | 'default';
      maxLength?: number;
      secureTextEntry?: boolean;
    }
  ) => (
    <View style={styles.inputWrapper}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: focusedField === field ? colors.primary : colors.border,
            borderWidth: focusedField === field ? 1.5 : 1,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={focusedField === field ? colors.primary : colors.textTertiary}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField('')}
          keyboardType={options?.keyboardType || 'default'}
          maxLength={options?.maxLength}
          secureTextEntry={options?.secureTextEntry && !showPassword}
        />
        {options?.secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部装饰 */}
        <View style={[styles.topDecoration, { backgroundColor: colors.primary }]}>
          <View style={[styles.decorCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[styles.decorCircle2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="person-add" size={32} color="#FFF" />
            </View>
            <Text style={styles.logoTitle}>创建账号</Text>
            <Text style={styles.logoSubtitle}>注册成为 ClassHelper 教师用户</Text>
          </View>
        </View>

        {/* 注册表单 */}
        <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>教师注册</Text>
          <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
            请填写以下信息完成注册
          </Text>

          {renderInput('person-outline', '请输入您的姓名', name, setName, 'name')}
          {renderInput('phone-portrait-outline', '请输入手机号', phone, setPhone, 'phone', {
            keyboardType: 'phone-pad',
            maxLength: 11,
          })}
          {renderInput('lock-closed-outline', '请设置密码（至少6位）', password, setPassword, 'password', {
            secureTextEntry: true,
          })}
          {renderInput('shield-checkmark-outline', '请再次输入密码', confirmPassword, setConfirmPassword, 'confirm', {
            secureTextEntry: true,
          })}

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.registerButtonText}>注册</Text>
          </TouchableOpacity>

          {/* 登录 */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              已有账号？
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>立即登录</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topDecoration: {
    height: 240,
    justifyContent: 'flex-end',
    paddingBottom: 50,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: 60,
    left: -40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
  formContainer: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 28,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  registerButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#4CC590',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

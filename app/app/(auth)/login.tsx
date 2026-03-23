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
  Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const colors = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = () => {
    // TODO: 调用登录接口，目前直接跳转到主页
    router.replace('/(tabs)');
  };

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
              <Ionicons name="school" size={36} color="#FFF" />
            </View>
            <Text style={styles.logoTitle}>ClassHelper</Text>
            <Text style={styles.logoSubtitle}>教师助手 · 让教学管理更轻松</Text>
          </View>
        </View>

        {/* 登录表单 */}
        <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>欢迎回来</Text>
          <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
            登录您的教师账号
          </Text>

          {/* 手机号 */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: phoneFocused ? colors.primary : colors.border,
                  borderWidth: phoneFocused ? 1.5 : 1,
                },
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={phoneFocused ? colors.primary : colors.textTertiary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="请输入手机号"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>
          </View>

          {/* 密码 */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: passwordFocused ? colors.primary : colors.border,
                  borderWidth: passwordFocused ? 1.5 : 1,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? colors.primary : colors.textTertiary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="请输入密码"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
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
            </View>
          </View>

          {/* 忘记密码 */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>忘记密码？</Text>
          </TouchableOpacity>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>登录</Text>
          </TouchableOpacity>

          {/* 注册 */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              还没有账号？
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>立即注册</Text>
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
    height: 280,
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
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 16,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CC590',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
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

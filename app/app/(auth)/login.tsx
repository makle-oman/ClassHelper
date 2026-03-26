import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { authApi, saveAuth } from '../../src/services/api';

export default function LoginScreen() {
  const colors = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('提示', '请输入手机号和密码');
      return;
    }
    setLoading(true);
    try {
      const { token, teacher } = await authApi.login(phone.trim(), password);
      await saveAuth(token, teacher);
      router.replace('/(tabs)');
    } catch {
      // request 函数已自动弹窗，这里只需恢复 loading
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <View style={styles.brandBadge}>
            <Ionicons name="school" size={16} color="#FFF" />
            <Text style={styles.brandBadgeText}>ClassHelper</Text>
          </View>
          <Text style={styles.heroTitle}>欢迎回来</Text>
          <Text style={styles.heroSubtitle}>登录后即可查看班级动态和今日课程安排</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface }]}> 
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>手机号</Text>
            <View
              style={[
                styles.inputShell,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: focusedField === 'phone' ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons name="phone-portrait-outline" size={18} color={focusedField === 'phone' ? colors.primary : colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="请输入手机号"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>密码</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert('提示', '找回密码功能暂未开放，请联系学校管理员重置密码。')}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>忘记密码？</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputShell,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: focusedField === 'password' ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? colors.primary : colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="请输入密码"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
              />
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPassword((prev) => !prev)}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} activeOpacity={0.82} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryButtonText}>登录</Text>}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>还没有账号？</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>立即注册</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  heroDecorLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -80,
    right: -40,
  },
  heroDecorSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    bottom: -20,
    left: -20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  brandBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 16 },
  heroSubtitle: { color: 'rgba(255,255,255,0.84)', fontSize: 13, lineHeight: 20, marginTop: 8, paddingRight: 24 },
  formCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 26,
    marginTop: -22,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 9 },
  passwordLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  forgotText: { fontSize: 12, fontWeight: '600' },
  inputShell: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14, height: '100%' },
  primaryButton: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
});

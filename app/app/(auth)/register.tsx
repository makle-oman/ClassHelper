import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('提示', '请完整填写注册信息');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }
    router.replace('/(tabs)');
  };

  const renderInput = (
    icon: React.ComponentProps<typeof Ionicons>['name'],
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    field: string,
    options?: {
      keyboardType?: 'phone-pad' | 'default';
      maxLength?: number;
      secure?: boolean;
    }
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: focusedField === field ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={focusedField === field ? colors.primary : colors.textTertiary} />
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
          secureTextEntry={options?.secure ? !showPassword : false}
        />
        {options?.secure ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <View style={styles.brandBadge}>
            <Ionicons name="person-add" size={16} color="#FFF" />
            <Text style={styles.brandBadgeText}>创建教师账号</Text>
          </View>
          <Text style={styles.heroTitle}>教师注册</Text>
          <Text style={styles.heroSubtitle}>注册后可创建班级、管理学生和安排课程</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface }]}> 
          {renderInput('person-outline', '姓名', '请输入姓名', name, setName, 'name')}
          {renderInput('phone-portrait-outline', '手机号', '请输入手机号', phone, setPhone, 'phone', { keyboardType: 'phone-pad', maxLength: 11 })}
          {renderInput('lock-closed-outline', '密码', '请设置密码', password, setPassword, 'password', { secure: true })}
          {renderInput('shield-checkmark-outline', '确认密码', '请再次输入密码', confirmPassword, setConfirmPassword, 'confirm', { secure: true })}

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} activeOpacity={0.82} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>注册</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>已有账号？</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>立即登录</Text>
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
    paddingTop: 18,
    paddingBottom: 38,
    overflow: 'hidden',
  },
  heroDecorLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -84,
    right: -36,
  },
  heroDecorSmall: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    bottom: -16,
    left: -18,
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
    paddingBottom: 20,
    marginTop: -22,
  },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputShell: {
    height: 46,
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
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
});

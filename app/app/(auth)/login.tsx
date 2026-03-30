import { useState } from 'react';
import { Link, router } from 'expo-router';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { authApi, saveAuth } from '../../src/services/api';
import { showFeedback } from '../../src/services/feedback';
import { useTheme } from '../../src/theme';
import { AppButton, AppCard, AppInput, AppScreen, FeatureHero } from '../../src/components/ui';

export default function LoginScreen() {
  const colors = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      showFeedback({
        title: '提示',
        message: '请输入手机号和密码',
        tone: 'info',
      });
      return;
    }

    setLoading(true);

    try {
      const { token, teacher } = await authApi.login(phone.trim(), password);
      await saveAuth(token, teacher);
      showFeedback({
        title: '登录成功',
        message: `欢迎回来，${teacher.name?.trim() || '老师'}`,
        tone: 'success',
      });
      router.replace('/(tabs)');
    } catch {
      // request 已统一处理错误提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen
      backgroundColor={colors.surface}
      contentContainerStyle={styles.content}
      edges={['top']}
      keyboardAware
      scrollable
    >
      <FeatureHero
        badgeLabel="ClassHelper"
        iconName="school"
        title="欢迎回来"
        subtitle="登录后即可查看班级动态和今日课程安排"
      />

      <AppCard
        padding="lg"
        radius={28}
        style={[styles.formCard, { borderColor: colors.surface }]}
      >
        <AppInput
          autoCapitalize="none"
          iconName="phone-portrait-outline"
          keyboardType="phone-pad"
          label="手机号"
          maxLength={11}
          placeholder="请输入手机号"
          value={phone}
          onChangeText={setPhone}
        />

        <View style={styles.fieldGap} />

        <View style={styles.passwordLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>密码</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              showFeedback({
                title: '提示',
                message: '找回密码功能暂未开放，请联系学校管理员重置密码。',
                tone: 'info',
              })
            }
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>忘记密码？</Text>
          </TouchableOpacity>
        </View>
        <AppInput
          iconName="lock-closed-outline"
          placeholder="请输入密码"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <AppButton
          label="登录"
          loading={loading}
          onPress={handleLogin}
          style={styles.primaryButton}
        />

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>还没有账号？</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>立即注册</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  fieldGap: {
    height: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
  },
  passwordLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 22,
  },
});

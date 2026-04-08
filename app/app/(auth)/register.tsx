import { useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authApi, saveAuth } from '../../src/services/api';
import { showFeedback } from '../../src/services/feedback';
import { useTheme } from '../../src/theme';
import {
  AppButton,
  AppCard,
  AppChip,
  AppInput,
  AppScreen,
  FeatureHero,
} from '../../src/components/ui';

const ALL_SUBJECTS = ['语文', '数学', '英语', '体育', '音乐', '美术', '科学', '道德与法治'];

export default function RegisterScreen() {
  const colors = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (subject: string) => {
    setSubjects((previous) =>
      previous.includes(subject)
        ? previous.filter((item) => item !== subject)
        : [...previous, subject],
    );
  };

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      showFeedback({
        title: '提示',
        message: '请完整填写注册信息',
        tone: 'info',
      });
      return;
    }

    if (password !== confirmPassword) {
      showFeedback({
        title: '提示',
        message: '两次输入的密码不一致',
        tone: 'info',
      });
      return;
    }

    if (subjects.length === 0) {
      showFeedback({
        title: '提示',
        message: '请至少选择一个授课科目',
        tone: 'info',
      });
      return;
    }

    setLoading(true);

    try {
      const { token, teacher } = await authApi.register(phone.trim(), password, name.trim(), subjects.join(','));
      await saveAuth(token, teacher);
      showFeedback({
        title: '注册成功',
        message: '账号已创建并自动登录',
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
        badgeLabel="创建教师账号"
        iconName="person-add"
        title="教师注册"
        subtitle="注册后可创建班级、管理学生和安排课程"
      />

      <AppCard
        padding="lg"
        radius={28}
        style={[styles.formCard, { borderColor: colors.surface }]}
      >
        <AppInput
          iconName="person-outline"
          label="姓名"
          placeholder="请输入姓名"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.fieldGap} />

        <AppInput
          iconName="phone-portrait-outline"
          keyboardType="phone-pad"
          label="手机号"
          maxLength={11}
          placeholder="请输入手机号"
          value={phone}
          onChangeText={setPhone}
        />

        <View style={styles.fieldGap} />

        <AppInput
          iconName="lock-closed-outline"
          label="密码"
          placeholder="请设置密码"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.fieldGap} />

        <AppInput
          iconName="shield-checkmark-outline"
          label="确认密码"
          placeholder="请再次输入密码"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.subjectSection}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>授课科目</Text>
          <Text style={[styles.subjectHint, { color: colors.textTertiary }]}>可多选，注册后也可在个人资料中修改</Text>
          <View style={styles.subjectWrap}>
            {ALL_SUBJECTS.map((subject) => {
              const selected = subjects.includes(subject);

              return (
                <AppChip
                  key={subject}
                  iconName={selected ? 'checkmark' : undefined}
                  label={subject}
                  selected={selected}
                  style={styles.subjectChip}
                  onPress={() => toggleSubject(subject)}
                />
              );
            })}
          </View>
        </View>

        <AppButton
          label="注册"
          loading={loading}
          onPress={handleRegister}
          style={styles.primaryButton}
        />

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>已有账号？</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>立即登录</Text>
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
    height: 12,
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
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
  },
  formCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
  },
  primaryButton: {
    marginTop: 22,
  },
  subjectChip: {
    marginBottom: 8,
  },
  subjectHint: {
    fontSize: 11,
    marginBottom: 10,
    marginTop: 4,
  },
  subjectSection: {
    marginTop: 16,
  },
  subjectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { PrimaryHeroSection } from '../src/components/ui/PrimaryHeroSection';
import { AppCard } from '../src/components/ui/AppCard';
import { AppInput } from '../src/components/ui/AppInput';
import { AppButton } from '../src/components/ui/AppButton';

export default function ChangePasswordScreen() {
  const colors = useTheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (!oldPassword.trim()) {
      Alert.alert('提示', '请输入旧密码');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '新密码至少需要 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的新密码不一致');
      return;
    }

    Alert.alert('修改成功', '密码已更新，请使用新密码继续登录。', [{ text: '确定', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <PrimaryHeroSection paddingBottom={10}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>修改密码</Text>
            <Text style={styles.navSubtitle}>账号安全</Text>
          </View>
          <View style={styles.navGhost} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroEyebrowWrap}>
              <Ionicons name="lock-closed-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroEyebrow}>密码管理</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>更新登录密码</Text>
          <Text style={styles.heroMeta}>建议使用字母和数字组合，提升账号安全性</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '最低位数', value: '6 位' },
              { label: '密码强度', value: newPassword.length >= 6 ? '达标' : '未达标' },
              { label: '状态', value: '待修改' },
            ].map((item) => (
              <View key={item.label} style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
                <Text style={styles.heroStatValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </PrimaryHeroSection>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>密码信息</Text>
        </View>
        <AppCard style={styles.cardSpacing}>
          <AppInput
            label="旧密码"
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="请输入当前密码"
            secureTextEntry
            autoCapitalize="none"
            containerStyle={styles.fieldGroup}
          />
          <AppInput
            label="新密码"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="请输入新密码（至少 6 位）"
            secureTextEntry
            autoCapitalize="none"
            containerStyle={styles.fieldGroup}
          />
          <AppInput
            label="确认密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="请再次输入新密码"
            secureTextEntry
            autoCapitalize="none"
          />
        </AppCard>

        <AppCard style={styles.tipCard}>
          <View style={styles.tipRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.tipText, { color: colors.textTertiary }]}>密码修改成功后需使用新密码重新登录。</Text>
          </View>
        </AppCard>

        <AppButton label="确认修改" onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28 },
  navBar: { flexDirection: 'row', alignItems: 'center' },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  navCenter: { flex: 1, marginLeft: 10 },
  navGhost: { width: 36, height: 36 },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  navSubtitle: { marginTop: 1, fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  heroCard: { paddingTop: 8 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroEyebrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  heroTitle: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  heroMeta: { marginTop: 3, fontSize: 12, lineHeight: 15, color: 'rgba(255,255,255,0.78)' },
  heroStatsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  heroStatChip: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroStatLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 11, fontWeight: '600' },
  heroStatValue: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  sectionRow: { marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  cardSpacing: { marginBottom: 12 },
  fieldGroup: { marginBottom: 14 },
  tipCard: { marginBottom: 24 },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

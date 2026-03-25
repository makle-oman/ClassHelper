import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

export default function ChangePasswordScreen() {
  const colors = useTheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const renderPasswordField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    visible: boolean,
    onToggle: () => void,
    placeholder: string
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.passwordField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}> 
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <TouchableOpacity activeOpacity={0.75} onPress={onToggle}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topSection, { backgroundColor: colors.primary }]}>
        <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>密码信息</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {renderPasswordField('旧密码', oldPassword, setOldPassword, showOld, () => setShowOld((prev) => !prev), '请输入当前密码')}
          {renderPasswordField('新密码', newPassword, setNewPassword, showNew, () => setShowNew((prev) => !prev), '请输入新密码（至少 6 位）')}
          {renderPasswordField('确认密码', confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm((prev) => !prev), '请再次输入新密码')}
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.tipText, { color: colors.textTertiary }]}>密码修改成功后需使用新密码重新登录。</Text>
        </View>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} activeOpacity={0.82} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>确认修改</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28 },
  // === Top Section (unified green hero) ===
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroDecorLarge: { position: 'absolute', width: 138, height: 138, borderRadius: 69, top: -42, right: -12 },
  heroDecorSmall: { position: 'absolute', width: 76, height: 76, borderRadius: 38, bottom: -20, left: -14 },
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
  // === Content ===
  sectionRow: { marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  card: { borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  passwordField: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1, fontSize: 14 },
  tipCard: { flexDirection: 'row', gap: 8, borderRadius: 18, padding: 14, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submitButton: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

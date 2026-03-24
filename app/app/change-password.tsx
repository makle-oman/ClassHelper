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
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.surfaceSecondary }]} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>修改密码</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}> 
          <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <Text style={styles.heroEyebrow}>账号安全</Text>
          <Text style={styles.heroTitle}>更新登录密码</Text>
          <Text style={styles.heroSubtitle}>把密码修改页做得更清晰，后续接真实账号体系时也更容易沿用这套结构。</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>密码信息</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>建议使用字母和数字组合，提升账号安全性</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          {renderPasswordField('旧密码', oldPassword, setOldPassword, showOld, () => setShowOld((prev) => !prev), '请输入当前密码')}
          {renderPasswordField('新密码', newPassword, setNewPassword, showNew, () => setShowNew((prev) => !prev), '请输入新密码（至少 6 位）')}
          {renderPasswordField('确认密码', confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm((prev) => !prev), '请再次输入新密码')}
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.surface }]}> 
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.tipText, { color: colors.textTertiary }]}>密码修改成功后，后续可以在登录页配合真实接口完成重新认证和安全校验。</Text>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  navButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navSpacer: { width: 40, height: 40 },
  navTitle: { fontSize: 17, fontWeight: '700' },
  heroCard: { borderRadius: 24, padding: 20, overflow: 'hidden', marginBottom: 16 },
  heroDecorLarge: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -92, right: -36 },
  heroDecorSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, bottom: -22, right: 42 },
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 8 },
  heroSubtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 13, lineHeight: 20, marginTop: 10 },
  sectionRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12, marginTop: 4 },
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

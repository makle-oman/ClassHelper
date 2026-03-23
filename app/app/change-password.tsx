import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
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
      Alert.alert('提示', '新密码至少需要6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的新密码不一致');
      return;
    }
    // TODO: 后续对接后端 API
    Alert.alert('修改成功', '密码已更新，请使用新密码登录', [
      { text: '确定', onPress: () => router.back() },
    ]);
  };

  const renderPasswordField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string
  ) => (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.fieldInput, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={toggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>修改密码</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>请输入密码信息</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {renderPasswordField('旧密码', oldPassword, setOldPassword, showOld, () => setShowOld(!showOld), '请输入当前密码')}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          {renderPasswordField('新密码', newPassword, setNewPassword, showNew, () => setShowNew(!showNew), '请输入新密码（至少6位）')}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          {renderPasswordField('确认密码', confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm), '请再次输入新密码')}
        </View>

        <View style={styles.tipSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.tipText, { color: colors.textTertiary }]}>
            密码长度至少6位，建议包含字母和数字组合。
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.submitBtnText}>确认修改</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navTitle: { fontSize: 17, fontWeight: '700' },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '500' },
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: { fontSize: 15, fontWeight: '500', width: 70 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    textAlign: 'right',
    paddingVertical: 0,
  },
  divider: { height: 0.5, marginLeft: 16 },
  tipSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  tipText: { fontSize: 12, flex: 1, lineHeight: 18 },
  submitBtn: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

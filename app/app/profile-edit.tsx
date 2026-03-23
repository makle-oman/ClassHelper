import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

const ALL_SUBJECTS = ['语文', '数学', '英语', '体育', '音乐', '美术', '科学', '道德与法治'];

export default function ProfileEditScreen() {
  const colors = useTheme();
  const [name, setName] = useState('王老师');
  const [phone, setPhone] = useState('13888888888');
  const [subjects, setSubjects] = useState<string[]>(['语文', '数学']);
  const [avatarLetter, setAvatarLetter] = useState('王');

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handlePickAvatar = () => {
    // TODO: 对接 expo-image-picker
    Alert.alert('提示', '头像上传功能将在后续版本中开放');
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (subjects.length === 0) {
      Alert.alert('提示', '请至少选择一个教授科目');
      return;
    }
    // TODO: 后续对接后端 API
    Alert.alert('保存成功', '个人信息已更新', [
      { text: '确定', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>编辑资料</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 头像 */}
        <TouchableOpacity style={styles.avatarSection} onPress={handlePickAvatar} activeOpacity={0.7}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={[styles.cameraIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="camera" size={14} color={colors.textSecondary} />
          </View>
          <Text style={[styles.changeAvatarText, { color: colors.textSecondary }]}>点击更换头像</Text>
        </TouchableOpacity>

        {/* 基本信息 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>基本信息</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>姓名</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (text.trim()) setAvatarLetter(text.trim()[0]);
              }}
              placeholder="请输入姓名"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>手机号</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="请输入手机号"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>
        </View>

        {/* 教授科目 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>教授科目</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 16 }]}>
          <View style={styles.subjectsWrap}>
            {ALL_SUBJECTS.map((subject) => {
              const selected = subjects.includes(subject);
              return (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleSubject(subject)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      { color: selected ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {subject}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 账号安全 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>账号安全</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => router.push('/change-password')}
            activeOpacity={0.6}
          >
            <View style={styles.fieldLeft}>
              <View style={[styles.fieldIcon, { backgroundColor: colors.palette.red.bg }]}>
                <Ionicons name="lock-closed" size={18} color={colors.palette.red.text} />
              </View>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>修改密码</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  saveBtn: { fontSize: 15, fontWeight: '600' },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
  },
  cameraIcon: {
    position: 'absolute',
    top: 80,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  changeAvatarText: {
    fontSize: 13,
    marginTop: 16,
  },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
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
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 15, fontWeight: '500' },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    textAlign: 'right',
    paddingVertical: 0,
  },
  divider: { height: 0.5, marginLeft: 16 },
  subjectsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  subjectChipText: { fontSize: 14, fontWeight: '600' },
});

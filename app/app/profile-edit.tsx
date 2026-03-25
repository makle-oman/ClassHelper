import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
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
    setSubjects((prev) => (prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject]));
  };

  const handlePickAvatar = () => {
    Alert.alert('提示', '头像上传会在后续接入真实能力后开放。');
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
      Alert.alert('提示', '请至少选择一个授课科目');
      return;
    }

    Alert.alert('保存成功', '个人资料已更新。', [{ text: '确定', onPress: () => router.back() }]);
  };

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
            <Text style={styles.navTitle}>编辑资料</Text>
            <Text style={styles.navSubtitle}>头像 · 信息 · 科目</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.75} onPress={handleSave}>
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroMain}>
            <View>
              <View style={styles.heroEyebrowWrap}>
                <Ionicons name="person-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroEyebrow}>个人资料</Text>
              </View>
              <Text style={styles.heroTitle}>维护您的基本信息</Text>
              <Text style={styles.heroMeta}>头像、姓名、授课科目等</Text>
            </View>
            <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.8} onPress={handlePickAvatar}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.heroStatsRow}>
            {[
              { label: '姓名', value: name || '未填写' },
              { label: '科目', value: `${subjects.length} 门` },
              { label: '手机', value: phone ? `${phone.slice(0, 3)}****` : '未填写' },
            ].map((item) => (
              <View key={item.label} style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
                <Text style={styles.heroStatValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>基本信息</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>更新姓名和手机号</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>姓名</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              value={name}
              placeholder="请输入姓名"
              placeholderTextColor={colors.textTertiary}
              onChangeText={(value) => {
                setName(value);
                if (value.trim()) setAvatarLetter(value.trim()[0]);
              }}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>手机号</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              value={phone}
              placeholder="请输入手机号"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={11}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>授课科目</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>支持多选，展示你的教学职责</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <View style={styles.subjectWrap}>
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
                  activeOpacity={0.75}
                  onPress={() => toggleSubject(subject)}
                >
                  <Text style={[styles.subjectChipText, { color: selected ? '#FFF' : colors.textSecondary }]}>{subject}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>账号安全</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>继续完善密码与认证能力</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <TouchableOpacity style={styles.securityRow} activeOpacity={0.75} onPress={() => router.push('/change-password')}>
            <View style={styles.securityLeft}>
              <View style={[styles.securityIcon, { backgroundColor: colors.palette.red.bg }]}> 
                <Ionicons name="lock-closed-outline" size={18} color={colors.palette.red.text} />
              </View>
              <View>
                <Text style={[styles.securityTitle, { color: colors.text }]}>修改密码</Text>
                <Text style={[styles.securityDesc, { color: colors.textTertiary }]}>建议定期更新密码，保持账号安全</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28 },
  // === Top Section (matches schedule hero) ===
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
  navTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  navSubtitle: { marginTop: 1, fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  heroCard: { paddingTop: 8 },
  heroMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  heroEyebrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  heroTitle: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  heroMeta: { marginTop: 3, fontSize: 12, lineHeight: 15, color: 'rgba(255,255,255,0.78)' },
  avatarWrap: { position: 'relative' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
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
  sectionHint: { fontSize: 12, marginTop: 4 },
  card: { borderRadius: 20, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  fieldInput: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  subjectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  subjectChipText: { fontSize: 13, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  securityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  securityIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  securityTitle: { fontSize: 15, fontWeight: '700' },
  securityDesc: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});

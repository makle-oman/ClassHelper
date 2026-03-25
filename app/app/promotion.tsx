import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

interface ClassForPromotion {
  id: string;
  grade: string;
  gradeNumber: number;
  classNumber: number;
  name: string;
  studentCount: number;
  targetGrade?: string;
  targetName?: string;
  isGraduating: boolean;
}

interface ArchivedClass {
  id: string;
  name: string;
  archivedDate: string;
  studentCount: number;
}

const gradeColorKeys = ['blue', 'green', 'orange', 'red', 'purple', 'cyan'] as const;
const getGradeColorKey = (gradeNum: number) => gradeColorKeys[(gradeNum - 1) % 6];
const gradeChars = ['一', '二', '三', '四', '五', '六'];

const mockClasses: ClassForPromotion[] = [
  { id: '1', grade: '三年级', gradeNumber: 3, classNumber: 1, name: '三年级1班', studentCount: 43, targetGrade: '四年级', targetName: '四年级1班', isGraduating: false },
  { id: '2', grade: '三年级', gradeNumber: 3, classNumber: 2, name: '三年级2班', studentCount: 43, targetGrade: '四年级', targetName: '四年级2班', isGraduating: false },
  { id: '3', grade: '六年级', gradeNumber: 6, classNumber: 1, name: '六年级1班', studentCount: 45, isGraduating: true },
];

const mockArchived: ArchivedClass[] = [
  { id: 'a1', name: '2024届六年级1班', archivedDate: '2024-07-01', studentCount: 45 },
];

export default function PromotionScreen() {
  const colors = useTheme();
  const [classes] = useState<ClassForPromotion[]>(mockClasses);
  const [archived] = useState<ArchivedClass[]>(mockArchived);

  const promotableClasses = classes.filter((item) => !item.isGraduating);
  const graduatingClasses = classes.filter((item) => item.isGraduating);
  const totalStudents = useMemo(() => classes.reduce((sum, item) => sum + item.studentCount, 0), [classes]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/index');
  };

  const handlePromote = () => {
    const names = promotableClasses.map((item) => item.name).join('、');
    Alert.alert(
      '确认升年级',
      `以下班级将整体升入下一年级：\n${names}\n\n所有学生信息会随班级同步迁移。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认升年级',
          onPress: () => Alert.alert('操作成功', '班级已完成静态升迁预演。'),
        },
      ]
    );
  };

  const handleArchive = () => {
    const names = graduatingClasses.map((item) => item.name).join('、');
    Alert.alert(
      '确认毕业归档',
      `以下班级将执行毕业归档：\n${names}\n\n归档后班级会移入历史区，仅保留查询能力。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认归档',
          style: 'destructive',
          onPress: () => Alert.alert('操作成功', '毕业班已完成静态归档预演。'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroDecorLarge, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
          <View style={[styles.heroDecorSmall, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={handleBack}
              activeOpacity={0.78}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroPageTitle}>年级升迁</Text>
            <View style={styles.heroTopSpacer} />
          </View>
          <Text style={styles.heroEyebrow}>年度升迁预演</Text>
          <Text style={styles.heroTitle}>本学年共有 {classes.length} 个班级参与流转</Text>
          <Text style={styles.heroSubtitle}>预览各班级的升迁和毕业归档情况</Text>
          <View style={styles.heroStatsRow}>
            {[
              { label: '待升年级', value: promotableClasses.length.toString() },
              { label: '毕业归档', value: graduatingClasses.length.toString() },
              { label: '涉及学生', value: totalStudents.toString() },
            ].map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.heroStatItem,
                  index < 2 && { borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.14)' },
                ]}
              >
                <Text style={styles.heroStatValue}>{item.value}</Text>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.guideCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>处理规则</Text>
              <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>了解升班和归档的区别</Text>
            </View>
          </View>
          <View style={styles.guideList}>
            {[
              { title: '普通升迁', desc: '一至五年级班级整体升入下一年级，学生信息随班级迁移。', icon: 'trending-up-outline' as const, colorKey: 'green' as const },
              { title: '毕业归档', desc: '六年级毕业班移入历史归档区，保留只读记录与追溯能力。', icon: 'archive-outline' as const, colorKey: 'orange' as const },
            ].map((item) => (
              <View key={item.title} style={[styles.guideItem, { backgroundColor: colors.surfaceSecondary }]}> 
                <View style={[styles.guideIcon, { backgroundColor: colors.palette[item.colorKey].bg }]}> 
                  <Ionicons name={item.icon} size={16} color={colors.palette[item.colorKey].text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guideTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.guideDesc, { color: colors.textTertiary }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {(promotableClasses.length > 0 || graduatingClasses.length > 0) && (
          <View style={styles.actionRow}>
            {promotableClasses.length > 0 && (
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: colors.primary }]}
                activeOpacity={0.82}
                onPress={handlePromote}
              >
                <Ionicons name="trending-up" size={18} color="#FFF" />
                <Text style={styles.primaryActionText}>一键升年级</Text>
              </TouchableOpacity>
            )}
            {graduatingClasses.length > 0 && (
              <TouchableOpacity
                style={[styles.secondaryAction, { backgroundColor: colors.palette.red.bg }]}
                activeOpacity={0.82}
                onPress={handleArchive}
              >
                <Ionicons name="archive" size={18} color={colors.palette.red.text} />
                <Text style={[styles.secondaryActionText, { color: colors.palette.red.text }]}>毕业归档</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.sectionRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>升迁预览</Text>
            <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>查看各班级将升入的目标年级</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listSection}>
          {classes.map((cls) => {
            const fromPalette = colors.palette[getGradeColorKey(cls.gradeNumber)];
            const toPalette = cls.isGraduating ? colors.palette.red : colors.palette[getGradeColorKey(Math.min(cls.gradeNumber + 1, 6))];

            return (
              <View key={cls.id} style={[styles.flowCard, { backgroundColor: colors.surface }]}> 
                <View style={styles.flowSide}>
                  <View style={[styles.gradeAvatar, { backgroundColor: fromPalette.bg }]}> 
                    <Text style={[styles.gradeAvatarText, { color: fromPalette.text }]}>{gradeChars[cls.gradeNumber - 1]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.className, { color: colors.text }]}>{cls.name}</Text>
                    <Text style={[styles.classMeta, { color: colors.textTertiary }]}>{cls.studentCount} 名学生 · 当前班级</Text>
                  </View>
                </View>

                <View style={styles.arrowWrap}>
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                </View>

                <View style={styles.flowSide}>
                  <View style={[styles.gradeAvatar, { backgroundColor: toPalette.bg }]}> 
                    {cls.isGraduating ? (
                      <Ionicons name="archive" size={16} color={toPalette.text} />
                    ) : (
                      <Text style={[styles.gradeAvatarText, { color: toPalette.text }]}>{gradeChars[Math.min(cls.gradeNumber, 5)]}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.className, { color: cls.isGraduating ? colors.palette.red.text : colors.text }]}>
                      {cls.isGraduating ? '毕业归档' : cls.targetName}
                    </Text>
                    <Text style={[styles.classMeta, { color: colors.textTertiary }]}> 
                      {cls.isGraduating ? '保留历史记录与只读查询' : '升入下一年级并保留班号'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>已归档班级</Text>
            <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>往届毕业班的历史记录</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          {archived.map((cls) => (
            <View key={cls.id} style={[styles.archivedCard, { backgroundColor: colors.surface }]}> 
              <View style={styles.archivedLeft}>
                <View style={[styles.archivedIcon, { backgroundColor: colors.surfaceSecondary }]}> 
                  <Ionicons name="archive-outline" size={18} color={colors.textTertiary} />
                </View>
                <View>
                  <Text style={[styles.archivedName, { color: colors.text }]}>{cls.name}</Text>
                  <Text style={[styles.archivedMeta, { color: colors.textTertiary }]}>{cls.studentCount} 名学生 · 归档于 {cls.archivedDate}</Text>
                </View>
              </View>
              <View style={[styles.archivedBadge, { backgroundColor: colors.surfaceSecondary }]}> 
                <Text style={[styles.archivedBadgeText, { color: colors.textTertiary }]}>已归档</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 14, zIndex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 0, paddingBottom: 28 },
  heroCard: {
    marginHorizontal: -10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBackButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroTopSpacer: { width: 34, height: 34 },
  heroPageTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  heroDecorLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
  },
  heroDecorSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -20,
    left: -30,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 11, lineHeight: 16, marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', marginTop: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4 },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  guideCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 12, marginTop: 4 },
  guideList: { gap: 10 },
  guideItem: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 14 },
  guideIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontSize: 14, fontWeight: '700' },
  guideDesc: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  actionRow: { gap: 10, marginBottom: 18 },
  primaryAction: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  secondaryAction: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionText: { fontSize: 15, fontWeight: '700' },
  listSection: { gap: 12, marginBottom: 18 },
  flowCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  flowSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gradeAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gradeAvatarText: { fontSize: 17, fontWeight: '800' },
  className: { fontSize: 15, fontWeight: '700' },
  classMeta: { fontSize: 12, marginTop: 4 },
  arrowWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  archivedCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  archivedLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  archivedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  archivedName: { fontSize: 15, fontWeight: '700' },
  archivedMeta: { fontSize: 12, marginTop: 4 },
  archivedBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  archivedBadgeText: { fontSize: 11, fontWeight: '700' },
});

import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../src/theme';
import { classApi } from '../src/services/api';
import { showFeedback } from '../src/services/feedback';
import { PrimaryHeroSection } from '../src/components/ui/PrimaryHeroSection';
import { AppCard } from '../src/components/ui/AppCard';
import { AppChip } from '../src/components/ui/AppChip';
import { AppButton } from '../src/components/ui/AppButton';
import { AppSectionHeader } from '../src/components/ui/AppSectionHeader';

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

export default function PromotionScreen() {
  const colors = useTheme();
  const [classes, setClasses] = useState<ClassForPromotion[]>([]);
  const [archived, setArchived] = useState<ArchivedClass[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const list = await classApi.list();
          const mapped: ClassForPromotion[] = list.map(c => {
            const isGraduating = c.grade_number >= 6;
            return {
              id: c.id.toString(),
              grade: c.grade,
              gradeNumber: c.grade_number,
              classNumber: c.class_number,
              name: c.name,
              studentCount: c.student_count,
              targetGrade: isGraduating ? undefined : gradeChars[c.grade_number] ? `${gradeChars[c.grade_number]}年级` : undefined,
              targetName: isGraduating ? undefined : `${gradeChars[c.grade_number] || ''}年级${c.class_number}班`,
              isGraduating,
            };
          });
          setClasses(mapped);
        } catch {}
      })();
    }, [])
  );

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
          onPress: async () => {
            try {
              for (const cls of promotableClasses) {
                await classApi.update(parseInt(cls.id), { grade_number: cls.gradeNumber + 1 });
              }
              showFeedback({ title: '升迁成功', message: `${promotableClasses.length}个班级已升入下一年级`, tone: 'success' });
              // 重新加载
              const list = await classApi.list();
              const mapped: ClassForPromotion[] = list.map(c => {
                const isGraduating = c.grade_number >= 6;
                return {
                  id: c.id.toString(), grade: c.grade, gradeNumber: c.grade_number, classNumber: c.class_number,
                  name: c.name, studentCount: c.student_count,
                  targetGrade: isGraduating ? undefined : `${gradeChars[c.grade_number] || ''}年级`,
                  targetName: isGraduating ? undefined : `${gradeChars[c.grade_number] || ''}年级${c.class_number}班`,
                  isGraduating,
                };
              });
              setClasses(mapped);
            } catch {
              showFeedback({ title: '操作失败', tone: 'error' });
            }
          },
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
          onPress: async () => {
            try {
              for (const cls of graduatingClasses) {
                await classApi.remove(parseInt(cls.id));
              }
              showFeedback({ title: '归档成功', message: `${graduatingClasses.length}个毕业班已归档`, tone: 'success' });
              setClasses(prev => prev.filter(c => !c.isGraduating));
            } catch {
              showFeedback({ title: '操作失败', tone: 'error' });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topSection}>
        <PrimaryHeroSection paddingBottom={10} style={styles.heroCard}>
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
        </PrimaryHeroSection>

        <AppCard style={styles.guideCard}>
          <AppSectionHeader title="处理规则" style={styles.guideHeader} />
          <Text style={[styles.guideHint, { color: colors.textTertiary }]}>了解升班和归档的区别</Text>
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
        </AppCard>

        {(promotableClasses.length > 0 || graduatingClasses.length > 0) && (
          <View style={styles.actionRow}>
            {promotableClasses.length > 0 && (
              <AppButton
                label="一键升年级"
                leftIconName="trending-up"
                onPress={handlePromote}
              />
            )}
            {graduatingClasses.length > 0 && (
              <AppButton
                label="毕业归档"
                leftIconName="archive"
                variant="soft"
                tone="error"
                onPress={handleArchive}
              />
            )}
          </View>
        )}

        <AppSectionHeader title="升迁预览" />
        <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>查看各班级将升入的目标年级</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listSection}>
          {classes.map((cls) => {
            const fromPalette = colors.palette[getGradeColorKey(cls.gradeNumber)];
            const toPalette = cls.isGraduating ? colors.palette.red : colors.palette[getGradeColorKey(Math.min(cls.gradeNumber + 1, 6))];

            return (
              <AppCard key={cls.id}>
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
              </AppCard>
            );
          })}
        </View>

        <AppSectionHeader title="已归档班级" />
        <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>往届毕业班的历史记录</Text>

        <View style={styles.listSection}>
          {archived.map((cls) => (
            <AppCard key={cls.id} style={styles.archivedCard}>
              <View style={styles.archivedLeft}>
                <View style={[styles.archivedIcon, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="archive-outline" size={18} color={colors.textTertiary} />
                </View>
                <View>
                  <Text style={[styles.archivedName, { color: colors.text }]}>{cls.name}</Text>
                  <Text style={[styles.archivedMeta, { color: colors.textTertiary }]}>{cls.studentCount} 名学生 · 归档于 {cls.archivedDate}</Text>
                </View>
              </View>
              <AppChip label="已归档" style={styles.archivedChip} />
            </AppCard>
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
    marginHorizontal: -14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  heroEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', marginTop: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4 },
  heroStatItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, marginTop: 2 },
  guideCard: { marginBottom: 16 },
  guideHeader: { marginBottom: 0 },
  guideHint: { fontSize: 12, marginTop: 2, marginBottom: 12 },
  guideList: { gap: 10 },
  guideItem: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 14 },
  guideIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontSize: 14, fontWeight: '700' },
  guideDesc: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  actionRow: { gap: 10, marginBottom: 18 },
  sectionHint: { fontSize: 12, marginTop: -8, marginBottom: 12 },
  listSection: { gap: 12, marginBottom: 18 },
  flowSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gradeAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gradeAvatarText: { fontSize: 17, fontWeight: '800' },
  className: { fontSize: 15, fontWeight: '700' },
  classMeta: { fontSize: 12, marginTop: 4 },
  arrowWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  archivedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  archivedLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  archivedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  archivedName: { fontSize: 15, fontWeight: '700' },
  archivedMeta: { fontSize: 12, marginTop: 4 },
  archivedChip: { borderRadius: 999 },
});

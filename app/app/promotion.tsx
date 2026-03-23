import { useState } from 'react';
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

const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
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

  const promotableClasses = classes.filter((c) => !c.isGraduating);
  const graduatingClasses = classes.filter((c) => c.isGraduating);

  const handlePromote = () => {
    const names = promotableClasses.map((c) => c.name).join('、');
    Alert.alert(
      '确认升级',
      `以下班级将整体升至下一年级：\n${names}\n\n所有学生信息将跟随迁移，此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '确认升级', style: 'default', onPress: () => Alert.alert('操作成功', '班级已成功升级至下一年级') },
      ],
    );
  };

  const handleArchive = () => {
    const names = graduatingClasses.map((c) => c.name).join('、');
    Alert.alert(
      '确认毕业归档',
      `以下班级将执行毕业归档：\n${names}\n\n归档后班级将移至"已归档"列表，此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '确认归档', style: 'destructive', onPress: () => Alert.alert('操作成功', '班级已成功归档') },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>年级升迁</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 说明卡片 */}
        <View style={[styles.infoCard, { backgroundColor: colors.palette.blue.bg }]}>
          <Ionicons name="information-circle" size={20} color={colors.palette.blue.text} />
          <Text style={[styles.infoText, { color: colors.palette.blue.text }]}>
            年级升迁会将班级整体升至下一年级，所有学生信息跟随迁移。六年级班级将执行毕业归档。
          </Text>
        </View>

        {/* 班级升迁预览 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>班级升迁预览</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          {classes.map((cls) => {
            const colorKey = getGradeColorKey(cls.gradeNumber);
            const gc = colors.palette[colorKey];
            const targetColorKey = cls.isGraduating ? 'red' : getGradeColorKey(cls.gradeNumber + 1);
            const tgc = colors.palette[targetColorKey];

            return (
              <View key={cls.id} style={[styles.promotionCard, { backgroundColor: colors.surface }]}>
                {/* 当前班级 */}
                <View style={styles.classInfo}>
                  <View style={[styles.gradeAvatar, { backgroundColor: gc.bg }]}>
                    <Text style={[styles.gradeAvatarText, { color: gc.text }]}>
                      {gradeChars[cls.gradeNumber - 1]}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.className, { color: colors.text }]}>{cls.name}</Text>
                    <Text style={[styles.studentCount, { color: colors.textTertiary }]}>{cls.studentCount}名学生</Text>
                  </View>
                </View>

                {/* 箭头 */}
                <View style={styles.arrowBox}>
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </View>

                {/* 目标 */}
                {cls.isGraduating ? (
                  <View style={styles.classInfo}>
                    <View style={[styles.gradeAvatar, { backgroundColor: colors.palette.red.bg }]}>
                      <Ionicons name="archive" size={18} color={colors.palette.red.text} />
                    </View>
                    <View>
                      <Text style={[styles.className, { color: colors.palette.red.text }]}>毕业归档</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.classInfo}>
                    <View style={[styles.gradeAvatar, { backgroundColor: tgc.bg }]}>
                      <Text style={[styles.gradeAvatarText, { color: tgc.text }]}>
                        {gradeChars[cls.gradeNumber]}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.className, { color: colors.text }]}>{cls.targetName}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionSection}>
          {promotableClasses.length > 0 && (
            <TouchableOpacity
              style={[styles.promoteBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={handlePromote}
            >
              <Ionicons name="trending-up" size={20} color="#FFF" />
              <Text style={styles.promoteBtnText}>一键升级</Text>
            </TouchableOpacity>
          )}

          {graduatingClasses.length > 0 && (
            <TouchableOpacity
              style={[styles.archiveBtn, { borderColor: colors.palette.red.text }]}
              activeOpacity={0.85}
              onPress={handleArchive}
            >
              <Ionicons name="archive" size={20} color={colors.palette.red.text} />
              <Text style={[styles.archiveBtnText, { color: colors.palette.red.text }]}>毕业归档</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 已归档班级 */}
        {archived.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: colors.textTertiary }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>已归档班级</Text>
              </View>
            </View>

            <View style={styles.listSection}>
              {archived.map((cls) => (
                <View key={cls.id} style={[styles.archivedCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.archivedLeft}>
                    <View style={[styles.archivedAvatar, { backgroundColor: colors.surfaceSecondary }]}>
                      <Ionicons name="archive-outline" size={18} color={colors.textTertiary} />
                    </View>
                    <View>
                      <Text style={[styles.archivedName, { color: colors.textSecondary }]}>{cls.name}</Text>
                      <Text style={[styles.archivedMeta, { color: colors.textTertiary }]}>{cls.studentCount}名学生</Text>
                    </View>
                  </View>
                  <View style={styles.archivedRight}>
                    <View style={[styles.archivedBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.archivedBadgeText, { color: colors.textTertiary }]}>已归档</Text>
                    </View>
                    <Text style={[styles.archivedDate, { color: colors.textTertiary }]}>{cls.archivedDate}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navTitle: { fontSize: 17, fontWeight: '700' },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },

  // Section header (dot-title pattern)
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Promotion cards
  listSection: { paddingHorizontal: 20, gap: 12 },
  promotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  classInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeAvatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 11,
    marginTop: 2,
  },
  arrowBox: {
    paddingHorizontal: 12,
  },

  // Action buttons
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  promoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  promoteBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  archiveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Archived section
  archivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  archivedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  archivedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedName: {
    fontSize: 14,
    fontWeight: '600',
  },
  archivedMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  archivedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  archivedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  archivedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  archivedDate: {
    fontSize: 11,
  },
});

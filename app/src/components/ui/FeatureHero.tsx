import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryHeroSection } from './PrimaryHeroSection';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface FeatureHeroProps {
  badgeLabel: string;
  iconName: IoniconsName;
  subtitle: string;
  title: string;
}

export function FeatureHero({
  badgeLabel,
  iconName,
  subtitle,
  title,
}: FeatureHeroProps) {
  return (
    <PrimaryHeroSection bottomRadius={0} paddingBottom={40} paddingHorizontal={24} paddingTop={20}>
      <View style={styles.brandBadge}>
        <Ionicons name={iconName} size={16} color="#FFF" />
        <Text style={styles.brandBadgeText}>{badgeLabel}</Text>
      </View>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </PrimaryHeroSection>
  );
}

const styles = StyleSheet.create({
  brandBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  brandBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    paddingRight: 24,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
  },
});

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  PieChart,
  ArrowLeft,
  Sparkles,
  Clock,
  Target,
  Landmark,
  Building2,
  CircleDollarSign,
  ArrowLeftRight,
  FileText,
  Package,
  DollarSign,
  ChevronDown,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { categoryLabels, riskLabels } from '@/constants/mockData';
import { useUser } from '@/contexts/UserContext';
import { InvestmentCategory } from '@/types';

const categoryIconMap: Record<InvestmentCategory, React.ComponentType<{ color: string; size: number }>> = {
  stock: TrendingUp,
  bond: FileText,
  gold: CircleDollarSign,
  forex: ArrowLeftRight,
  crypto: Sparkles,
  realestate: Building2,
  fund: PieChart,
  deposit: Landmark,
  commodity: Package,
};

const categoryColorMap: Record<InvestmentCategory, string> = {
  stock: '#3B82F6',
  bond: '#8B5CF6',
  gold: '#F59E0B',
  forex: '#06B6D4',
  crypto: '#F97316',
  realestate: '#10B981',
  fund: '#EC4899',
  deposit: '#6366F1',
  commodity: '#84CC16',
};

export default function ResultScreen() {
  const router = useRouter();
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const { analysisHistory } = useUser();

  const analysis = useMemo(
    () => analysisHistory.find((a) => a.id === analysisId),
    [analysisHistory, analysisId]
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const barAnims = useRef(
    (analysis?.recommendations || []).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    barAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 300 + i * 120,
        useNativeDriver: false,
      }).start();
    });
  }, [fadeAnim, slideAnim, barAnims]);

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Analiz bulunamadı</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const riskColor =
    analysis.overallRisk === 'low'
      ? Colors.dark.riskLow
      : analysis.overallRisk === 'medium'
      ? Colors.dark.riskMedium
      : Colors.dark.riskHigh;

  const RiskIcon =
    analysis.overallRisk === 'low'
      ? Shield
      : analysis.overallRisk === 'high'
      ? AlertTriangle
      : Target;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.dark.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Analiz Sonucu</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.summaryCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Yatırım Tutarı</Text>
              <Text style={styles.amountValue}>₺{analysis.amount.toLocaleString('tr-TR')}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <TrendingUp color={Colors.dark.primary} size={18} />
                <Text style={styles.statLabel}>Tahmini Getiri</Text>
                <Text style={[styles.statValue, { color: Colors.dark.primary }]}>{analysis.totalEstimatedReturn}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <RiskIcon color={riskColor} size={18} />
                <Text style={styles.statLabel}>Risk Seviyesi</Text>
                <Text style={[styles.statValue, { color: riskColor }]}>{riskLabels[analysis.overallRisk]}</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.marketCondCard, { opacity: fadeAnim }]}>
            <Text style={styles.marketCondTitle}>Piyasa Durumu</Text>
            <Text style={styles.marketCondText}>{analysis.marketCondition}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.summaryTitle}>Özet</Text>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <PieChart color={Colors.dark.primary} size={20} />
            <Text style={styles.sectionTitle}>Portföy Dağılımı</Text>
          </View>

          <View style={styles.allocationBars}>
            {analysis.recommendations.map((rec, idx) => {
              const color = categoryColorMap[rec.category] || Colors.dark.accent;
              const barWidth = barAnims[idx]
                ? barAnims[idx].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${rec.allocation}%`],
                  })
                : undefined;

              return (
                <View key={rec.id} style={styles.allocationRow}>
                  <View style={styles.allocLabelRow}>
                    <View style={[styles.allocDot, { backgroundColor: color }]} />
                    <Text style={styles.allocName}>{rec.name}</Text>
                    <Text style={styles.allocPercent}>{rec.allocation}%</Text>
                  </View>
                  <View style={styles.allocBarBg}>
                    <Animated.View
                      style={[styles.allocBarFill, { width: barWidth as unknown as number, backgroundColor: color }]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.recSectionTitle}>Yatırım Önerileri</Text>

          {analysis.recommendations.map((rec, idx) => {
            const IconComp = categoryIconMap[rec.category] || TrendingUp;
            const color = categoryColorMap[rec.category] || Colors.dark.accent;
            const recRiskColor =
              rec.riskLevel === 'low' ? Colors.dark.riskLow
              : rec.riskLevel === 'medium' ? Colors.dark.riskMedium
              : Colors.dark.riskHigh;
            const investmentAmount = Math.round(analysis.amount * (rec.allocation / 100));

            return (
              <Animated.View key={rec.id} style={[styles.recCard, { opacity: barAnims[idx] || 1 }]}>
                <View style={styles.recHeader}>
                  <View style={[styles.recIcon, { backgroundColor: color + '18' }]}>
                    <IconComp color={color} size={20} />
                  </View>
                  <View style={styles.recHeaderText}>
                    <Text style={styles.recName}>{rec.name}</Text>
                    <Text style={styles.recCategory}>{categoryLabels[rec.category] || rec.category}</Text>
                  </View>
                  <View style={[styles.recRiskBadge, { backgroundColor: recRiskColor + '18' }]}>
                    <Text style={[styles.recRiskText, { color: recRiskColor }]}>{riskLabels[rec.riskLevel]}</Text>
                  </View>
                </View>

                <Text style={styles.recDesc}>{rec.description}</Text>

                <View style={styles.recMetrics}>
                  <View style={styles.recMetricItem}>
                    <DollarSign color={Colors.dark.textMuted} size={14} />
                    <Text style={styles.recMetricLabel}>Yatırım</Text>
                    <Text style={styles.recMetricValue}>₺{investmentAmount.toLocaleString('tr-TR')}</Text>
                  </View>
                  <View style={styles.recMetricItem}>
                    <TrendingUp color={Colors.dark.positive} size={14} />
                    <Text style={styles.recMetricLabel}>Getiri</Text>
                    <Text style={[styles.recMetricValue, { color: Colors.dark.positive }]}>{rec.estimatedReturn}</Text>
                  </View>
                  <View style={styles.recMetricItem}>
                    <Clock color={Colors.dark.accent} size={14} />
                    <Text style={styles.recMetricLabel}>Süre</Text>
                    <Text style={[styles.recMetricValue, { color: Colors.dark.accent }]}>{rec.timeHorizon}</Text>
                  </View>
                </View>

                <View style={styles.reasoningBox}>
                  <ChevronDown color={Colors.dark.textMuted} size={14} />
                  <Text style={styles.recReasoning}>{rec.reasoning}</Text>
                </View>
              </Animated.View>
            );
          })}

          <View style={styles.disclaimerCard}>
            <AlertTriangle color={Colors.dark.warning} size={16} />
            <Text style={styles.disclaimerText}>
              Bu öneriler bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  topBarBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.dark.surface, alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text },
  scrollContent: { paddingHorizontal: 20 },
  summaryCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border,
  },
  amountRow: { alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 13, color: Colors.dark.textMuted, marginBottom: 4 },
  amountValue: { fontSize: 32, fontWeight: '800' as const, color: Colors.dark.text, letterSpacing: -1 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.dark.border },
  statLabel: { fontSize: 12, color: Colors.dark.textMuted },
  statValue: { fontSize: 16, fontWeight: '700' as const },
  marketCondCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.dark.border,
  },
  marketCondTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.textSecondary, marginBottom: 8 },
  marketCondText: { fontSize: 14, color: Colors.dark.text, lineHeight: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 8 },
  summaryText: { fontSize: 14, color: Colors.dark.textSecondary, lineHeight: 22, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text },
  allocationBars: { gap: 14, marginBottom: 28 },
  allocationRow: { gap: 6 },
  allocLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocDot: { width: 10, height: 10, borderRadius: 5 },
  allocName: { flex: 1, fontSize: 13, fontWeight: '600' as const, color: Colors.dark.text },
  allocPercent: { fontSize: 13, fontWeight: '700' as const, color: Colors.dark.textSecondary },
  allocBarBg: { height: 8, backgroundColor: Colors.dark.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  allocBarFill: { height: 8, borderRadius: 4 },
  recSectionTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 14 },
  recCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border, gap: 12,
  },
  recHeader: { flexDirection: 'row', alignItems: 'center' },
  recIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recHeaderText: { flex: 1, marginLeft: 12, gap: 2 },
  recName: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text },
  recCategory: { fontSize: 12, color: Colors.dark.textMuted },
  recRiskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  recRiskText: { fontSize: 11, fontWeight: '700' as const },
  recDesc: { fontSize: 13, color: Colors.dark.text, lineHeight: 20 },
  recMetrics: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 12, padding: 12,
  },
  recMetricItem: { alignItems: 'center', gap: 4, flex: 1 },
  recMetricLabel: { fontSize: 10, color: Colors.dark.textMuted },
  recMetricValue: { fontSize: 13, fontWeight: '700' as const, color: Colors.dark.text },
  reasoningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.dark.background, borderRadius: 10, padding: 12,
  },
  recReasoning: {
    flex: 1, fontSize: 12, color: Colors.dark.textMuted, lineHeight: 18, fontStyle: 'italic' as const,
  },
  disclaimerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 14, padding: 16,
    marginTop: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)',
  },
  disclaimerText: { flex: 1, fontSize: 12, color: Colors.dark.warning, lineHeight: 18 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: Colors.dark.textMuted },
  backBtn: { backgroundColor: Colors.dark.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '600' as const, fontSize: 15 },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  BarChart3,
  Activity,
  TrendingDown,
  Target,
  Gauge,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

const riskAnalysisSchema = z.object({
  overallRiskScore: z.number(),
  riskCategory: z.enum(['low', 'medium', 'high']),
  diversificationScore: z.number(),
  volatilityIndex: z.string(),
  maxDrawdown: z.string(),
  sharpeRatio: z.string(),
  summary: z.string(),
  riskFactors: z.array(
    z.object({
      name: z.string(),
      level: z.enum(['low', 'medium', 'high']),
      description: z.string(),
      impact: z.string(),
      mitigation: z.string(),
    })
  ),
  recommendations: z.array(z.string()),
  scenarioAnalysis: z.array(
    z.object({
      scenario: z.string(),
      probability: z.string(),
      impact: z.string(),
      portfolioEffect: z.string(),
    })
  ),
});

export default function RiskManagementScreen() {
  const router = useRouter();
  const { profile, analysisHistory } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const latestAnalysis = analysisHistory.length > 0 ? analysisHistory[0] : null;

  const { data, isLoading } = useQuery({
    queryKey: ['risk-analysis', latestAnalysis?.id],
    queryFn: async () => {
      const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const portfolioInfo = latestAnalysis
        ? `Kullanıcının mevcut portföyü: ${latestAnalysis.amount.toLocaleString('tr-TR')} TL, ${latestAnalysis.recommendations.map(r => `${r.name} (%${r.allocation})`).join(', ')}. Genel risk: ${latestAnalysis.overallRisk}.`
        : 'Kullanıcının henüz bir portföyü yok, genel piyasa riskleri hakkında bilgi ver.';

      const userInfo = profile
        ? `Risk toleransı: ${profile.riskTolerance}, Yatırım hedefi: ${profile.investmentGoal}, Aylık gelir: ${profile.monthlyIncome} TL, Yatırım bütçesi: ${profile.investmentBudget} TL/ay.`
        : '';

      return generateObject({
        messages: [
          {
            role: 'user',
            content: `Sen bir risk yönetimi uzmanısın. Bugün: ${dateStr}.

${userInfo}
${portfolioInfo}

Detaylı bir risk analizi yap (samimi ve anlaşılır bir dille):
1. Genel risk skoru (0-100)
2. Risk kategorisi
3. Çeşitlendirme skoru (0-100)
4. Volatilite endeksi
5. Maksimum düşüş (max drawdown) tahmini
6. Sharpe oranı
7. Özet analiz
8. Risk faktörleri (en az 4): Her biri için isim, seviye, açıklama, etki ve azaltma yöntemi
9. Öneriler (en az 4)
10. Senaryo analizi (en az 3): Her biri için senaryo adı, olasılık, etki ve portföy etkisi

Tüm veriler GÜNCEL piyasa koşullarına göre olmalı (2026 Mart).`,
          },
        ],
        schema: riskAnalysisSchema,
      });
    },
    staleTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [data, fadeAnim, slideAnim]);

  const riskColor = data?.riskCategory === 'low' ? Colors.dark.riskLow
    : data?.riskCategory === 'high' ? Colors.dark.riskHigh : Colors.dark.riskMedium;

  const riskLabel = data?.riskCategory === 'low' ? 'Düşük Risk'
    : data?.riskCategory === 'high' ? 'Yüksek Risk' : 'Orta Risk';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.dark.text} size={22} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Shield color="#3B82F6" size={18} />
            <Text style={styles.topBarTitle}>Risk Yönetimi</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIcon}>
              <Shield color="#3B82F6" size={32} />
            </View>
            <ActivityIndicator color={Colors.dark.primary} size="large" />
            <Text style={styles.loadingText}>Risk analizi yapılıyor...</Text>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <View style={[styles.scoreCard, { borderColor: riskColor + '40' }]}>
                <View style={styles.scoreCircle}>
                  <Gauge color={riskColor} size={28} />
                  <Text style={[styles.scoreNum, { color: riskColor }]}>{data.overallRiskScore}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
                <View style={[styles.riskCategoryBadge, { backgroundColor: riskColor + '18' }]}>
                  <Text style={[styles.riskCategoryText, { color: riskColor }]}>{riskLabel}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <BarChart3 color={Colors.dark.primary} size={18} />
                  <Text style={styles.metricLabel}>Çeşitlendirme</Text>
                  <Text style={styles.metricValue}>{data.diversificationScore}/100</Text>
                </View>
                <View style={styles.metricCard}>
                  <Activity color={Colors.dark.accent} size={18} />
                  <Text style={styles.metricLabel}>Volatilite</Text>
                  <Text style={styles.metricValue}>{data.volatilityIndex}</Text>
                </View>
                <View style={styles.metricCard}>
                  <TrendingDown color={Colors.dark.negative} size={18} />
                  <Text style={styles.metricLabel}>Maks. Düşüş</Text>
                  <Text style={styles.metricValue}>{data.maxDrawdown}</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Risk Özeti</Text>
                <Text style={styles.summaryText}>{data.summary}</Text>
              </View>

              <Text style={styles.sectionHeader}>Risk Faktörleri</Text>
              {data.riskFactors.map((rf, i) => {
                const rfColor = rf.level === 'low' ? Colors.dark.riskLow : rf.level === 'high' ? Colors.dark.riskHigh : Colors.dark.riskMedium;
                const RFIcon = rf.level === 'high' ? ShieldAlert : rf.level === 'low' ? ShieldCheck : Shield;
                return (
                  <View key={i} style={styles.riskFactorCard}>
                    <View style={styles.rfHeader}>
                      <View style={[styles.rfIcon, { backgroundColor: rfColor + '15' }]}>
                        <RFIcon color={rfColor} size={16} />
                      </View>
                      <Text style={styles.rfName}>{rf.name}</Text>
                      <View style={[styles.rfLevelBadge, { backgroundColor: rfColor + '15' }]}>
                        <Text style={[styles.rfLevelText, { color: rfColor }]}>
                          {rf.level === 'low' ? 'Düşük' : rf.level === 'high' ? 'Yüksek' : 'Orta'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.rfDesc}>{rf.description}</Text>
                    <View style={styles.rfMeta}>
                      <View style={styles.rfMetaItem}>
                        <Text style={styles.rfMetaLabel}>Etki:</Text>
                        <Text style={styles.rfMetaValue}>{rf.impact}</Text>
                      </View>
                      <View style={styles.rfMetaItem}>
                        <Text style={styles.rfMetaLabel}>Önlem:</Text>
                        <Text style={styles.rfMetaValue}>{rf.mitigation}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <Text style={styles.sectionHeader}>Senaryo Analizi</Text>
              {data.scenarioAnalysis.map((sa, i) => (
                <View key={i} style={styles.scenarioCard}>
                  <View style={styles.scenarioHeader}>
                    <Target color={Colors.dark.primary} size={16} />
                    <Text style={styles.scenarioName}>{sa.scenario}</Text>
                  </View>
                  <View style={styles.scenarioMeta}>
                    <View style={styles.scenarioMetaItem}>
                      <Text style={styles.scenarioLabel}>Olasılık</Text>
                      <Text style={styles.scenarioValue}>{sa.probability}</Text>
                    </View>
                    <View style={styles.scenarioMetaItem}>
                      <Text style={styles.scenarioLabel}>Etki</Text>
                      <Text style={styles.scenarioValue}>{sa.impact}</Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioEffect}>{sa.portfolioEffect}</Text>
                </View>
              ))}

              <Text style={styles.sectionHeader}>Öneriler</Text>
              {data.recommendations.map((rec, i) => (
                <View key={i} style={styles.recItem}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}

              <View style={styles.disclaimer}>
                <AlertTriangle color={Colors.dark.warning} size={14} />
                <Text style={styles.disclaimerText}>
                  Risk analizleri bilgilendirme amaçlıdır. Yatırım kararlarınız için profesyonel danışmanlık alınız.
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </Animated.View>
          </ScrollView>
        ) : null}
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
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  loadingText: { fontSize: 16, fontWeight: '600' as const, color: Colors.dark.text },
  scrollContent: { paddingHorizontal: 20 },
  scoreCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 20,
    padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, gap: 12,
  },
  scoreCircle: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreNum: { fontSize: 48, fontWeight: '800' as const },
  scoreMax: { fontSize: 18, color: Colors.dark.textMuted, fontWeight: '600' as const },
  riskCategoryBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10 },
  riskCategoryText: { fontSize: 14, fontWeight: '700' as const },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.dark.border,
  },
  metricLabel: { fontSize: 10, color: Colors.dark.textMuted, textAlign: 'center' },
  metricValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.dark.text },
  summaryCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.textSecondary, marginBottom: 8 },
  summaryText: { fontSize: 14, color: Colors.dark.text, lineHeight: 22 },
  sectionHeader: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 12, marginTop: 8 },
  riskFactorCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.dark.border, gap: 8,
  },
  rfHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rfIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rfName: { flex: 1, fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text },
  rfLevelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rfLevelText: { fontSize: 11, fontWeight: '700' as const },
  rfDesc: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 20 },
  rfMeta: { gap: 6 },
  rfMetaItem: { flexDirection: 'row', gap: 4 },
  rfMetaLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.dark.textMuted },
  rfMetaValue: { flex: 1, fontSize: 12, color: Colors.dark.textSecondary, lineHeight: 18 },
  scenarioCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.dark.border, gap: 10,
  },
  scenarioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scenarioName: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text },
  scenarioMeta: { flexDirection: 'row', gap: 16 },
  scenarioMetaItem: { gap: 2 },
  scenarioLabel: { fontSize: 11, color: Colors.dark.textMuted },
  scenarioValue: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.text },
  scenarioEffect: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 20 },
  recItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.dark.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.dark.border,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.primary, marginTop: 6 },
  recText: { flex: 1, fontSize: 13, color: Colors.dark.text, lineHeight: 20 },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 12, padding: 14, backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.1)',
  },
  disclaimerText: { flex: 1, fontSize: 11, color: Colors.dark.warning, lineHeight: 16 },
});

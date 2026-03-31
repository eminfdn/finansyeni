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
  PieChart,
  TrendingUp,
  Shield,
  AlertTriangle,
  Target,
  Clock,
  Sparkles,
  DollarSign,
  BarChart3,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

const portfolioSchema = z.object({
  portfolioName: z.string(),
  portfolioType: z.string(),
  expectedReturn: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  timeHorizon: z.string(),
  summary: z.string(),
  allocations: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      allocation: z.number(),
      reason: z.string(),
      expectedReturn: z.string(),
      risk: z.string(),
      currentPrice: z.string(),
      suggestedAmount: z.string(),
      potentialProfit: z.string(),
      maxLoss: z.string(),
    })
  ),
  rebalancingFrequency: z.string(),
  entryStrategy: z.string(),
  exitStrategy: z.string(),
  advantages: z.array(z.string()),
  disadvantages: z.array(z.string()),
});

export default function PortfolioSuggestionScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnims = useRef<Animated.Value[]>([]).current;

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-suggestion', profile?.riskTolerance],
    queryFn: async () => {
      const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const riskPref = profile?.riskTolerance === 'low' ? 'düşük riskli, muhafazakar'
        : profile?.riskTolerance === 'high' ? 'yüksek riskli, agresif'
        : 'dengeli, orta riskli';

      const budget = profile?.investmentBudget
        ? `Aylık yatırım bütçesi: ${profile.investmentBudget.toLocaleString('tr-TR')} TL.`
        : '';

      const userInfo = profile
        ? `Kullanıcı: ${profile.name}, Yaş: ${profile.age || 'belirtilmedi'}, Meslek: ${profile.occupation || 'belirtilmedi'}, Risk toleransı: ${riskPref}, Yatırım hedefi: ${profile.investmentGoal}, Aylık gelir: ${profile.monthlyIncome?.toLocaleString('tr-TR')} TL. ${budget}`
        : 'Genel bir yatırımcı için dengeli portföy öner.';

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Sen uzman bir portföy yöneticisisin. Bugün: ${dateStr}.

${userInfo}

100.000 TL bütçe ile optimal bir yatırım portföyü öner. GÜNCEL piyasa verilerine dayanarak (2026 Mart):

1. Portföy adı ve tipi
2. Beklenen yıllık getiri
3. Risk seviyesi
4. Yatırım süresi
5. Özet (samimi bir dille)
6. En az 5, en fazla 8 yatırım aracı:
   - Her biri için: isim, kategori, portföy yüzdesi, neden, beklenen getiri, risk, güncel fiyat, önerilen tutar, potansiyel kâr ve maksimum kayıp
7. Portföy dengeleme sıklığı
8. Giriş ve çıkış stratejisi
9. Avantajlar ve dezavantajlar

Tüm fiyatlar ve veriler GÜNCEL ve GERÇEK olmalı. Samimi ve anlaşılır bir dil kullan.`,
          },
        ],
        schema: portfolioSchema,
      });

      return result;
    },
    staleTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      while (barAnims.length < data.allocations.length) {
        barAnims.push(new Animated.Value(0));
      }

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      barAnims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: 300 + i * 100,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [data, fadeAnim, slideAnim, barAnims]);

  const allocationColors = [
    '#F59E0B', '#3B82F6', '#EF4444', '#10B981', '#F97316',
    '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
  ];

  const riskColor = data?.riskLevel === 'low' ? Colors.dark.riskLow
    : data?.riskLevel === 'high' ? Colors.dark.riskHigh : Colors.dark.riskMedium;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.dark.text} size={22} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <BarChart3 color={Colors.dark.primary} size={18} />
            <Text style={styles.topBarTitle}>Portföy Önerisi</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIcon}>
              <PieChart color={Colors.dark.primary} size={32} />
            </View>
            <ActivityIndicator color={Colors.dark.primary} size="large" />
            <Text style={styles.loadingText}>Optimal portföy oluşturuluyor...</Text>
            <Text style={styles.loadingSubtext}>Piyasa verileri analiz ediliyor</Text>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <View style={styles.headerCard}>
                <View style={styles.headerBadge}>
                  <Sparkles color={Colors.dark.primary} size={16} />
                  <Text style={styles.headerBadgeText}>{data.portfolioType}</Text>
                </View>
                <Text style={styles.portfolioName}>{data.portfolioName}</Text>
                <Text style={styles.portfolioSummary}>{data.summary}</Text>

                <View style={styles.headerStats}>
                  <View style={styles.headerStatItem}>
                    <TrendingUp color={Colors.dark.positive} size={16} />
                    <Text style={styles.headerStatLabel}>Beklenen Getiri</Text>
                    <Text style={[styles.headerStatValue, { color: Colors.dark.positive }]}>
                      {data.expectedReturn}
                    </Text>
                  </View>
                  <View style={styles.headerStatDivider} />
                  <View style={styles.headerStatItem}>
                    <Shield color={riskColor} size={16} />
                    <Text style={styles.headerStatLabel}>Risk</Text>
                    <Text style={[styles.headerStatValue, { color: riskColor }]}>
                      {data.riskLevel === 'low' ? 'Düşük' : data.riskLevel === 'high' ? 'Yüksek' : 'Orta'}
                    </Text>
                  </View>
                  <View style={styles.headerStatDivider} />
                  <View style={styles.headerStatItem}>
                    <Clock color={Colors.dark.accent} size={16} />
                    <Text style={styles.headerStatLabel}>Süre</Text>
                    <Text style={[styles.headerStatValue, { color: Colors.dark.accent }]}>
                      {data.timeHorizon}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Portföy Dağılımı</Text>
              <View style={styles.allocationBars}>
                {data.allocations.map((alloc, idx) => {
                  const color = allocationColors[idx % allocationColors.length];
                  const barWidth = barAnims[idx]
                    ? barAnims[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${alloc.allocation}%`],
                      })
                    : `${alloc.allocation}%`;

                  return (
                    <View key={idx} style={styles.allocRow}>
                      <View style={styles.allocLabelRow}>
                        <View style={[styles.allocDot, { backgroundColor: color }]} />
                        <Text style={styles.allocName}>{alloc.name}</Text>
                        <Text style={styles.allocPercent}>{alloc.allocation}%</Text>
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

              <Text style={styles.sectionHeader}>Yatırım Detayları</Text>
              {data.allocations.map((alloc, idx) => {
                const color = allocationColors[idx % allocationColors.length];
                return (
                  <View key={idx} style={styles.allocCard}>
                    <View style={styles.allocCardHeader}>
                      <View style={[styles.allocCardIcon, { backgroundColor: color + '18' }]}>
                        <DollarSign color={color} size={18} />
                      </View>
                      <View style={styles.allocCardTitle}>
                        <Text style={styles.allocCardName}>{alloc.name}</Text>
                        <Text style={styles.allocCardCategory}>{alloc.category}</Text>
                      </View>
                      <Text style={[styles.allocCardAlloc, { color }]}>{alloc.allocation}%</Text>
                    </View>

                    <Text style={styles.allocCardReason}>{alloc.reason}</Text>

                    <View style={styles.allocCardMetrics}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Fiyat</Text>
                        <Text style={styles.metricValue}>{alloc.currentPrice}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Tutar</Text>
                        <Text style={styles.metricValue}>{alloc.suggestedAmount}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Bkl. Getiri</Text>
                        <Text style={[styles.metricValue, { color: Colors.dark.positive }]}>{alloc.expectedReturn}</Text>
                      </View>
                    </View>

                    <View style={styles.allocCardBottom}>
                      <View style={styles.profitLoss}>
                        <Text style={styles.profitLabel}>Potansiyel Kâr:</Text>
                        <Text style={[styles.profitValue, { color: Colors.dark.positive }]}>{alloc.potentialProfit}</Text>
                      </View>
                      <View style={styles.profitLoss}>
                        <Text style={styles.profitLabel}>Maks. Kayıp:</Text>
                        <Text style={[styles.profitValue, { color: Colors.dark.negative }]}>{alloc.maxLoss}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={styles.strategyCard}>
                <Text style={styles.sectionTitle}>Stratejiler</Text>
                <View style={styles.strategyRow}>
                  <Target color={Colors.dark.primary} size={14} />
                  <View style={styles.strategyContent}>
                    <Text style={styles.strategyLabel}>Giriş Stratejisi</Text>
                    <Text style={styles.strategyText}>{data.entryStrategy}</Text>
                  </View>
                </View>
                <View style={styles.strategyDivider} />
                <View style={styles.strategyRow}>
                  <Target color={Colors.dark.negative} size={14} />
                  <View style={styles.strategyContent}>
                    <Text style={styles.strategyLabel}>Çıkış Stratejisi</Text>
                    <Text style={styles.strategyText}>{data.exitStrategy}</Text>
                  </View>
                </View>
                <View style={styles.strategyDivider} />
                <View style={styles.strategyRow}>
                  <Clock color={Colors.dark.accent} size={14} />
                  <View style={styles.strategyContent}>
                    <Text style={styles.strategyLabel}>Dengeleme</Text>
                    <Text style={styles.strategyText}>{data.rebalancingFrequency}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.prosConsRow}>
                <View style={[styles.prosConsCard, { borderColor: Colors.dark.positive + '30' }]}>
                  <Text style={[styles.prosConsTitle, { color: Colors.dark.positive }]}>Avantajlar</Text>
                  {data.advantages.map((a, i) => (
                    <View key={i} style={styles.prosConsItem}>
                      <View style={[styles.prosConsDot, { backgroundColor: Colors.dark.positive }]} />
                      <Text style={styles.prosConsText}>{a}</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.prosConsCard, { borderColor: Colors.dark.negative + '30' }]}>
                  <Text style={[styles.prosConsTitle, { color: Colors.dark.negative }]}>Dezavantajlar</Text>
                  {data.disadvantages.map((d, i) => (
                    <View key={i} style={styles.prosConsItem}>
                      <View style={[styles.prosConsDot, { backgroundColor: Colors.dark.negative }]} />
                      <Text style={styles.prosConsText}>{d}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.disclaimer}>
                <AlertTriangle color={Colors.dark.warning} size={14} />
                <Text style={styles.disclaimerText}>
                  Portföy önerileri AI tarafından üretilmiştir ve yatırım tavsiyesi niteliği taşımaz.
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
    backgroundColor: Colors.dark.primaryGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  loadingText: { fontSize: 16, fontWeight: '600' as const, color: Colors.dark.text },
  loadingSubtext: { fontSize: 13, color: Colors.dark.textMuted },
  scrollContent: { paddingHorizontal: 20 },
  headerCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 20,
    padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.dark.border, gap: 12,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: Colors.dark.primaryGlow,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '600' as const, color: Colors.dark.primary },
  portfolioName: { fontSize: 22, fontWeight: '800' as const, color: Colors.dark.text },
  portfolioSummary: { fontSize: 14, color: Colors.dark.textSecondary, lineHeight: 22 },
  headerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  headerStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  headerStatDivider: { width: 1, height: 36, backgroundColor: Colors.dark.border },
  headerStatLabel: { fontSize: 11, color: Colors.dark.textMuted },
  headerStatValue: { fontSize: 15, fontWeight: '700' as const },
  sectionHeader: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.textSecondary, marginBottom: 12 },
  allocationBars: { gap: 12, marginBottom: 20 },
  allocRow: { gap: 6 },
  allocLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocDot: { width: 10, height: 10, borderRadius: 5 },
  allocName: { flex: 1, fontSize: 13, fontWeight: '600' as const, color: Colors.dark.text },
  allocPercent: { fontSize: 13, fontWeight: '700' as const, color: Colors.dark.textSecondary },
  allocBarBg: { height: 8, backgroundColor: Colors.dark.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  allocBarFill: { height: 8, borderRadius: 4 },
  allocCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border, gap: 10,
  },
  allocCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  allocCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  allocCardTitle: { flex: 1, gap: 2 },
  allocCardName: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text },
  allocCardCategory: { fontSize: 11, color: Colors.dark.textMuted },
  allocCardAlloc: { fontSize: 16, fontWeight: '800' as const },
  allocCardReason: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 20 },
  allocCardMetrics: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 10, padding: 12,
  },
  metricItem: { alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: 10, color: Colors.dark.textMuted },
  metricValue: { fontSize: 13, fontWeight: '700' as const, color: Colors.dark.text },
  allocCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  profitLoss: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  profitLabel: { fontSize: 12, color: Colors.dark.textMuted },
  profitValue: { fontSize: 13, fontWeight: '700' as const },
  strategyCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border,
  },
  strategyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  strategyContent: { flex: 1, gap: 2 },
  strategyLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.dark.textMuted },
  strategyText: { fontSize: 13, color: Colors.dark.text, lineHeight: 20 },
  strategyDivider: { height: 1, backgroundColor: Colors.dark.border },
  prosConsRow: { gap: 12, marginBottom: 16 },
  prosConsCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, gap: 8,
  },
  prosConsTitle: { fontSize: 14, fontWeight: '700' as const, marginBottom: 4 },
  prosConsItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  prosConsDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  prosConsText: { flex: 1, fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 20 },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 14, backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.1)',
  },
  disclaimerText: { flex: 1, fontSize: 11, color: Colors.dark.warning, lineHeight: 16 },
});

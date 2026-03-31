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
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Target,
  Activity,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';

const quickAnalysisSchema = z.object({
  marketSummary: z.string(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']),
  sentimentScore: z.number(),
  topOpportunities: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      reason: z.string(),
      potentialReturn: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
      currentPrice: z.string(),
      targetPrice: z.string(),
    })
  ),
  warnings: z.array(z.string()),
  keyIndicators: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      trend: z.enum(['up', 'down', 'stable']),
      impact: z.string(),
    })
  ),
});

export default function QuickAnalysisScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { data, isLoading } = useQuery({
    queryKey: ['quick-analysis'],
    queryFn: async () => {
      const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      return generateObject({
        messages: [
          {
            role: 'user',
            content: `Sen profesyonel bir piyasa analistisin. Bugün: ${dateStr}, saat: ${timeStr}.

Türkiye ve dünya piyasalarının hızlı bir analizini yap. GÜNCEL ve GERÇEK verilere dayanarak (2026 Mart verileri):

1. Genel piyasa özeti (samimi bir dille, sanki arkadaşına anlatıyormuş gibi)
2. Piyasa duyarlılığı (bullish/bearish/neutral) ve puan (0-100)
3. En iyi 5 fırsat (şu an alınabilecek en iyi yatırım araçları):
   - Her biri için mevcut fiyat, hedef fiyat, potansiyel getiri ve risk seviyesi
4. Dikkat edilmesi gereken uyarılar (en az 3)
5. Önemli ekonomik göstergeler:
   - Enflasyon, faiz oranı, dolar kuru, altın fiyatı ve BIST 100 trendi

Tüm veriler GÜNCEL ve GERÇEK olmalı. Samimi ve anlaşılır bir dil kullan.`,
          },
        ],
        schema: quickAnalysisSchema,
      });
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [data, fadeAnim, slideAnim]);

  const sentimentColor = data?.sentiment === 'bullish'
    ? Colors.dark.positive
    : data?.sentiment === 'bearish'
    ? Colors.dark.negative
    : Colors.dark.riskMedium;

  const sentimentLabel = data?.sentiment === 'bullish'
    ? 'Yükseliş Beklentisi'
    : data?.sentiment === 'bearish'
    ? 'Düşüş Beklentisi'
    : 'Nötr Beklenti';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.dark.text} size={22} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Zap color={Colors.dark.accent} size={18} />
            <Text style={styles.topBarTitle}>Hızlı Analiz</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIcon}>
              <Zap color={Colors.dark.accent} size={32} />
            </View>
            <ActivityIndicator color={Colors.dark.primary} size="large" />
            <Text style={styles.loadingText}>Piyasalar analiz ediliyor...</Text>
            <Text style={styles.loadingSubtext}>Güncel veriler toplanıyor</Text>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <View style={[styles.sentimentCard, { borderColor: sentimentColor + '40' }]}>
                <View style={[styles.sentimentBadge, { backgroundColor: sentimentColor + '18' }]}>
                  {data.sentiment === 'bullish' ? (
                    <TrendingUp color={sentimentColor} size={20} />
                  ) : data.sentiment === 'bearish' ? (
                    <TrendingDown color={sentimentColor} size={20} />
                  ) : (
                    <Activity color={sentimentColor} size={20} />
                  )}
                  <Text style={[styles.sentimentLabel, { color: sentimentColor }]}>
                    {sentimentLabel}
                  </Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Piyasa Skoru</Text>
                  <Text style={[styles.scoreValue, { color: sentimentColor }]}>{data.sentimentScore}/100</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Piyasa Özeti</Text>
                <Text style={styles.summaryText}>{data.marketSummary}</Text>
              </View>

              {data.keyIndicators && data.keyIndicators.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Ekonomik Göstergeler</Text>
                  <View style={styles.indicatorGrid}>
                    {data.keyIndicators.map((ind, i) => {
                      const trendColor = ind.trend === 'up' ? Colors.dark.positive : ind.trend === 'down' ? Colors.dark.negative : Colors.dark.riskMedium;
                      return (
                        <View key={i} style={styles.indicatorCard}>
                          <Text style={styles.indicatorName}>{ind.name}</Text>
                          <Text style={styles.indicatorValue}>{ind.value}</Text>
                          <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
                            {ind.trend === 'up' ? (
                              <TrendingUp color={trendColor} size={12} />
                            ) : ind.trend === 'down' ? (
                              <TrendingDown color={trendColor} size={12} />
                            ) : (
                              <Activity color={trendColor} size={12} />
                            )}
                            <Text style={[styles.trendText, { color: trendColor }]}>{ind.impact}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.sectionHeader}>En İyi Fırsatlar</Text>
              {data.topOpportunities.map((opp, i) => {
                const riskColor = opp.riskLevel === 'low' ? Colors.dark.riskLow : opp.riskLevel === 'medium' ? Colors.dark.riskMedium : Colors.dark.riskHigh;
                const riskLabel = opp.riskLevel === 'low' ? 'Düşük' : opp.riskLevel === 'medium' ? 'Orta' : 'Yüksek';
                return (
                  <View key={i} style={styles.oppCard}>
                    <View style={styles.oppHeader}>
                      <View style={styles.oppNameRow}>
                        <Target color={Colors.dark.primary} size={16} />
                        <Text style={styles.oppName}>{opp.name}</Text>
                      </View>
                      <View style={[styles.riskBadge, { backgroundColor: riskColor + '15' }]}>
                        <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLabel} Risk</Text>
                      </View>
                    </View>
                    <Text style={styles.oppCategory}>{opp.category}</Text>
                    <Text style={styles.oppReason}>{opp.reason}</Text>
                    <View style={styles.oppPrices}>
                      <View style={styles.oppPriceItem}>
                        <Text style={styles.oppPriceLabel}>Mevcut</Text>
                        <Text style={styles.oppPriceValue}>{opp.currentPrice}</Text>
                      </View>
                      <View style={styles.oppPriceItem}>
                        <Text style={styles.oppPriceLabel}>Hedef</Text>
                        <Text style={[styles.oppPriceValue, { color: Colors.dark.primary }]}>{opp.targetPrice}</Text>
                      </View>
                      <View style={styles.oppPriceItem}>
                        <Text style={styles.oppPriceLabel}>Potansiyel</Text>
                        <Text style={[styles.oppPriceValue, { color: Colors.dark.positive }]}>{opp.potentialReturn}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <Text style={styles.sectionHeader}>Uyarılar</Text>
              {data.warnings.map((w, i) => (
                <View key={i} style={styles.warningCard}>
                  <AlertTriangle color={Colors.dark.warning} size={16} />
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}

              <View style={styles.disclaimer}>
                <Shield color={Colors.dark.textMuted} size={14} />
                <Text style={styles.disclaimerText}>
                  Bu analiz AI tarafından üretilmiştir ve yatırım tavsiyesi niteliği taşımaz.
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
    backgroundColor: Colors.dark.accentGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  loadingText: { fontSize: 16, fontWeight: '600' as const, color: Colors.dark.text },
  loadingSubtext: { fontSize: 13, color: Colors.dark.textMuted },
  scrollContent: { paddingHorizontal: 20 },
  sentimentCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 20,
    padding: 20, marginBottom: 16, borderWidth: 1.5,
  },
  sentimentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  sentimentLabel: { fontSize: 15, fontWeight: '700' as const },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 16,
  },
  scoreLabel: { fontSize: 14, color: Colors.dark.textMuted },
  scoreValue: { fontSize: 28, fontWeight: '800' as const },
  summaryCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.textSecondary, marginBottom: 8 },
  summaryText: { fontSize: 14, color: Colors.dark.text, lineHeight: 22 },
  sectionHeader: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 12, marginTop: 8 },
  indicatorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  indicatorCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14,
    minWidth: 100, flex: 1, borderWidth: 1, borderColor: Colors.dark.border, gap: 4,
  },
  indicatorName: { fontSize: 11, color: Colors.dark.textMuted },
  indicatorValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  trendText: { fontSize: 10, fontWeight: '600' as const },
  oppCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border, gap: 8,
  },
  oppHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oppNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  oppName: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  riskBadgeText: { fontSize: 11, fontWeight: '700' as const },
  oppCategory: { fontSize: 12, color: Colors.dark.textMuted, marginTop: -4 },
  oppReason: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 20 },
  oppPrices: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 10, padding: 12,
  },
  oppPriceItem: { alignItems: 'center', gap: 2 },
  oppPriceLabel: { fontSize: 10, color: Colors.dark.textMuted },
  oppPriceValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.dark.text },
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(251,191,36,0.06)', borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(251,191,36,0.1)',
  },
  warningText: { flex: 1, fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 20 },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 12, padding: 14, backgroundColor: Colors.dark.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: Colors.dark.textMuted, lineHeight: 16 },
});

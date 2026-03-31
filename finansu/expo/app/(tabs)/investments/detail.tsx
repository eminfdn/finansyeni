import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Target,
  BarChart3,
  Calendar,
  Activity,
  LineChart,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { fetchInvestmentDetail } from '@/services/marketData';
import { fetchPriceHistory } from '@/services/webScraper';
import PriceChart from '@/components/PriceChart';

const PERIODS = [
  { key: '1H', label: '1H' },
  { key: '1A', label: '1A' },
  { key: '3A', label: '3A' },
  { key: '6A', label: '6A' },
  { key: '1Y', label: '1Y' },
];

export default function InvestmentDetailScreen() {
  const router = useRouter();
  const { symbol, name } = useLocalSearchParams<{ symbol: string; name: string }>();
  const [selectedPeriod, setSelectedPeriod] = useState('1A');

  const { data, isLoading } = useQuery({
    queryKey: ['investment-detail', symbol],
    queryFn: () => fetchInvestmentDetail(symbol || '', name || ''),
    enabled: !!symbol && !!name,
  });

  const { data: priceHistory, isLoading: chartLoading } = useQuery({
    queryKey: ['price-history', symbol, selectedPeriod],
    queryFn: () => fetchPriceHistory(symbol || '', name || '', selectedPeriod),
    enabled: !!symbol && !!name,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [data, fadeAnim, slideAnim]);

  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
  }, []);

  const sentimentColor = data?.overallSentiment === 'bullish'
    ? Colors.dark.positive
    : data?.overallSentiment === 'bearish'
    ? Colors.dark.negative
    : Colors.dark.riskMedium;

  const sentimentLabel = data?.overallSentiment === 'bullish'
    ? 'Yükseliş'
    : data?.overallSentiment === 'bearish'
    ? 'Düşüş'
    : 'Nötr';

  let sourceLabel = '';
  if (symbol) {
    if (['XAU/TRY', 'USD/TRY', 'EUR/TRY', 'GBP/TRY', 'XAG/TRY'].includes(symbol)) {
      sourceLabel = 'bigpara.hurriyet.com.tr';
    } else if (['XU100', 'BIST30'].includes(symbol)) {
      sourceLabel = 'uzmanpara.milliyet.com.tr';
    } else if (['BTC/USD', 'ETH/USD'].includes(symbol)) {
      sourceLabel = 'tr.investing.com';
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <ArrowLeft color={Colors.dark.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{name || symbol}</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.dark.primary} size="large" />
            <Text style={styles.loadingText}>Güncel veriler yükleniyor...</Text>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>{symbol}</Text>
                <Text style={styles.priceMain}>{data.currentPrice} {data.currency}</Text>
                <View style={styles.priceChangeRow}>
                  {data.isPositive ? (
                    <TrendingUp color={Colors.dark.positive} size={18} />
                  ) : (
                    <TrendingDown color={Colors.dark.negative} size={18} />
                  )}
                  <Text style={[styles.priceChange, { color: data.isPositive ? Colors.dark.positive : Colors.dark.negative }]}>
                    {data.dailyChange} ({data.dailyChangePercent})
                  </Text>
                </View>
                <View style={[styles.sentimentBadge, { backgroundColor: sentimentColor + '18' }]}>
                  <Text style={[styles.sentimentText, { color: sentimentColor }]}>
                    Piyasa Beklentisi: {sentimentLabel}
                  </Text>
                </View>
                {sourceLabel ? (
                  <Text style={styles.sourceLabel}>Kaynak: {sourceLabel}</Text>
                ) : null}
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartTitleRow}>
                    <LineChart color={Colors.dark.primary} size={18} />
                    <Text style={styles.chartTitle}>Fiyat Grafiği</Text>
                  </View>
                  <View style={styles.periodRow}>
                    {PERIODS.map(p => (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.periodBtn,
                          selectedPeriod === p.key && styles.periodBtnActive,
                        ]}
                        onPress={() => handlePeriodChange(p.key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.periodBtnText,
                            selectedPeriod === p.key && styles.periodBtnTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {chartLoading ? (
                  <View style={styles.chartLoading}>
                    <ActivityIndicator color={Colors.dark.primary} size="small" />
                    <Text style={styles.chartLoadingText}>Grafik yükleniyor...</Text>
                  </View>
                ) : priceHistory && priceHistory.history.length > 0 ? (
                  <PriceChart
                    data={priceHistory.history}
                    currentPrice={priceHistory.currentPrice}
                    highestPrice={priceHistory.highestPrice}
                    lowestPrice={priceHistory.lowestPrice}
                    isPositive={data.isPositive}
                  />
                ) : (
                  <View style={styles.chartLoading}>
                    <Text style={styles.chartLoadingText}>Grafik verisi bulunamadı</Text>
                  </View>
                )}
              </View>

              <View style={styles.rangeCard}>
                <Text style={styles.sectionTitle}>Günlük Aralık</Text>
                <View style={styles.rangeRow}>
                  <Text style={styles.rangeValue}>{data.dailyLow}</Text>
                  <View style={styles.rangeBar}>
                    <View style={styles.rangeBarFill} />
                  </View>
                  <Text style={styles.rangeValue}>{data.dailyHigh}</Text>
                </View>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Haftalık Aralık</Text>
                <View style={styles.rangeRow}>
                  <Text style={styles.rangeValue}>{data.weekLow}</Text>
                  <View style={styles.rangeBar}>
                    <View style={[styles.rangeBarFill, { width: '65%', backgroundColor: Colors.dark.accent }]} />
                  </View>
                  <Text style={styles.rangeValue}>{data.weekHigh}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Performans</Text>
              <View style={styles.perfGrid}>
                {[
                  { label: '1 Hafta', value: data.weekPerformance, icon: Calendar },
                  { label: '1 Ay', value: data.monthPerformance, icon: Calendar },
                  { label: '3 Ay', value: data.threeMonthPerformance, icon: BarChart3 },
                  { label: '6 Ay', value: data.sixMonthPerformance, icon: Activity },
                  { label: '1 Yıl', value: data.yearPerformance, icon: TrendingUp },
                ].map((p, i) => {
                  const isPos = p.value.startsWith('+');
                  return (
                    <View key={i} style={styles.perfItem}>
                      <p.icon color={Colors.dark.textMuted} size={14} />
                      <Text style={styles.perfLabel}>{p.label}</Text>
                      <Text style={[styles.perfValue, { color: isPos ? Colors.dark.positive : Colors.dark.negative }]}>
                        {p.value}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.levelCard}>
                <Text style={styles.sectionTitle}>Teknik Seviyeler</Text>
                <View style={styles.levelRow}>
                  <View style={styles.levelItem}>
                    <Shield color={Colors.dark.positive} size={16} />
                    <Text style={styles.levelLabel}>Destek</Text>
                    <Text style={styles.levelValue}>{data.supportLevel}</Text>
                  </View>
                  <View style={styles.levelDivider} />
                  <View style={styles.levelItem}>
                    <Target color={Colors.dark.negative} size={16} />
                    <Text style={styles.levelLabel}>Direnç</Text>
                    <Text style={styles.levelValue}>{data.resistanceLevel}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.analysisCard}>
                <Text style={styles.sectionTitle}>Teknik Analiz</Text>
                <Text style={styles.analysisText}>{data.technicalSummary}</Text>
              </View>

              <View style={styles.analysisCard}>
                <Text style={styles.sectionTitle}>Temel Analiz</Text>
                <Text style={styles.analysisText}>{data.fundamentalSummary}</Text>
              </View>

              <Text style={styles.sectionHeader}>Risk Faktörleri</Text>
              {data.riskFactors.map((risk, i) => (
                <View key={i} style={styles.riskItem}>
                  <AlertTriangle color={Colors.dark.warning} size={16} />
                  <Text style={styles.riskItemText}>{risk}</Text>
                </View>
              ))}

              <Text style={styles.sectionHeader}>Öneriler</Text>
              {data.recommendations.map((rec, i) => (
                <View key={i} style={styles.recItem}>
                  <View style={styles.recDot} />
                  <Text style={styles.recItemText}>{rec}</Text>
                </View>
              ))}

              <View style={styles.expectationCard}>
                <Text style={styles.sectionTitle}>Piyasa Beklentisi</Text>
                <Text style={styles.analysisText}>{data.marketExpectation}</Text>
              </View>

              <View style={styles.disclaimer}>
                <AlertTriangle color={Colors.dark.warning} size={14} />
                <Text style={styles.disclaimerText}>
                  Bu bilgiler yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz.
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </Animated.View>
          </ScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Veri bulunamadı</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  priceCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  priceMain: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -1,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sentimentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  sentimentText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  sourceLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chartHeader: {
    marginBottom: 16,
    gap: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  chartLoading: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartLoadingText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  rangeCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  rangeValue: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600' as const,
    width: 70,
  },
  rangeBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rangeBarFill: {
    width: '50%',
    height: 6,
    backgroundColor: Colors.dark.primary,
    borderRadius: 3,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  perfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  perfItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  perfLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  perfValue: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  levelCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  levelItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  levelDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },
  levelLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  analysisCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  analysisText: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 22,
    marginTop: 4,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  riskItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
    marginTop: 6,
  },
  recItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  expectationCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.dark.warning,
    lineHeight: 16,
  },
});

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Shield,
  Target,
  Gem,
  DollarSign,
  BarChart3,
  CircleDollarSign,
  Landmark,
  Coins,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { fetchLiveMarketData, LiveMarketData } from '@/services/marketData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const iconMap: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  'XAU/TRY': Gem,
  'USD/TRY': DollarSign,
  'EUR/TRY': CircleDollarSign,
  'XU100': BarChart3,
  'BTC/USD': Coins,
  'XAG/TRY': Target,
  'GBP/TRY': Landmark,
};

const categoryColors: Record<string, string> = {
  'XAU/TRY': '#F59E0B',
  'USD/TRY': '#3B82F6',
  'EUR/TRY': '#8B5CF6',
  'XU100': '#EF4444',
  'BTC/USD': '#F97316',
  'XAG/TRY': '#9CA3AF',
  'GBP/TRY': '#06B6D4',
};

function getRiskBadge(changePercent: string) {
  const val = parseFloat(changePercent.replace('%', '').replace(',', '.').replace('+', ''));
  if (Math.abs(val) < 1) return { label: 'Düşük Risk', color: Colors.dark.riskLow };
  if (Math.abs(val) < 3) return { label: 'Orta Risk', color: Colors.dark.riskMedium };
  return { label: 'Yüksek Risk', color: Colors.dark.riskHigh };
}

const MarketCard = React.memo(({ item, index, onPress }: { item: LiveMarketData; index: number; onPress: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index]);

  const risk = getRiskBadge(item.changePercent);
  const IconComp = iconMap[item.symbol] || TrendingUp;
  const accentColor = categoryColors[item.symbol] || Colors.dark.accent;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardInner}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
            <IconComp color={accentColor} size={20} />
          </View>
          <View style={[styles.riskBadge, { backgroundColor: risk.color + '18' }]}>
            <Text style={[styles.riskBadgeText, { color: risk.color }]}>{risk.label}</Text>
          </View>
        </View>

        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>

        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardPriceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Fiyat</Text>
            <Text style={styles.priceValue}>{item.priceFormatted}</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Değişim</Text>
            <View style={styles.changeRow}>
              {item.isPositive ? (
                <TrendingUp color={Colors.dark.positive} size={12} />
              ) : (
                <TrendingDown color={Colors.dark.negative} size={12} />
              )}
              <Text style={[styles.changeValue, { color: item.isPositive ? Colors.dark.positive : Colors.dark.negative }]}>
                {item.changePercent}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.volumeRow}>
          <Text style={styles.volumeLabel}>Hacim: {item.volume}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.perfDots}>
            {[item.weeklyChange, item.monthlyChange, item.yearlyChange].map((change, i) => {
              const isPos = change.startsWith('+');
              return (
                <View
                  key={i}
                  style={[styles.perfDot, { backgroundColor: isPos ? Colors.dark.positive : Colors.dark.negative }]}
                />
              );
            })}
          </View>
          <View style={styles.detailLink}>
            <Text style={styles.detailLinkText}>Detaylar</Text>
            <ChevronRight color={Colors.dark.primary} size={14} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function InvestmentsScreen() {
  const router = useRouter();

  const { data: marketData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['live-market-data'],
    queryFn: fetchLiveMarketData,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const totalInvestment = '₺100.000';
  const estimatedReturn = marketData
    ? `₺${(100000 * 0.15).toLocaleString('tr-TR')} - ₺${(100000 * 0.42).toLocaleString('tr-TR')}`
    : '---';
  const sectorCount = marketData ? new Set(marketData.map(m => m.category)).size : 0;

  const handleItemPress = useCallback((item: LiveMarketData) => {
    router.push({
      pathname: '/(tabs)/investments/detail' as never,
      params: { symbol: item.symbol, name: item.name },
    } as never);
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.dark.primary}
            />
          }
        >
          <Animated.View style={[styles.header, { opacity: headerFade }]}>
            <Text style={styles.title}>Yatırım Araçları</Text>
            <Text style={styles.headerSubtitle}>Güncel piyasa verileri</Text>
          </Animated.View>

          <Animated.View style={[styles.summaryRow, { opacity: headerFade }]}>
            <View style={styles.summaryCard}>
              <CircleDollarSign color={Colors.dark.primary} size={20} />
              <Text style={styles.summaryLabel}>Referans</Text>
              <Text style={styles.summaryValue}>{totalInvestment}</Text>
            </View>
            <View style={styles.summaryCard}>
              <TrendingUp color={Colors.dark.positive} size={20} />
              <Text style={styles.summaryLabel}>Tahmini Kazanç</Text>
              <Text style={styles.summaryValueSmall}>{estimatedReturn}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Shield color={Colors.dark.accent} size={20} />
              <Text style={styles.summaryLabel}>Sektör</Text>
              <Text style={styles.summaryValue}>{sectorCount} alan</Text>
            </View>
          </Animated.View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.dark.primary} size="large" />
              <Text style={styles.loadingText}>Güncel piyasa verileri yükleniyor...</Text>
            </View>
          ) : marketData && marketData.length > 0 ? (
            <View style={styles.grid}>
              {marketData.map((item, index) => (
                <MarketCard
                  key={item.symbol}
                  item={item}
                  index={index}
                  onPress={() => handleItemPress(item)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <RefreshCw color={Colors.dark.textMuted} size={40} />
              <Text style={styles.emptyText}>Veriler yüklenemedi</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryBtnText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  summaryValueSmall: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.primary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardInner: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  cardCategory: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: -4,
  },
  cardDescription: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  cardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  priceBlock: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 9,
    color: Colors.dark.textMuted,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  changeValue: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  volumeRow: {
    marginTop: 2,
  },
  volumeLabel: {
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  perfDots: {
    flexDirection: 'row',
    gap: 4,
  },
  perfDot: {
    width: 14,
    height: 5,
    borderRadius: 3,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailLinkText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textMuted,
  },
  retryBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
});

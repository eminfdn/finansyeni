import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Sparkles,
  Activity,
  Quote,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { fetchLiveMarketData, LiveMarketData } from '@/services/marketData';
import { getDailyQuote } from '@/constants/quotes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const quotePulse = useRef(new Animated.Value(1)).current;
  const [currentTime, setCurrentTime] = useState('');
  const dailyQuote = getDailyQuote();

  const { data: marketData, refetch, isRefetching } = useQuery({
    queryKey: ['live-market-data'],
    queryFn: fetchLiveMarketData,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const topMarkets = (marketData || []).slice(0, 6);

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) setCurrentTime('Günaydın');
    else if (hours < 18) setCurrentTime('İyi günler');
    else setCurrentTime('İyi akşamlar');

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(quoteAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(quotePulse, { toValue: 0.97, duration: 2000, useNativeDriver: true }),
        Animated.timing(quotePulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, quoteAnim, quotePulse]);

  const firstName = profile?.name ? profile.name.split(' ')[0] : '';
  const greeting = firstName ? `${currentTime}, ${firstName}!` : `${currentTime}!`;

  const handleFeaturePress = useCallback((route: string) => {
    router.push(route as never);
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
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>
              Bugün piyasalar nasıl gidiyor bir bakalım
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.quoteCard,
              {
                opacity: quoteAnim,
                transform: [{ scale: quotePulse }],
              },
            ]}
          >
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quoteGradient}
            >
              <Quote color={Colors.dark.accent} size={20} />
              <Text style={styles.quoteText}>{dailyQuote}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.ctaCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7', '#0369A1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <View style={styles.ctaTextArea}>
                  <View style={styles.ctaIconRow}>
                    <Sparkles color="rgba(255,255,255,0.9)" size={20} />
                    <Text style={styles.ctaTitle}>AI Yatırım Analizi</Text>
                  </View>
                  <Text style={styles.ctaDescription}>
                    Sana özel yatırım fırsatlarını yapay zeka ile keşfedelim
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => router.push('/(tabs)/analyze')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ctaButtonText}>Hadi Başlayalım</Text>
                  <ArrowRight color={Colors.dark.primary} size={18} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.featuresRow}>
            {[
              { icon: Zap, label: 'Hızlı\nAnaliz', color: '#F59E0B', route: '/quick-analysis' },
              { icon: Shield, label: 'Risk\nYönetimi', color: '#3B82F6', route: '/risk-management' },
              { icon: BarChart3, label: 'Portföy\nÖnerisi', color: '#0EA5E9', route: '/portfolio-suggestion' },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.featureCard}
                activeOpacity={0.7}
                onPress={() => handleFeaturePress(item.route)}
              >
                <View style={[styles.featureIcon, { backgroundColor: item.color + '18' }]}>
                  <item.icon color={item.color} size={22} />
                </View>
                <Text style={styles.featureLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Piyasa Özeti</Text>
            <View style={styles.liveBadge}>
              <Activity color={Colors.dark.primary} size={12} />
              <Text style={styles.sectionBadge}>Canlı</Text>
            </View>
          </View>

          {topMarkets.length > 0 ? (
            <View style={styles.marketGrid}>
              {topMarkets.map((item: LiveMarketData, index: number) => (
                <MarketCardMini key={item.symbol} item={item} index={index} />
              ))}
            </View>
          ) : (
            <View style={styles.marketPlaceholder}>
              <Text style={styles.placeholderText}>Piyasa verileri yükleniyor...</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewAllLink}
            onPress={() => router.push('/(tabs)/investments')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Tüm Yatırım Araçları</Text>
            <ChevronRight color={Colors.dark.primary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyLink}
            onPress={() => router.push('/(tabs)/history')}
            activeOpacity={0.7}
          >
            <Text style={styles.historyLinkText}>Geçmiş Analizleriniz</Text>
            <ChevronRight color={Colors.dark.textMuted} size={20} />
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const MarketCardMini = React.memo(({ item, index }: { item: LiveMarketData; index: number }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: 200 + index * 80,
      useNativeDriver: true,
    }).start();
  }, [cardAnim, index]);

  return (
    <Animated.View
      style={[
        styles.marketCard,
        {
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.marketCardHeader}>
        <Text style={styles.marketSymbol}>{item.symbol}</Text>
        {item.isPositive ? (
          <TrendingUp color={Colors.dark.positive} size={16} />
        ) : (
          <TrendingDown color={Colors.dark.negative} size={16} />
        )}
      </View>
      <Text style={styles.marketName}>{item.name}</Text>
      <Text style={styles.marketPrice}>{item.priceFormatted}</Text>
      <View
        style={[
          styles.changeBadge,
          {
            backgroundColor: item.isPositive
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(239,68,68,0.12)',
          },
        ]}
      >
        <Text
          style={[
            styles.changeText,
            {
              color: item.isPositive
                ? Colors.dark.positive
                : Colors.dark.negative,
            },
          ]}
        >
          {item.changePercent}
        </Text>
      </View>
    </Animated.View>
  );
});

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
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  quoteCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quoteGradient: {
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.accent,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  ctaCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: 24,
    borderRadius: 20,
  },
  ctaContent: {
    gap: 16,
  },
  ctaTextArea: {
    gap: 8,
  },
  ctaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.primaryDim,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.primary,
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  marketCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 6,
  },
  marketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketSymbol: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    letterSpacing: 0.5,
  },
  marketName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  marketPrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -0.3,
  },
  changeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  marketPlaceholder: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.primaryGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary + '30',
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.primary,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyLinkText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
});

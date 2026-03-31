import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
  Target,
  Trash2,
  ChevronRight,
  BarChart3,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { riskLabels } from '@/constants/mockData';
import { useUser } from '@/contexts/UserContext';
import { AnalysisResult } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const HistoryItem = React.memo(
  ({ item, index, onPress }: { item: AnalysisResult; index: number; onPress: () => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim, index]);

    const riskColor =
      item.overallRisk === 'low'
        ? Colors.dark.riskLow
        : item.overallRisk === 'medium'
        ? Colors.dark.riskMedium
        : Colors.dark.riskHigh;

    const RiskIcon =
      item.overallRisk === 'low'
        ? Shield
        : item.overallRisk === 'high'
        ? AlertTriangle
        : Target;

    return (
      <Animated.View
        style={[
          styles.historyCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.historyCardInner}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.historyTop}>
            <View style={styles.historyAmountRow}>
              <Text style={styles.historyAmount}>
                ₺{item.amount.toLocaleString('tr-TR')}
              </Text>
              <View style={[styles.riskBadge, { backgroundColor: riskColor + '18' }]}>
                <RiskIcon color={riskColor} size={12} />
                <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                  {riskLabels[item.overallRisk]}
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.dark.textMuted} size={18} />
          </View>

          <Text style={styles.historySummary} numberOfLines={2}>
            {item.summary}
          </Text>

          <View style={styles.historyBottom}>
            <View style={styles.historyMeta}>
              <TrendingUp color={Colors.dark.primary} size={14} />
              <Text style={styles.historyReturn}>{item.totalEstimatedReturn}</Text>
            </View>
            <View style={styles.historyMeta}>
              <BarChart3 color={Colors.dark.textMuted} size={14} />
              <Text style={styles.historyCount}>{item.recommendations.length} öneri</Text>
            </View>
            <View style={styles.historyMeta}>
              <Clock color={Colors.dark.textMuted} size={13} />
              <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export default function HistoryScreen() {
  const router = useRouter();
  const { analysisHistory, clearHistory } = useUser();

  const handleClear = useCallback(() => {
    Alert.alert(
      'Geçmişi Temizle',
      'Tüm analiz geçmişiniz silinecektir. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Temizle', style: 'destructive', onPress: () => clearHistory() },
      ]
    );
  }, [clearHistory]);

  const handleItemPress = useCallback(
    (id: string) => {
      router.push({
        pathname: '/(tabs)/analyze/result',
        params: { analysisId: id },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: AnalysisResult; index: number }) => (
      <HistoryItem item={item} index={index} onPress={() => handleItemPress(item.id)} />
    ),
    [handleItemPress]
  );

  const keyExtractor = useCallback((item: AnalysisResult) => item.id, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Geçmiş</Text>
            <Text style={styles.subtitle}>{analysisHistory.length} analiz kayıtlı</Text>
          </View>
          {analysisHistory.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
              <Trash2 color={Colors.dark.danger} size={18} />
            </TouchableOpacity>
          )}
        </View>

        {analysisHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Clock color={Colors.dark.textMuted} size={40} />
            </View>
            <Text style={styles.emptyTitle}>Henüz analiz yok</Text>
            <Text style={styles.emptySubtitle}>İlk yatırım analizinizi yaparak başlayın</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/analyze')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Analiz Yap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={analysisHistory}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  historyCard: {
    marginBottom: 12,
  },
  historyCardInner: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  historySummary: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  historyBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyReturn: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.primary,
  },
  historyCount: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

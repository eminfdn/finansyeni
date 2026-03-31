import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Search,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  CircleDollarSign,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { Colors } from '@/constants/colors';
import { quickAmounts, riskLabels } from '@/constants/mockData';
import { useUser } from '@/contexts/UserContext';
import { AnalysisResult, InvestmentRecommendation } from '@/types';

const recommendationSchema = z.object({
  summary: z.string(),
  marketCondition: z.string(),
  totalEstimatedReturn: z.string(),
  overallRisk: z.enum(['low', 'medium', 'high']),
  recommendations: z.array(
    z.object({
      name: z.string(),
      category: z.enum([
        'stock', 'bond', 'gold', 'forex', 'crypto',
        'realestate', 'fund', 'deposit', 'commodity',
      ]),
      allocation: z.number(),
      estimatedReturn: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
      description: z.string(),
      reasoning: z.string(),
      timeHorizon: z.string(),
    })
  ),
});

function formatAmount(value: string): string {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('tr-TR');
}

function parseAmount(value: string): number {
  return Number(value.replace(/[^0-9]/g, '')) || 0;
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const { profile, saveAnalysis } = useUser();
  const [amount, setAmount] = useState('');
  const [riskPref, setRiskPref] = useState<'low' | 'medium' | 'high'>('medium');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseAmount(amount);
      if (numAmount <= 0) throw new Error('Lütfen geçerli bir tutar girin');

      startPulse();

      const riskText = riskPref === 'low' ? 'düşük riskli, güvenli' :
        riskPref === 'medium' ? 'orta riskli, dengeli' :
        'yüksek riskli, agresif';

      const userContext = profile
        ? `Kullanıcı bilgileri: İsim: ${profile.name}, Yaş: ${profile.age || 'belirtilmedi'}, Meslek: ${profile.occupation || 'belirtilmedi'}, Risk toleransı: ${profile.riskTolerance}, Yatırım hedefi: ${profile.investmentGoal}, Aylık gelir: ${profile.monthlyIncome} TL, Aylık yatırım bütçesi: ${profile.investmentBudget} TL.`
        : '';

      const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Sen profesyonel bir yatırım danışmanısın. Türkiye piyasasında uzmanlaştın. Bugün: ${dateStr}.
            
${userContext}

Kullanıcının yatırım bütçesi: ${numAmount.toLocaleString('tr-TR')} TL
Risk tercihi: ${riskText}

Bu bütçeye ve risk tercihine uygun en iyi yatırım portföyü önerisi yap. GÜNCEL Türkiye piyasa koşullarını, enflasyon oranını, faiz oranlarını, döviz kurlarını ve altın fiyatlarını dikkate al.

Her öneri için:
- Yatırım aracının adı (spesifik olarak, örn: "BIST 30 ETF", "Gram Altın", "USD/TRY")
- Kategori
- Portföy içindeki yüzde dağılımı (allocation, toplam 100 olmalı)
- Tahmini yıllık getiri yüzdesi
- Risk seviyesi
- Neden bu yatırımı önerdiğinin detaylı açıklaması
- Yatırım süresi önerisi

Ayrıca:
- Genel piyasa durumu özeti
- Toplam tahmini getiri
- Genel risk seviyesi
- En az 4, en fazla 7 yatırım aracı öner
- Çeşitlendirilmiş bir portföy oluştur

ÖNEMLİ: Fiyatlar 2026 yılının güncel verileri olmalı.
Kullanıcıyla samimi bir dil kullan, sanki bir arkadaşına tavsiye veriyormuş gibi yaz.`,
          },
        ],
        schema: recommendationSchema,
      });

      return result;
    },
    onSuccess: (data) => {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      const numAmount = parseAmount(amount);
      const analysis: AnalysisResult = {
        id: Date.now().toString(),
        amount: numAmount,
        currency: 'TRY',
        recommendations: data.recommendations.map((r, i) => ({
          ...r,
          id: `${Date.now()}-${i}`,
        })) as InvestmentRecommendation[],
        summary: data.summary,
        totalEstimatedReturn: data.totalEstimatedReturn,
        overallRisk: data.overallRisk,
        createdAt: new Date().toISOString(),
        marketCondition: data.marketCondition,
      };

      saveAnalysis(analysis);
      router.push({
        pathname: '/(tabs)/analyze/result',
        params: { analysisId: analysis.id },
      });
    },
    onError: () => {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    },
  });

  const handleAmountChange = useCallback((text: string) => {
    setAmount(formatAmount(text));
  }, []);

  const handleQuickAmount = useCallback((val: number) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setAmount(val.toLocaleString('tr-TR'));
  }, [scaleAnim]);

  const isValid = parseAmount(amount) >= 1000;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Sparkles color={Colors.dark.primary} size={24} />
              </View>
              <Text style={styles.title}>Yatırım Analizi</Text>
              <Text style={styles.subtitle}>
                Bütçeni gir, sana özel yatırım planını hazırlayalım
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Ne kadar yatırım yapmak istiyorsun?</Text>
              <View style={styles.inputRow}>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyText}>₺</Text>
                </View>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="10.000"
                  placeholderTextColor={Colors.dark.textMuted}
                  maxLength={15}
                />
              </View>
              {amount.length > 0 && parseAmount(amount) < 1000 && (
                <Text style={styles.errorText}>Minimum 1.000 ₺ giriniz</Text>
              )}
            </View>

            <Text style={styles.quickLabel}>Hızlı Seçim</Text>
            <Animated.View style={[styles.quickGrid, { transform: [{ scale: scaleAnim }] }]}>
              {quickAmounts.map((val) => {
                const isSelected = parseAmount(amount) === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.quickChip,
                      isSelected && styles.quickChipActive,
                    ]}
                    onPress={() => handleQuickAmount(val)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        isSelected && styles.quickChipTextActive,
                      ]}
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>

            <View style={styles.riskSection}>
              <Text style={styles.inputLabel}>Risk Tercihin</Text>
              <View style={styles.riskRow}>
                {(['low', 'medium', 'high'] as const).map((level) => {
                  const isActive = riskPref === level;
                  const icon = level === 'low' ? Shield : level === 'medium' ? TrendingUp : Sparkles;
                  const IconComp = icon;
                  const color = level === 'low' ? Colors.dark.riskLow :
                    level === 'medium' ? Colors.dark.riskMedium : Colors.dark.riskHigh;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.riskCard,
                        isActive && { borderColor: color, backgroundColor: color + '15' },
                      ]}
                      onPress={() => setRiskPref(level)}
                      activeOpacity={0.7}
                    >
                      <IconComp color={isActive ? color : Colors.dark.textMuted} size={20} />
                      <Text
                        style={[
                          styles.riskText,
                          isActive && { color },
                        ]}
                      >
                        {riskLabels[level]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.analyzeButton, !isValid && styles.analyzeButtonDisabled]}
              onPress={() => analysisMutation.mutate()}
              disabled={!isValid || analysisMutation.isPending}
              activeOpacity={0.8}
            >
              {analysisMutation.isPending ? (
                <Animated.View style={[styles.analyzeButtonInner, { opacity: pulseAnim }]}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.analyzeButtonText}>Analiz Ediliyor...</Text>
                </Animated.View>
              ) : (
                <LinearGradient
                  colors={isValid ? ['#0EA5E9', '#0284C7'] : [Colors.dark.surfaceLight, Colors.dark.surfaceLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.analyzeGradient}
                >
                  <Search color={isValid ? '#fff' : Colors.dark.textMuted} size={20} />
                  <Text
                    style={[
                      styles.analyzeButtonText,
                      !isValid && { color: Colors.dark.textMuted },
                    ]}
                  >
                    Analiz Et
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {analysisMutation.isError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorCardText}>
                  {analysisMutation.error?.message || 'Bir hata oluştu. Tekrar deneyin.'}
                </Text>
              </View>
            )}

            <View style={styles.infoCards}>
              {[
                { icon: CircleDollarSign, title: 'Çeşitlendirilmiş', desc: 'Portföy dağılımı önerileri' },
                { icon: TrendingUp, title: 'Güncel Veriler', desc: 'Canlı piyasa analizine dayalı' },
                { icon: Clock, title: 'Anlık Sonuç', desc: 'Saniyeler içinde AI analizi' },
              ].map((item, idx) => (
                <View key={idx} style={styles.infoCard}>
                  <item.icon color={Colors.dark.primary} size={20} />
                  <View style={styles.infoCardText}>
                    <Text style={styles.infoTitle}>{item.title}</Text>
                    <Text style={styles.infoDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.dark.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  currencyBadge: {
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.dark.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickChipActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryGlow,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  quickChipTextActive: {
    color: Colors.dark.primary,
  },
  riskSection: {
    marginBottom: 28,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 10,
  },
  riskCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  riskText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    borderRadius: 16,
  },
  analyzeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorCardText: {
    fontSize: 13,
    color: Colors.dark.danger,
    textAlign: 'center',
  },
  infoCards: {
    gap: 10,
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoCardText: {
    gap: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  infoDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
});

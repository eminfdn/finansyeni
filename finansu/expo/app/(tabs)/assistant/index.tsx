import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Send, Sparkles, TrendingUp, Shield, AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { createRorkTool, useRorkAgent } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { fetchRealMarketData } from '@/services/webScraper';
import { fetchLiveMarketData } from '@/services/marketData';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const QUICK_PROMPTS = [
  { label: 'Altın yatırımı yapmalı mıyım?', icon: TrendingUp },
  { label: 'Portföyüm için risk analizi', icon: Shield },
  { label: 'Dolar mı Euro mu almalıyım?', icon: AlertTriangle },
  { label: 'Kripto para tavsiyeleri', icon: Sparkles },
];

export default function AssistantScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const [marketContext, setMarketContext] = useState<string>('');

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  useEffect(() => {
    void loadMarketContext();
  }, []);

  const loadMarketContext = async () => {
    try {
      const [realData, liveData] = await Promise.all([
        fetchRealMarketData().catch(() => null),
        fetchLiveMarketData().catch(() => []),
      ]);

      let ctx = 'GÜNCEL PİYASA VERİLERİ:\n';

      if (realData) {
        if (realData.gold) ctx += `Gram Altın: Alış ${realData.gold.buy}, Satış ${realData.gold.sell}, Değişim ${realData.gold.changePercent}\n`;
        if (realData.dollar) ctx += `Dolar: Alış ${realData.dollar.buy}, Satış ${realData.dollar.sell}, Değişim ${realData.dollar.changePercent}\n`;
        if (realData.euro) ctx += `Euro: Alış ${realData.euro.buy}, Satış ${realData.euro.sell}, Değişim ${realData.euro.changePercent}\n`;
        if (realData.sterling) ctx += `Sterlin: Alış ${realData.sterling.buy}, Satış ${realData.sterling.sell}, Değişim ${realData.sterling.changePercent}\n`;
        if (realData.bist100) ctx += `BIST 100: ${realData.bist100.value}, Değişim ${realData.bist100.changePercent}\n`;
        if (realData.bitcoin) ctx += `Bitcoin: ${realData.bitcoin.price}, Değişim ${realData.bitcoin.changePercent}\n`;
        if (realData.ethereum) ctx += `Ethereum: ${realData.ethereum.price}, Değişim ${realData.ethereum.changePercent}\n`;
      }

      if (liveData && liveData.length > 0) {
        ctx += '\nDETAYLI VERİLER:\n';
        liveData.forEach(m => {
          ctx += `${m.name} (${m.symbol}): ${m.priceFormatted}, Değişim: ${m.changePercent}, Hacim: ${m.volume}, Haftalık: ${m.weeklyChange}, Aylık: ${m.monthlyChange}, Yıllık: ${m.yearlyChange}\n`;
        });
      }

      setMarketContext(ctx);
      console.log('Market context loaded for AI assistant');
    } catch (error) {
      console.log('Failed to load market context:', error);
    }
  };

  const userProfileContext = profile
    ? `KULLANICI PROFİLİ: İsim: ${profile.name}, Risk Toleransı: ${profile.riskTolerance}, Aylık Gelir: ${profile.monthlyIncome > 0 ? `₺${profile.monthlyIncome.toLocaleString('tr-TR')}` : 'Belirtilmedi'}, Yatırım Bütçesi: ${profile.investmentBudget > 0 ? `₺${profile.investmentBudget.toLocaleString('tr-TR')}` : 'Belirtilmedi'}, Meslek: ${profile.occupation || 'Belirtilmedi'}, Yaş: ${profile.age || 'Belirtilmedi'}, Yatırım Hedefi: ${profile.investmentGoal || 'Belirtilmedi'}`
    : '';

  const systemPrompt = `Sen YatırımPro uygulamasının AI yatırım danışmanısın. Adın "Finans Asistan". Türkçe konuş.

${marketContext}

${userProfileContext}

GÖREVLER:
1. Kullanıcıya yatırım önerileri sun - güncel piyasa verilerine dayalı
2. Risk faktörlerini DETAYLI açıkla - her yatırım aracı için olası riskler, volatilite, makroekonomik riskler
3. Altın ve döviz bilgileri bigpara.hurriyet.com.tr'den, borsa bilgileri uzmanpara.milliyet.com.tr'den, kripto bilgileri tr.investing.com'dan alınıyor
4. Kullanıcının profiline göre kişiselleştirilmiş öneriler ver
5. Sohbet havasında, samimi ama profesyonel konuş
6. Her zaman risk uyarısı yap - "Bu bilgiler yatırım tavsiyesi değildir" şeklinde

ÖNEMLI KURALLAR:
- Yatırım önerirken HER ZAMAN risk faktörlerini detaylı açıkla
- Tahmini getiri VE tahmini kayıp oranlarını belirt
- Kısa/orta/uzun vade ayrımı yap
- Portföy çeşitlendirmesi öner
- Kullanıcının risk toleransına uygun öneriler ver
- Güncel piyasa verilerini referans göster
- Samimi ve arkadaşça konuş, "dostum", "sana şunu söyleyeyim" gibi ifadeler kullan`;

  const { messages, sendMessage, setMessages } = useRorkAgent({
    tools: {
      getMarketData: createRorkTool({
        description: 'Güncel piyasa verilerini getir',
        zodSchema: z.object({
          category: z.enum(['all', 'gold', 'forex', 'crypto', 'stock']).describe('Veri kategorisi'),
        }),
        async execute() {
          return marketContext || 'Piyasa verileri yükleniyor...';
        },
      }),
      getRiskAnalysis: createRorkTool({
        description: 'Belirli bir yatırım aracı için risk analizi yap',
        zodSchema: z.object({
          instrument: z.string().describe('Yatırım aracı adı'),
          amount: z.number().describe('Yatırım miktarı (TRY)').optional(),
        }),
        async execute(input) {
          return `Yatırım aracı: ${input.instrument}, Miktar: ${input.amount || 0} TRY\n${marketContext}\n${userProfileContext}`;
        },
      }),
    },
  });

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const msg = input.trim();
    sendMessage(msg);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, sendMessage, messages.length, systemPrompt]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    sendMessage(prompt);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [sendMessage, messages.length, systemPrompt]);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMessages([]);
  }, [setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages]);

  const isAssistantTyping = messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].parts.some(p => p.type === 'tool' && (p.state === 'input-streaming' || p.state === 'input-available'));

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push('/(tabs)/(home)')}
              activeOpacity={0.7}
            >
              <ArrowLeft color={Colors.dark.text} size={18} />
            </TouchableOpacity>
            <View style={styles.botAvatar}>
              <Bot color={Colors.dark.primary} size={22} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Finans Asistan</Text>
              <Text style={styles.headerSubtitle}>AI Yatırım Danışmanı</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
              <RotateCcw color={Colors.dark.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeArea}>
                <View style={styles.welcomeIconWrap}>
                  <Sparkles color={Colors.dark.primary} size={36} />
                </View>
                <Text style={styles.welcomeTitle}>
                  Merhaba{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}! 👋
                </Text>
                <Text style={styles.welcomeDesc}>
                  Ben Finans Asistan, yatırım kararlarında sana yardımcı olmak için buradayım. Güncel piyasa verileriyle desteklenen öneriler sunabilirim.
                </Text>

                <Text style={styles.quickTitle}>Hızlı Sorular</Text>
                <View style={styles.quickGrid}>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.quickCard}
                      onPress={() => handleQuickPrompt(prompt.label)}
                      activeOpacity={0.7}
                    >
                      <prompt.icon color={Colors.dark.primary} size={18} />
                      <Text style={styles.quickLabel}>{prompt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubbleWrap,
                    m.role === 'user' ? styles.userBubbleWrap : styles.assistantBubbleWrap,
                  ]}
                >
                  {m.role === 'assistant' && (
                    <View style={styles.assistantAvatarSmall}>
                      <Bot color={Colors.dark.primary} size={14} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {m.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <Text
                              key={`${m.id}-${i}`}
                              style={[
                                styles.messageText,
                                m.role === 'user' ? styles.userText : styles.assistantText,
                              ]}
                            >
                              {part.text}
                            </Text>
                          );
                        case 'tool':
                          if (part.state === 'input-streaming' || part.state === 'input-available') {
                            return (
                              <View key={`${m.id}-${i}`} style={styles.toolIndicator}>
                                <ActivityIndicator size="small" color={Colors.dark.primary} />
                                <Text style={styles.toolText}>Piyasa verileri analiz ediliyor...</Text>
                              </View>
                            );
                          }
                          return null;
                        default:
                          return null;
                      }
                    })}
                  </View>
                </View>
              ))
            )}

            {isAssistantTyping && (
              <View style={[styles.messageBubbleWrap, styles.assistantBubbleWrap]}>
                <View style={styles.assistantAvatarSmall}>
                  <Bot color={Colors.dark.primary} size={14} />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.typingIndicator}>
                    <TypingDot delay={0} />
                    <TypingDot delay={200} />
                    <TypingDot delay={400} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputArea}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Yatırım hakkında bir şey sor..."
                placeholderTextColor={Colors.dark.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={1000}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim()}
                activeOpacity={0.7}
              >
                <Send color={input.trim() ? '#fff' : Colors.dark.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return <Animated.View style={[styles.typingDot, { opacity: anim }]} />;
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.dark.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary + '30',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: '500' as const,
  },
  resetBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chatArea: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeArea: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  welcomeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.dark.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.primary + '30',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  quickGrid: {
    width: '100%',
    gap: 10,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickLabel: {
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  messageBubbleWrap: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  userBubbleWrap: {
    justifyContent: 'flex-end',
  },
  assistantBubbleWrap: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  assistantAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.dark.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: Colors.dark.text,
  },
  toolIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  toolText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontStyle: 'italic' as const,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: Colors.dark.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.dark.surfaceLight,
  },
});

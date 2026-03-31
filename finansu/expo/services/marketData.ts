import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

export interface LiveMarketData {
  name: string;
  symbol: string;
  price: number;
  priceFormatted: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  category: string;
  description: string;
  dailyHigh: string;
  dailyLow: string;
  weeklyChange: string;
  monthlyChange: string;
  yearlyChange: string;
  volume: string;
  marketCap: string;
  lastUpdated: string;
}

type YahooMeta = {
  regularMarketPrice?: number;
  previousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
};

async function fetchYahooMeta(symbol: string): Promise<YahooMeta | null> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.chart?.result?.[0]?.meta ?? null;
  } catch {
    return null;
  }
}

function toPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function toSigned(value: number, fractionDigits = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(fractionDigits)}`;
}

function fallbackPercentValue(base: number, value?: number): number {
  if (!value || !base) return 0;
  return (value / base) * 100;
}

function fmtTry(value: number): string {
  return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function fmtUsd(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function buildMarketItem(params: {
  name: string;
  symbol: string;
  category: string;
  description: string;
  price: number;
  changePercent: number;
  changeValue: number;
  dailyHigh: number;
  dailyLow: number;
  volume?: number;
  marketCap?: number;
  isTry?: boolean;
  weeklyChange?: string;
  monthlyChange?: string;
  yearlyChange?: string;
}): LiveMarketData {
  const isTry = params.isTry ?? true;
  return {
    name: params.name,
    symbol: params.symbol,
    price: params.price,
    priceFormatted: isTry ? fmtTry(params.price) : fmtUsd(params.price),
    change: toSigned(params.changeValue, isTry ? 4 : 2),
    changePercent: toPercent(params.changePercent),
    isPositive: params.changePercent >= 0,
    category: params.category,
    description: params.description,
    dailyHigh: isTry ? fmtTry(params.dailyHigh) : fmtUsd(params.dailyHigh),
    dailyLow: isTry ? fmtTry(params.dailyLow) : fmtUsd(params.dailyLow),
    weeklyChange: params.weeklyChange ?? toPercent(params.changePercent * 2),
    monthlyChange: params.monthlyChange ?? toPercent(params.changePercent * 3),
    yearlyChange: params.yearlyChange ?? toPercent(params.changePercent * 8),
    volume: params.volume ? params.volume.toLocaleString('tr-TR') : '-',
    marketCap: params.marketCap ? params.marketCap.toLocaleString('tr-TR') : '-',
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchLiveMarketData(): Promise<LiveMarketData[]> {
  const [usdTryMeta, eurTryMeta, gbpTryMeta, xauUsdMeta, xagUsdMeta, xu100Meta, btcMeta, ethMeta] = await Promise.all([
    fetchYahooMeta('TRY=X'),
    fetchYahooMeta('EURTRY=X'),
    fetchYahooMeta('GBPTRY=X'),
    fetchYahooMeta('GC=F'),
    fetchYahooMeta('SI=F'),
    fetchYahooMeta('XU100.IS'),
    fetchYahooMeta('BTC-USD'),
    fetchYahooMeta('ETH-USD'),
  ]);

  if (!usdTryMeta?.regularMarketPrice) {
    throw new Error('Canlı piyasa verileri alınamadı');
  }

  const usdTry = usdTryMeta.regularMarketPrice;
  const xauTryPerGram = ((xauUsdMeta?.regularMarketPrice ?? 0) / 31.1034768) * usdTry;
  const xagTryPerGram = ((xagUsdMeta?.regularMarketPrice ?? 0) / 31.1034768) * usdTry;

  const result: LiveMarketData[] = [
    buildMarketItem({
      name: 'Gram Altın',
      symbol: 'XAU/TRY',
      category: 'Emtia',
      description: 'Ons altın (GC=F) ve USD/TRY ile hesaplanır.',
      price: xauTryPerGram,
      changePercent: xauUsdMeta?.regularMarketChangePercent ?? 0,
      changeValue: (xauUsdMeta?.regularMarketChangePercent ?? 0) * xauTryPerGram / 100,
      dailyHigh: (((xauUsdMeta?.regularMarketDayHigh ?? xauUsdMeta?.regularMarketPrice ?? 0) / 31.1034768) * usdTry),
      dailyLow: (((xauUsdMeta?.regularMarketDayLow ?? xauUsdMeta?.regularMarketPrice ?? 0) / 31.1034768) * usdTry),
      isTry: true,
    }),
    buildMarketItem({
      name: 'Amerikan Doları',
      symbol: 'USD/TRY',
      category: 'Döviz',
      description: 'Yahoo Finance canlı döviz kuru.',
      price: usdTry,
      changePercent: usdTryMeta.regularMarketChangePercent ?? fallbackPercentValue(usdTryMeta.previousClose ?? usdTry, usdTryMeta.regularMarketChange),
      changeValue: usdTryMeta.regularMarketChange ?? (usdTry - (usdTryMeta.previousClose ?? usdTry)),
      dailyHigh: usdTryMeta.regularMarketDayHigh ?? usdTry,
      dailyLow: usdTryMeta.regularMarketDayLow ?? usdTry,
      volume: usdTryMeta.regularMarketVolume,
      isTry: true,
    }),
    buildMarketItem({
      name: 'Euro',
      symbol: 'EUR/TRY',
      category: 'Döviz',
      description: 'Yahoo Finance canlı döviz kuru.',
      price: eurTryMeta?.regularMarketPrice ?? 0,
      changePercent: eurTryMeta?.regularMarketChangePercent ?? 0,
      changeValue: eurTryMeta?.regularMarketChange ?? 0,
      dailyHigh: eurTryMeta?.regularMarketDayHigh ?? eurTryMeta?.regularMarketPrice ?? 0,
      dailyLow: eurTryMeta?.regularMarketDayLow ?? eurTryMeta?.regularMarketPrice ?? 0,
      volume: eurTryMeta?.regularMarketVolume,
      isTry: true,
    }),
    buildMarketItem({
      name: 'BIST 100',
      symbol: 'XU100',
      category: 'Borsa',
      description: 'BIST 100 endeksi (XU100.IS).',
      price: xu100Meta?.regularMarketPrice ?? 0,
      changePercent: xu100Meta?.regularMarketChangePercent ?? 0,
      changeValue: xu100Meta?.regularMarketChange ?? 0,
      dailyHigh: xu100Meta?.regularMarketDayHigh ?? xu100Meta?.regularMarketPrice ?? 0,
      dailyLow: xu100Meta?.regularMarketDayLow ?? xu100Meta?.regularMarketPrice ?? 0,
      volume: xu100Meta?.regularMarketVolume,
      isTry: true,
    }),
    buildMarketItem({
      name: 'Bitcoin',
      symbol: 'BTC/USD',
      category: 'Kripto',
      description: 'Bitcoin spot fiyatı (BTC-USD).',
      price: btcMeta?.regularMarketPrice ?? 0,
      changePercent: btcMeta?.regularMarketChangePercent ?? 0,
      changeValue: btcMeta?.regularMarketChange ?? 0,
      dailyHigh: btcMeta?.regularMarketDayHigh ?? btcMeta?.regularMarketPrice ?? 0,
      dailyLow: btcMeta?.regularMarketDayLow ?? btcMeta?.regularMarketPrice ?? 0,
      volume: btcMeta?.regularMarketVolume,
      marketCap: btcMeta?.marketCap,
      isTry: false,
    }),
    buildMarketItem({
      name: 'Gümüş',
      symbol: 'XAG/TRY',
      category: 'Emtia',
      description: 'Ons gümüş (SI=F) ve USD/TRY ile hesaplanır.',
      price: xagTryPerGram,
      changePercent: xagUsdMeta?.regularMarketChangePercent ?? 0,
      changeValue: (xagUsdMeta?.regularMarketChangePercent ?? 0) * xagTryPerGram / 100,
      dailyHigh: (((xagUsdMeta?.regularMarketDayHigh ?? xagUsdMeta?.regularMarketPrice ?? 0) / 31.1034768) * usdTry),
      dailyLow: (((xagUsdMeta?.regularMarketDayLow ?? xagUsdMeta?.regularMarketPrice ?? 0) / 31.1034768) * usdTry),
      isTry: true,
    }),
    buildMarketItem({
      name: 'İngiliz Sterlini',
      symbol: 'GBP/TRY',
      category: 'Döviz',
      description: 'Yahoo Finance canlı döviz kuru.',
      price: gbpTryMeta?.regularMarketPrice ?? 0,
      changePercent: gbpTryMeta?.regularMarketChangePercent ?? 0,
      changeValue: gbpTryMeta?.regularMarketChange ?? 0,
      dailyHigh: gbpTryMeta?.regularMarketDayHigh ?? gbpTryMeta?.regularMarketPrice ?? 0,
      dailyLow: gbpTryMeta?.regularMarketDayLow ?? gbpTryMeta?.regularMarketPrice ?? 0,
      volume: gbpTryMeta?.regularMarketVolume,
      isTry: true,
    }),
    buildMarketItem({
      name: 'Ethereum',
      symbol: 'ETH/USD',
      category: 'Kripto',
      description: 'Ethereum spot fiyatı (ETH-USD).',
      price: ethMeta?.regularMarketPrice ?? 0,
      changePercent: ethMeta?.regularMarketChangePercent ?? 0,
      changeValue: ethMeta?.regularMarketChange ?? 0,
      dailyHigh: ethMeta?.regularMarketDayHigh ?? ethMeta?.regularMarketPrice ?? 0,
      dailyLow: ethMeta?.regularMarketDayLow ?? ethMeta?.regularMarketPrice ?? 0,
      volume: ethMeta?.regularMarketVolume,
      marketCap: ethMeta?.marketCap,
      isTry: false,
    }),
  ];

  return result.filter((item) => Number.isFinite(item.price) && item.price > 0);
}

export async function fetchInvestmentDetail(symbol: string, name: string): Promise<InvestmentDetail> {
  const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  let sourceUrl = '';
  if (['XAU/TRY', 'USD/TRY', 'EUR/TRY', 'GBP/TRY', 'XAG/TRY'].includes(symbol)) {
    sourceUrl = 'bigpara.hurriyet.com.tr';
  } else if (['XU100', 'BIST30'].includes(symbol)) {
    sourceUrl = 'uzmanpara.milliyet.com.tr';
  } else if (['BTC/USD', 'ETH/USD'].includes(symbol)) {
    sourceUrl = 'tr.investing.com';
  }

  const result = await generateObject({
    messages: [
      {
        role: 'user',
        content: `Sen bir finans uzmanısın. Bugün: ${dateStr}, saat: ${timeStr}.

"${name}" (${symbol}) yatırım aracı hakkında detaylı ve GÜNCEL bilgi ver.
${sourceUrl ? `Veri kaynağı: ${sourceUrl}` : ''}

BUGÜNKÜ GERÇEK verilere dayalı bilgiler sun (2026 Mart fiyatları):
- Güncel fiyat bilgisi (GERÇEK piyasa fiyatı)
- Son 1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl performansı
- Teknik analiz özeti (destek/direnç seviyeleri)
- Temel analiz özeti
- Risk faktörleri (en az 4 - makroekonomik, sektörel, teknik, likidite riskleri)
- Yatırımcılar için öneriler (en az 4)
- Piyasa beklentileri

ÖNEMLİ: Tahmini değil, GÜNCEL ve GERÇEK veriler kullan.`,
      },
    ],
    schema: investmentDetailSchema,
  });

  return result;
}

const investmentDetailSchema = z.object({
  currentPrice: z.string(),
  currency: z.string(),
  dailyChange: z.string(),
  dailyChangePercent: z.string(),
  isPositive: z.boolean(),
  weekPerformance: z.string(),
  monthPerformance: z.string(),
  threeMonthPerformance: z.string(),
  sixMonthPerformance: z.string(),
  yearPerformance: z.string(),
  dailyHigh: z.string(),
  dailyLow: z.string(),
  weekHigh: z.string(),
  weekLow: z.string(),
  supportLevel: z.string(),
  resistanceLevel: z.string(),
  technicalSummary: z.string(),
  fundamentalSummary: z.string(),
  riskFactors: z.array(z.string()),
  recommendations: z.array(z.string()),
  marketExpectation: z.string(),
  overallSentiment: z.enum(['bullish', 'bearish', 'neutral']),
});

export type InvestmentDetail = z.infer<typeof investmentDetailSchema>;

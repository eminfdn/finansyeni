import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

export interface ScrapedMarketData {
  gold: { buy: string; sell: string; change: string; changePercent: string } | null;
  dollar: { buy: string; sell: string; change: string; changePercent: string } | null;
  euro: { buy: string; sell: string; change: string; changePercent: string } | null;
  sterling: { buy: string; sell: string; change: string; changePercent: string } | null;
  bist100: { value: string; change: string; changePercent: string } | null;
  bitcoin: { price: string; change: string; changePercent: string } | null;
  ethereum: { price: string; change: string; changePercent: string } | null;
}

const scrapedDataSchema = z.object({
  gold: z.object({
    buy: z.string(),
    sell: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
  dollar: z.object({
    buy: z.string(),
    sell: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
  euro: z.object({
    buy: z.string(),
    sell: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
  sterling: z.object({
    buy: z.string(),
    sell: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
  bist100: z.object({
    value: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
  bitcoin: z.object({
    price: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
  ethereum: z.object({
    price: z.string(),
    change: z.string(),
    changePercent: z.string(),
  }).nullable(),
});

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text.substring(0, 15000);
  } catch (error) {
    console.log(`Failed to fetch ${url}:`, error);
    return null;
  }
}

export async function fetchRealMarketData(): Promise<ScrapedMarketData> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const [bigparaHtml, uzmanparaHtml, investingHtml] = await Promise.all([
    fetchPageContent('https://bigpara.hurriyet.com.tr/doviz/'),
    fetchPageContent('https://uzmanpara.milliyet.com.tr/borsa/'),
    fetchPageContent('https://tr.investing.com/crypto/'),
  ]);

  const sourceSummary: string[] = [];
  if (bigparaHtml) {
    sourceSummary.push(`bigpara.hurriyet.com.tr (altın, döviz verileri): ${bigparaHtml.substring(0, 5000)}`);
  }
  if (uzmanparaHtml) {
    sourceSummary.push(`uzmanpara.milliyet.com.tr (borsa verileri): ${uzmanparaHtml.substring(0, 5000)}`);
  }
  if (investingHtml) {
    sourceSummary.push(`tr.investing.com (kripto para verileri): ${investingHtml.substring(0, 5000)}`);
  }

  const result = await generateObject({
    messages: [
      {
        role: 'user',
        content: `Sen bir finans veri analistisin. Bugünün tarihi: ${dateStr}, saat: ${timeStr}.

Aşağıdaki web sitelerinden aldığım HTML verilerinden GÜNCEL piyasa fiyatlarını çıkar:

${sourceSummary.length > 0 ? sourceSummary.join('\n\n---\n\n') : 'Web sitelerinden veri alınamadı. BUGÜNKÜ GERÇEK piyasa verilerini bilgin dahilinde ver.'}

Çıkarman gereken veriler:
1. Gram Altın - Alış/Satış fiyatı, değişim, değişim yüzdesi (kaynak: bigpara.hurriyet.com.tr)
2. Amerikan Doları - Alış/Satış fiyatı, değişim, değişim yüzdesi (kaynak: bigpara.hurriyet.com.tr)
3. Euro - Alış/Satış fiyatı, değişim, değişim yüzdesi (kaynak: bigpara.hurriyet.com.tr)
4. İngiliz Sterlini - Alış/Satış fiyatı, değişim, değişim yüzdesi (kaynak: bigpara.hurriyet.com.tr)
5. BIST 100 - Değer, değişim, değişim yüzdesi (kaynak: uzmanpara.milliyet.com.tr)
6. Bitcoin - TRY fiyatı, değişim, değişim yüzdesi (kaynak: tr.investing.com)
7. Ethereum - TRY fiyatı, değişim, değişim yüzdesi (kaynak: tr.investing.com)

ÖNEMLİ: 
- Fiyatlar Mart 2026 güncel fiyatları olmalı
- TRY formatında ver (₺ sembolü ile)
- Değişim yüzdesini +/- ile belirt
- HTML'den bulamadığın verileri null olarak döndür`,
      },
    ],
    schema: scrapedDataSchema,
  });

  return result;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

const priceHistorySchema = z.object({
  history: z.array(z.object({
    date: z.string(),
    price: z.number(),
  })),
  currentPrice: z.number(),
  highestPrice: z.number(),
  lowestPrice: z.number(),
  averagePrice: z.number(),
});

export type PriceHistory = z.infer<typeof priceHistorySchema>;

export async function fetchPriceHistory(symbol: string, name: string, period: string = '1M'): Promise<PriceHistory> {
  const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const periodMap: Record<string, string> = {
    '1H': 'son 1 hafta (günlük)',
    '1A': 'son 1 ay (günlük)',
    '3A': 'son 3 ay (haftalık)',
    '6A': 'son 6 ay (haftalık)',
    '1Y': 'son 1 yıl (aylık)',
  };

  const periodDesc = periodMap[period] || 'son 1 ay (günlük)';

  const result = await generateObject({
    messages: [
      {
        role: 'user',
        content: `Sen bir finans veri analistisin. Bugün: ${dateStr}.

"${name}" (${symbol}) yatırım aracının ${periodDesc} fiyat geçmişini ver.

GERÇEK ve GÜNCEL verilere dayalı fiyat noktaları oluştur. Her nokta için tarih ve fiyat değeri ver.
Fiyatlar TRY veya USD cinsinden olsun (yatırım aracına göre).

Ayrıca şunları da ver:
- Güncel fiyat
- Dönemdeki en yüksek fiyat
- Dönemdeki en düşük fiyat
- Ortalama fiyat

ÖNEMLİ: Gerçekçi ve güncel veriler kullan. Mart 2026 fiyatlarını baz al.`,
      },
    ],
    schema: priceHistorySchema,
  });

  return result;
}

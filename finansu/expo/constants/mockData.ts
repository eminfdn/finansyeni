import { MarketItem } from '@/types';

export const marketOverview: MarketItem[] = [
  { name: 'Gram Altın', symbol: 'XAU/TRY', price: '3.245,80', change: '+42,30', changePercent: '+1.32%', isPositive: true, icon: 'gold' },
  { name: 'Dolar', symbol: 'USD/TRY', price: '38,42', change: '+0,18', changePercent: '+0.47%', isPositive: true, icon: 'dollar' },
  { name: 'Euro', symbol: 'EUR/TRY', price: '41,85', change: '-0,12', changePercent: '-0.29%', isPositive: false, icon: 'euro' },
  { name: 'BIST 100', symbol: 'XU100', price: '11.245', change: '+187', changePercent: '+1.69%', isPositive: true, icon: 'chart' },
  { name: 'Bitcoin', symbol: 'BTC/USD', price: '87.420', change: '-1.230', changePercent: '-1.39%', isPositive: false, icon: 'bitcoin' },
  { name: 'Gümüş', symbol: 'XAG/TRY', price: '38,92', change: '+0,45', changePercent: '+1.17%', isPositive: true, icon: 'silver' },
];

export const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

export const categoryLabels: Record<string, string> = {
  stock: 'Hisse Senedi',
  bond: 'Tahvil/Bono',
  gold: 'Altın',
  forex: 'Döviz',
  crypto: 'Kripto',
  realestate: 'Gayrimenkul',
  fund: 'Yatırım Fonu',
  deposit: 'Mevduat',
  commodity: 'Emtia',
};

export const categoryIcons: Record<string, string> = {
  stock: 'TrendingUp',
  bond: 'FileText',
  gold: 'CircleDollarSign',
  forex: 'ArrowLeftRight',
  crypto: 'Bitcoin',
  realestate: 'Building2',
  fund: 'PieChart',
  deposit: 'Landmark',
  commodity: 'Package',
};

export const riskLabels: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export const riskColors: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

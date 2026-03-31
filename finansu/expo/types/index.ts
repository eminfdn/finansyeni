export interface UserProfile {
  name: string;
  email: string;
  password?: string;
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoal: string;
  monthlyIncome: number;
  investmentBudget: number;
  occupation: string;
  age: string;
  createdAt: string;
}

export interface InvestmentRecommendation {
  id: string;
  name: string;
  category: InvestmentCategory;
  allocation: number;
  estimatedReturn: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  reasoning: string;
  timeHorizon: string;
  investmentAmount?: number;
  estimatedProfit?: string;
  maxLoss?: string;
  volatility?: string;
}

export type InvestmentCategory =
  | 'stock'
  | 'bond'
  | 'gold'
  | 'forex'
  | 'crypto'
  | 'realestate'
  | 'fund'
  | 'deposit'
  | 'commodity';

export interface AnalysisResult {
  id: string;
  amount: number;
  currency: string;
  recommendations: InvestmentRecommendation[];
  summary: string;
  totalEstimatedReturn: string;
  overallRisk: 'low' | 'medium' | 'high';
  createdAt: string;
  marketCondition: string;
}

export interface MarketItem {
  name: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  icon: string;
}

export interface RiskAnalysis {
  id: string;
  portfolioRisk: 'low' | 'medium' | 'high';
  diversificationScore: number;
  volatilityIndex: string;
  maxDrawdown: string;
  sharpeRatio: string;
  recommendations: string[];
  riskFactors: RiskFactor[];
  summary: string;
  createdAt: string;
}

export interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
}

export interface QuickAnalysis {
  id: string;
  marketSummary: string;
  topOpportunities: QuickOpportunity[];
  warnings: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  createdAt: string;
}

export interface QuickOpportunity {
  name: string;
  category: string;
  reason: string;
  potentialReturn: string;
  riskLevel: 'low' | 'medium' | 'high';
}

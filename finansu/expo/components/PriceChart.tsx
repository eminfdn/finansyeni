import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';
import { PriceHistoryPoint } from '@/services/webScraper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 180;
const PADDING_LEFT = 50;
const PADDING_BOTTOM = 30;
const PADDING_TOP = 10;

interface PriceChartProps {
  data: PriceHistoryPoint[];
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  isPositive: boolean;
}

export default React.memo(function PriceChart({ data, currentPrice, highestPrice, lowestPrice, isPositive }: PriceChartProps) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [animProgress]);

  const chartColor = isPositive ? Colors.dark.positive : Colors.dark.negative;

  const { points, yLabels, xLabels } = useMemo(() => {
    if (!data || data.length < 2) return { points: [], yLabels: [], xLabels: [] };

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const drawWidth = CHART_WIDTH - PADDING_LEFT - 10;
    const drawHeight = CHART_HEIGHT - PADDING_BOTTOM - PADDING_TOP;

    const pts = data.map((d, i) => ({
      x: PADDING_LEFT + (i / (data.length - 1)) * drawWidth,
      y: PADDING_TOP + drawHeight - ((d.price - minPrice) / priceRange) * drawHeight,
      price: d.price,
      date: d.date,
    }));

    const yLabelCount = 4;
    const yLbls = Array.from({ length: yLabelCount }, (_, i) => {
      const price = minPrice + (priceRange * i) / (yLabelCount - 1);
      const y = PADDING_TOP + drawHeight - ((price - minPrice) / priceRange) * drawHeight;
      return { price, y };
    });

    const step = Math.max(1, Math.floor(data.length / 5));
    const xLbls = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d) => {
        const originalIdx = data.indexOf(d);
        return {
          label: d.date.length > 5 ? d.date.substring(5) : d.date,
          x: PADDING_LEFT + (originalIdx / (data.length - 1)) * drawWidth,
        };
      });

    return { points: pts, yLabels: yLbls, xLabels: xLbls };
  }, [data]);

  if (!data || data.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Grafik verisi yok</Text>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
    return price.toFixed(price < 10 ? 2 : 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {yLabels.map((label, i) => (
          <React.Fragment key={`y-${i}`}>
            <View style={[styles.gridLine, { top: label.y }]} />
            <Text style={[styles.yLabel, { top: label.y - 8 }]}>
              {formatPrice(label.price)}
            </Text>
          </React.Fragment>
        ))}

        {points.map((point, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <Animated.View
              key={`line-${i}`}
              style={[
                styles.lineSegment,
                {
                  left: prev.x,
                  top: prev.y,
                  width: length,
                  backgroundColor: chartColor,
                  transform: [{ rotate: `${angle}deg` }],
                  opacity: animProgress,
                },
              ]}
            />
          );
        })}

        {points.map((point, i) => (
          <Animated.View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                left: point.x - 3,
                top: point.y - 3,
                backgroundColor: chartColor,
                opacity: animProgress,
              },
              i === points.length - 1 && styles.dotLast,
              i === points.length - 1 && { borderColor: chartColor },
            ]}
          />
        ))}

        {xLabels.map((label, i) => (
          <Text key={`x-${i}`} style={[styles.xLabel, { left: label.x - 20 }]}>
            {label.label}
          </Text>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Güncel</Text>
          <Text style={[styles.statValue, { color: chartColor }]}>{formatPrice(currentPrice)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>En Yüksek</Text>
          <Text style={[styles.statValue, { color: Colors.dark.positive }]}>{formatPrice(highestPrice)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>En Düşük</Text>
          <Text style={[styles.statValue, { color: Colors.dark.negative }]}>{formatPrice(lowestPrice)}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  chartArea: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: PADDING_LEFT,
    right: 10,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 10,
    color: Colors.dark.textMuted,
    width: PADDING_LEFT - 6,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 9,
    color: Colors.dark.textMuted,
    width: 40,
    textAlign: 'center',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
    borderRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLast: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: Colors.dark.background,
    marginLeft: -2,
    marginTop: -2,
  },
  emptyContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
});

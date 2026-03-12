import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { atelierColors, atelierText } from '@/lib/atelierTheme';
import { spacing } from '@/lib/theme';
import { WellnessLog } from '@/types';
import { calculatePhysicalRhythmScore, calculateMentalRhythmScore } from '@/lib/wellnessScoring';

interface Props {
  logs: WellnessLog[];
}

export function TrendChart({ logs }: Props) {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Take up to 7 recent logs and reverse them so they are in chronological order
    const recentLogs = [...logs].slice(0, 7).reverse();
    
    return recentLogs.map(log => {
      const p = calculatePhysicalRhythmScore(log);
      const m = calculateMentalRhythmScore(log);
      // Date formatting from YYYY-MM-DD to MM/DD
      const dateParts = log.date.split('-');
      const shortDate = dateParts.length === 3 ? `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}` : log.date;
      
      return {
        date: shortDate,
        score: (p + m) / 2, // 1 to 5
      };
    });
  }, [logs]);

  const trendInfo = useMemo(() => {
    if (chartData.length < 2) {
      return { text: "첫 기록 완료! 싹을 틔워볼까요? 🌱", isPositive: true };
    }
    const today = chartData[chartData.length - 1].score;
    const yesterday = chartData[chartData.length - 2].score;
    const diff = today - yesterday;

    if (diff > 0.3) return { text: `어제보다 웰니스 지수가 올랐어요! 🔺`, isPositive: true };
    if (diff < -0.3) return { text: `어제보다 에너지가 조금 떨어졌네요 🔻`, isPositive: false };
    return { text: `어제와 비슷한 안정적인 흐름이에요 🌊`, isPositive: true };
  }, [chartData]);

  if (chartData.length === 0) {
    return null; // Handled by parent EmptyState
  }

  // Use a fixed width assuming standard padding on a phone screen
  const screenWidth = Dimensions.get('window').width;
  // screenWidth - 2 * spacing.xl (container padding) - 2 * spacing.xl (card padding)
  const chartWidth = Math.max(screenWidth - 32 * 2 - 32 * 2, 200); 
  const chartHeight = 120;
  const paddingX = 16;
  const paddingY = 24;

  const minScore = 1;
  const maxScore = 5;

  const points = chartData.map((d, index) => {
    const x = chartData.length === 1 
      ? chartWidth / 2 
      : paddingX + (index / (chartData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.score - minScore) / (maxScore - minScore)) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  let pathD = '';
  let areaD = '';

  if (points.length > 1) {
    points.forEach((p, index) => {
      if (index === 0) {
        pathD += `M ${p.x} ${p.y} `;
      } else {
        const prev = points[index - 1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (p.x - prev.x) / 2;
        const cp2y = p.y;
        pathD += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y} `;
      }
    });
    areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.badge, !trendInfo.isPositive && styles.badgeNegative]}>
          <Text style={[styles.badgeText, !trendInfo.isPositive && styles.badgeTextNegative]}>
            {trendInfo.text}
          </Text>
        </View>
      </View>

      <View style={[styles.chartContainer, { width: chartWidth }]}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={atelierColors.deepGreen} stopOpacity="0.25" />
              <Stop offset="1" stopColor={atelierColors.deepGreen} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {points.length > 1 && (
            <>
              <Path d={areaD} fill="url(#gradient)" />
              <Path d={pathD} stroke={atelierColors.deepGreen} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? "5" : "3.5"}
              fill={atelierColors.surface}
              stroke={atelierColors.deepGreen}
              strokeWidth={i === points.length - 1 ? "3" : "2"}
            />
          ))}
        </Svg>

        <View style={styles.xAxis}>
          {points.map((p, i) => (
            <View key={i} style={[styles.xLabelContainer, { left: p.x - 20 }]}>
              <Text style={[styles.xLabel, i === points.length - 1 && styles.xLabelActive]}>{p.date}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: atelierColors.surface,
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: atelierColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 1,
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    width: '100%',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: atelierColors.deepGreenSoft + '20',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeNegative: {
    backgroundColor: atelierColors.dustyRoseSoft + '60',
  },
  badgeText: {
    ...atelierText.helper,
    color: atelierColors.deepGreen,
    fontWeight: '700',
    fontSize: 13,
  },
  badgeTextNegative: {
    color: atelierColors.cocoa,
  },
  chartContainer: {
    height: 120,
    position: 'relative',
    marginBottom: 8,
  },
  xAxis: {
    height: 20,
    marginTop: 8,
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
  },
  xLabelContainer: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
  },
  xLabel: {
    ...atelierText.helper,
    fontSize: 11,
    color: atelierColors.textMuted,
  },
  xLabelActive: {
    color: atelierColors.deepGreen,
    fontWeight: '700',
  }
});

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { atelierCards, atelierColors, atelierText } from '@/lib/atelierTheme';
import { getTeaPresentationProfile } from '@/lib/teaProfiles';
import { TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { spacing } from '@/lib/theme';

interface TeaProfileMeterProps {
  teaId: TeaRecommendationId;
}

export function TeaProfileMeter({ teaId }: TeaProfileMeterProps) {
  const axes = getTeaPresentationProfile(teaId);
  const size = 240;
  const center = size / 2;
  const radius = 72;
  const labelRadius = 102;

  const points = axes.map((axis, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / axes.length;
    return {
      ...axis,
      angle,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * labelRadius,
      labelY: center + Math.sin(angle) * labelRadius,
    };
  });

  const gridPolygons = Array.from({ length: 5 }).map((_, levelIndex) => {
    const level = (levelIndex + 1) / 5;
    return points
      .map((point) => {
        const x = center + Math.cos(point.angle) * radius * level;
        const y = center + Math.sin(point.angle) * radius * level;
        return `${x},${y}`;
      })
      .join(' ');
  });

  const profilePolygon = points
    .map((point) => {
      const ratio = point.value / 5;
      const x = center + Math.cos(point.angle) * radius * ratio;
      const y = center + Math.sin(point.angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(' ');

  const getTextAnchor = (x: number) => {
    if (Math.abs(x - center) < 8) {
      return 'middle';
    }

    return x > center ? 'start' : 'end';
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>티 프로필</Text>
      <View style={styles.chartWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {gridPolygons.map((polygon, index) => (
            <Polygon
              key={`grid-${index}`}
              points={polygon}
              fill="none"
              stroke={atelierColors.chartGrid}
              strokeWidth={1}
            />
          ))}

          {points.map((point) => (
            <Line
              key={`axis-${point.label}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke={atelierColors.chartGrid}
              strokeWidth={1}
            />
          ))}

          <Polygon
            points={profilePolygon}
            fill={atelierColors.deepGreen + '55'}
            stroke={atelierColors.deepGreen}
            strokeWidth={2}
          />

          {points.map((point) => (
            <Circle
              key={`dot-${point.label}`}
              cx={center + Math.cos(point.angle) * radius * (point.value / 5)}
              cy={center + Math.sin(point.angle) * radius * (point.value / 5)}
              r={4}
              fill={atelierColors.deepGreen}
            />
          ))}

          {points.map((point) => (
            <SvgText
              key={`label-${point.label}`}
              x={point.labelX}
              y={point.labelY}
              fontSize="11"
              fontWeight="700"
              fill={atelierColors.text}
              textAnchor={getTextAnchor(point.labelX)}
            >
              {point.label}
            </SvgText>
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...atelierCards.section,
    marginTop: spacing.lg,
    borderRadius: 24,
    padding: spacing.md,
  },
  title: {
    ...atelierText.helper,
    fontSize: 13,
    marginBottom: spacing.md,
    letterSpacing: 0.1,
  },
  chartWrap: {
    alignItems: 'center',
  },
});

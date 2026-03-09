import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { CustomBlendLabAxis } from '@/lib/customBlendLab';
import { colors, spacing } from '@/lib/theme';

interface CustomBlendProfileChartProps {
  title?: string;
  axes: CustomBlendLabAxis[];
}

export function CustomBlendProfileChart({
  title = '현재 블렌드 프로파일',
  axes,
}: CustomBlendProfileChartProps) {
  const size = 220;
  const center = size / 2;
  const radius = 68;
  const labelRadius = 96;

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
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {gridPolygons.map((polygon, index) => (
            <Polygon
              key={`grid-${index}`}
              points={polygon}
              fill="none"
              stroke={colors.border}
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
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}

          <Polygon
            points={profilePolygon}
            fill={colors.primary + '55'}
            stroke={colors.primary}
            strokeWidth={2}
          />

          {points.map((point) => (
            <Circle
              key={`dot-${point.label}`}
              cx={center + Math.cos(point.angle) * radius * (point.value / 5)}
              cy={center + Math.sin(point.angle) * radius * (point.value / 5)}
              r={4}
              fill={colors.primary}
            />
          ))}

          {points.map((point) => (
            <SvgText
              key={`label-${point.label}`}
              x={point.labelX}
              y={point.labelY}
              fontSize="11"
              fontWeight="700"
              fill={colors.text}
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
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: spacing.md,
    letterSpacing: 0.1,
  },
  chartWrap: {
    alignItems: 'center',
  },
});

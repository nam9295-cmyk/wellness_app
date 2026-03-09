import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { CustomBlendLabAxis } from '@/lib/customBlendLab';
import { colors, spacing } from '@/lib/theme';

interface CustomBlendProfileChartProps {
  title?: string;
  axes: CustomBlendLabAxis[];
  compact?: boolean;
  embedded?: boolean;
  tiny?: boolean;
  tone?: 'default' | 'atelier';
}

export function CustomBlendProfileChart({
  title = '현재 블렌드 프로파일',
  axes,
  compact = false,
  embedded = false,
  tiny = false,
  tone = 'default',
}: CustomBlendProfileChartProps) {
  const palette = tone === 'atelier'
    ? {
        grid: '#DDD2C7',
        fill: '#AFC5BB44',
        stroke: '#6E8E82',
        text: '#3A322E',
        title: '#6F6762',
      }
    : {
        grid: colors.border,
        fill: colors.primary + '55',
        stroke: colors.primary,
        text: colors.text,
        title: colors.textLight,
      };
  const size = tiny ? 128 : compact ? 172 : 220;
  const center = size / 2;
  const radius = tiny ? 36 : compact ? 52 : 68;
  const labelRadius = tiny ? 54 : compact ? 74 : 96;
  const pointRadius = tiny ? 2.6 : compact ? 3.2 : 4;
  const labelFontSize = tiny ? 8 : compact ? 10 : 11;

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

  const content = (
    <>
      {title ? <Text style={[styles.title, { color: palette.title }, (compact || tiny) && styles.titleCompact]}>{title}</Text> : null}
      <View style={styles.chartWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {gridPolygons.map((polygon, index) => (
            <Polygon
              key={`grid-${index}`}
              points={polygon}
              fill="none"
              stroke={palette.grid}
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
              stroke={palette.grid}
              strokeWidth={1}
            />
          ))}

          <Polygon
            points={profilePolygon}
            fill={palette.fill}
            stroke={palette.stroke}
            strokeWidth={2}
          />

          {points.map((point) => (
            <Circle
              key={`dot-${point.label}`}
              cx={center + Math.cos(point.angle) * radius * (point.value / 5)}
              cy={center + Math.sin(point.angle) * radius * (point.value / 5)}
              r={pointRadius}
              fill={palette.stroke}
            />
          ))}

          {points.map((point) => (
            <SvgText
              key={`label-${point.label}`}
              x={point.labelX}
              y={point.labelY}
              fontSize={labelFontSize}
              fontWeight="700"
              fill={palette.text}
              textAnchor={getTextAnchor(point.labelX)}
            >
              {point.label}
            </SvgText>
          ))}
        </Svg>
      </View>
    </>
  );

  if (embedded) {
    return <View>{content}</View>;
  }

  return <View style={styles.card}>{content}</View>;
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
  titleCompact: {
    marginBottom: spacing.sm,
  },
  chartWrap: {
    alignItems: 'center',
  },
});

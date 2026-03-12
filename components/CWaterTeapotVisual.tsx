import { Image, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { CWaterTeaId } from '@/lib/cwaterTeaMetadata';
import { atelierColors } from '@/lib/atelierTheme';

interface CWaterTeapotVisualProps {
  teaIds: CWaterTeaId[];
  teaRatios?: Record<string, number> | null;
  cacaoNibLevel: number;
}

const teapotEmptyImage = require('../assets/images/detox_order/teapot_empty.png');
const teapotMaskImage = require('../assets/images/detox_order/teapot_mask.png');

const teaLiquidColors: Record<CWaterTeaId, string> = {
  peachOolong: '#D48A6A',
  lycheeOolong: '#C77B7A',
  classicOolong: '#B98358',
  peachBlack: '#B56B52',
  lycheeBlack: '#9C5B5B',
  classicBlack: '#7A4A32',
  earlGreyBlack: '#8A5A3E',
  citrusRooibos: '#C7894E',
  hibiscusFruit: '#B45A66',
  mintHerbal: '#8FAE95',
};

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  return {
    r: parseInt(sanitized.slice(0, 2), 16),
    g: parseInt(sanitized.slice(2, 4), 16),
    b: parseInt(sanitized.slice(4, 6), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number) {
  const normalize = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${normalize(red)}${normalize(green)}${normalize(blue)}`;
}

function mixColors(entries: Array<{ color: string; weight: number }>) {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;
  const rgb = entries.reduce(
    (acc, entry) => {
      const current = hexToRgb(entry.color);
      acc.r += current.r * entry.weight;
      acc.g += current.g * entry.weight;
      acc.b += current.b * entry.weight;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  return rgbToHex(rgb.r / totalWeight, rgb.g / totalWeight, rgb.b / totalWeight);
}

function tintColor(hex: string, ratio: number) {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    rgb.r + (255 - rgb.r) * ratio,
    rgb.g + (255 - rgb.g) * ratio,
    rgb.b + (255 - rgb.b) * ratio
  );
}

function withOpacity(hex: string, opacity: number) {
  const sanitized = hex.replace('#', '');
  const alpha = Math.max(0, Math.min(255, Math.round(opacity * 255))).toString(16).padStart(2, '0');
  return `#${sanitized}${alpha}`;
}

function getLiquidColor(teaIds: CWaterTeaId[], teaRatios: Record<string, number> | null | undefined, cacaoNibLevel: number) {
  const teaEntries = teaIds.map((teaId) => ({
    color: teaLiquidColors[teaId] ?? '#A67C63',
    weight: teaRatios?.[teaId] ?? 50,
  }));

  const baseBlend = mixColors(teaEntries);
  const cacaoColor = '#5A3A2A';
  const cacaoWeight = cacaoNibLevel * 1.08;

  return mixColors([
    { color: baseBlend, weight: Math.max(100 - cacaoWeight, 72) },
    { color: cacaoColor, weight: Math.max(cacaoWeight, 6) },
  ]);
}

export function CWaterTeapotVisual({
  teaIds,
  teaRatios,
  cacaoNibLevel,
}: CWaterTeapotVisualProps) {
  const liquidColor = getLiquidColor(teaIds, teaRatios, cacaoNibLevel);
  const surfaceColor = tintColor(liquidColor, 0.28);

  return (
    <View style={styles.wrap}>
      <View style={styles.teapotBox}>
        <MaskedView
          style={styles.layerFill}
          maskElement={<Image source={teapotMaskImage} style={styles.layerImage} resizeMode="contain" />}
        >
          <View style={styles.layerFill}>
            <View style={[styles.liquidFill, { backgroundColor: withOpacity(liquidColor, 0.64) }]} />
            <View style={[styles.liquidDepth, { backgroundColor: withOpacity(liquidColor, 0.24) }]} />
            <View style={[styles.liquidSurface, { backgroundColor: withOpacity(surfaceColor, 0.76) }]} />
            <View style={styles.liquidHighlight} />
          </View>
        </MaskedView>

        <Image source={teapotEmptyImage} style={styles.layerImage} resizeMode="contain" />
        <Image source={teapotMaskImage} style={styles.glossImage} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 156,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  teapotBox: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  layerFill: {
    ...StyleSheet.absoluteFillObject,
  },
  layerImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  liquidFill: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '30%',
    bottom: '12%',
    borderTopLeftRadius: 92,
    borderTopRightRadius: 92,
    borderBottomLeftRadius: 104,
    borderBottomRightRadius: 104,
  },
  liquidDepth: {
    position: 'absolute',
    left: '22%',
    right: '22%',
    top: '49%',
    bottom: '10%',
    borderRadius: 86,
  },
  liquidSurface: {
    position: 'absolute',
    left: '21%',
    right: '21%',
    top: '31%',
    height: '9%',
    borderRadius: 999,
  },
  liquidHighlight: {
    position: 'absolute',
    left: '31%',
    right: '31%',
    top: '29%',
    height: '4%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.12,
  },
  glossImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    opacity: 0.45,
  },
});

import { Image, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { CustomBlendOption } from '@/lib/customBlendEngine';
import { customBlendBaseIngredientId, CustomBlendIngredientId } from '@/lib/customBlendIngredients';

interface CustomBlendCupVisualProps {
  option: CustomBlendOption;
  blendRatios: Partial<Record<CustomBlendIngredientId, number>>;
}

const teapotEmptyImage = require('../assets/images/detox_order/teapot_empty.png');
const teapotMaskImage = require('../assets/images/detox_order/teapot_mask.png');

const ingredientLiquidColors: Partial<Record<CustomBlendIngredientId, string>> = {
  cacaoNib: '#6B4737',
  earlGreyBlackTea: '#7B5642',
  oolong: '#9A7B52',
  rooibos: '#BC7350',
  hibiscus: '#D56782',
  mint: '#9BC8B1',
  lemongrass: '#CBC26C',
  orangePeel: '#E3A15E',
  bergamot: '#C89D62',
  hazelnut: '#A47654',
  rosehip: '#C97C7B',
  raisin: '#87525B',
  cornflower: '#97A7D4',
  cacaoHusk: '#8C5E49',
  lycheeFlavor: '#D8A7B2',
  grapefruitPeel: '#D98C68',
  lemonPeel: '#D8C36F',
  peppermint: '#9FCFCA',
  appleChip: '#CB986D',
  cinnamon: '#A26A4C',
};

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map((part) => part + part).join('')
    : sanitized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
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
  const target = 255;

  return rgbToHex(
    rgb.r + (target - rgb.r) * ratio,
    rgb.g + (target - rgb.g) * ratio,
    rgb.b + (target - rgb.b) * ratio
  );
}

function withOpacity(hex: string, opacity: number) {
  const sanitized = hex.replace('#', '');
  const alpha = Math.max(0, Math.min(255, Math.round(opacity * 255))).toString(16).padStart(2, '0');
  return `#${sanitized}${alpha}`;
}

function getLiquidColor(
  option: CustomBlendOption,
  blendRatios: Partial<Record<CustomBlendIngredientId, number>>
) {
  const colorEntries = option.ingredientIds.map((ingredientId) => ({
    color: ingredientLiquidColors[ingredientId] || '#B98A6B',
    weight: ingredientId === customBlendBaseIngredientId
      ? (option.baseRatio ?? 25) * 0.45
      : (blendRatios[ingredientId] ?? 0) * 1.25,
  }));

  const mixedColor = mixColors(colorEntries);
  const dominantExtraIngredient = option.ingredientIds
    .filter((ingredientId) => ingredientId !== customBlendBaseIngredientId)
    .sort((left, right) => (blendRatios[right] ?? 0) - (blendRatios[left] ?? 0))[0];
  const accentColor = ingredientLiquidColors[dominantExtraIngredient] || mixedColor;

  return mixColors([
    { color: mixedColor, weight: 0.58 },
    { color: accentColor, weight: 0.42 },
  ]);
}

export function CustomBlendCupVisual({
  option,
  blendRatios,
}: CustomBlendCupVisualProps) {
  const liquidColor = getLiquidColor(option, blendRatios);
  const surfaceColor = tintColor(liquidColor, 0.28);

  return (
    <View style={styles.wrap}>
      <View style={styles.teapotBox}>
        <MaskedView
          style={styles.layerFill}
          maskElement={
            <Image
              source={teapotMaskImage}
              style={styles.layerImage}
              resizeMode="contain"
            />
          }
        >
          <View style={styles.layerFill}>
            <View style={[styles.liquidFill, { backgroundColor: withOpacity(liquidColor, 0.62) }]} />
            <View style={[styles.liquidDepth, { backgroundColor: withOpacity(liquidColor, 0.24) }]} />
            <View style={[styles.liquidSurface, { backgroundColor: withOpacity(surfaceColor, 0.72) }]} />
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
    width: 176,
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.5,
  },
});

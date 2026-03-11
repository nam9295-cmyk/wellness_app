import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { atelierColors, atelierText } from '@/lib/atelierTheme';

interface Props<T> {
  options: readonly T[];
  selectedValue: T;
  onSelect: (value: T) => void;
}

export function OptionChips<T extends string | number>({ options, selectedValue, onSelect }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = opt === selectedValue;
        return (
          <TouchableOpacity
            key={String(opt)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: atelierColors.surface,
    borderWidth: 1,
    borderColor: atelierColors.border,
  },
  chipSelected: {
    backgroundColor: atelierColors.deepGreen,
    borderColor: atelierColors.deepGreen,
  },
  text: {
    ...atelierText.bodyMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    color: atelierColors.surface,
    fontWeight: '700',
  }
});

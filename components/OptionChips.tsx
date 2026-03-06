import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/theme';

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
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    color: colors.card,
    fontWeight: 'bold',
  }
});

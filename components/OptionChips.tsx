import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/theme';

interface Props<T> {
  options: T[];
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  text: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    color: '#004d00',
    fontWeight: 'bold',
  }
});

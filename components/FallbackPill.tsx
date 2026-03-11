import { StyleSheet, Text, View } from 'react-native';

interface FallbackPillProps {
  label: string;
  inline?: boolean;
}

export function FallbackPill({ label, inline = false }: FallbackPillProps) {
  return (
    <View style={[styles.pill, inline && styles.pillInline]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F8F3ED',
    borderWidth: 1,
    borderColor: '#E3D8CD',
  },
  pillInline: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  label: {
    fontSize: 11,
    color: '#8B817A',
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
